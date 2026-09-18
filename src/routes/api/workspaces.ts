import { env } from "cloudflare:workers";
import { createFileRoute } from "@tanstack/react-router";
import { and, asc, desc, eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import { z } from "zod";
import { workspaceAddresses, workspaceMembers, workspaces } from "#/db/schema";
import { auth } from "#/lib/auth";
import { meetingAddressInput } from "#/lib/workspace-addresses";

const workspaceInput = z.object({
	name: z.string().trim().min(2).max(80),
	slug: z
		.string()
		.trim()
		.min(2)
		.max(60)
		.regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
	locality: z.string().trim().min(1).max(100),
	region: z.string().trim().max(100).optional(),
	countryCode: z.string().trim().length(2).toUpperCase(),
	timezone: z.string().trim().min(1).max(100),
	addresses: z.array(meetingAddressInput).min(1).max(10),
});

async function getSession(request: Request) {
	return auth.api.getSession({ headers: request.headers });
}

function workspaceInputError(error: z.ZodError) {
	const hasAddressIssue = error.issues.some(
		(issue) => issue.path[0] === "addresses",
	);
	if (hasAddressIssue) {
		return "Add at least one complete meeting address";
	}
	return "Check the group details and try again";
}

async function getMeetingAddresses(
	db: ReturnType<typeof drizzle>,
	workspaceId: string,
) {
	return db
		.select({
			id: workspaceAddresses.id,
			label: workspaceAddresses.label,
			street: workspaceAddresses.street,
			locality: workspaceAddresses.locality,
			region: workspaceAddresses.region,
			postalCode: workspaceAddresses.postalCode,
			countryCode: workspaceAddresses.countryCode,
		})
		.from(workspaceAddresses)
		.where(eq(workspaceAddresses.workspaceId, workspaceId))
		.orderBy(asc(workspaceAddresses.sortOrder));
}

async function getWorkspaceAccess(request: Request) {
	const currentSession = await getSession(request);
	if (!currentSession) {
		return {
			response: Response.json({ error: "Unauthorized" }, { status: 401 }),
		};
	}

	const slug = new URL(request.url).searchParams.get("slug");
	if (!slug) {
		return {
			response: Response.json(
				{ error: "A group slug is required" },
				{ status: 400 },
			),
		};
	}

	const db = drizzle(env.DB);
	const rows = await db
		.select({
			id: workspaces.id,
			name: workspaces.name,
			slug: workspaces.slug,
			locality: workspaces.locality,
			region: workspaces.region,
			countryCode: workspaces.countryCode,
			timezone: workspaces.timezone,
			status: workspaces.status,
			createdAt: workspaces.createdAt,
			role: workspaceMembers.role,
		})
		.from(workspaces)
		.innerJoin(
			workspaceMembers,
			and(
				eq(workspaceMembers.workspaceId, workspaces.id),
				eq(workspaceMembers.userId, currentSession.user.id),
			),
		)
		.where(eq(workspaces.slug, slug))
		.limit(1);

	const workspace = rows[0];
	if (!workspace) {
		return {
			response: Response.json({ error: "Group not found" }, { status: 404 }),
		};
	}

	const addresses = await getMeetingAddresses(db, workspace.id);

	return { currentSession, db, workspace: { ...workspace, addresses } };
}

const getWorkspace = async ({ request }: { request: Request }) => {
	if (!new URL(request.url).searchParams.has("slug")) {
		const currentSession = await getSession(request);
		if (!currentSession) {
			return Response.json({ error: "Unauthorized" }, { status: 401 });
		}

		const db = drizzle(env.DB);
		const workspacesForUser = await db
			.select({
				id: workspaces.id,
				name: workspaces.name,
				slug: workspaces.slug,
				status: workspaces.status,
				role: workspaceMembers.role,
			})
			.from(workspaceMembers)
			.innerJoin(workspaces, eq(workspaces.id, workspaceMembers.workspaceId))
			.where(eq(workspaceMembers.userId, currentSession.user.id))
			.orderBy(desc(workspaceMembers.createdAt));

		return Response.json({ workspaces: workspacesForUser });
	}

	const access = await getWorkspaceAccess(request);
	if ("response" in access) return access.response;

	return Response.json({ workspace: access.workspace });
};

const createWorkspace = async ({ request }: { request: Request }) => {
	const currentSession = await getSession(request);
	if (!currentSession) {
		return Response.json({ error: "Unauthorized" }, { status: 401 });
	}

	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return Response.json({ error: "Invalid request body" }, { status: 400 });
	}

	const result = workspaceInput.safeParse(body);
	if (!result.success) {
		return Response.json(
			{ error: workspaceInputError(result.error) },
			{ status: 400 },
		);
	}

	try {
		Intl.DateTimeFormat(undefined, { timeZone: result.data.timezone });
	} catch {
		return Response.json(
			{ error: "Enter a valid IANA timezone, such as America/New_York" },
			{ status: 400 },
		);
	}

	const db = drizzle(env.DB);
	const existing = await db
		.select({ id: workspaces.id })
		.from(workspaces)
		.where(eq(workspaces.slug, result.data.slug))
		.limit(1);
	if (existing.length > 0) {
		return Response.json(
			{ error: "That group URL is already in use" },
			{ status: 409 },
		);
	}

	const workspaceId = crypto.randomUUID();
	const addresses = result.data.addresses.map((address, index) => ({
		id: crypto.randomUUID(),
		workspaceId,
		label: address.label || null,
		street: address.street,
		locality: address.locality,
		region: address.region || null,
		postalCode: address.postalCode || null,
		countryCode: address.countryCode,
		sortOrder: index,
	}));
	const { addresses: _inputAddresses, ...workspaceFields } = result.data;
	const workspace = {
		id: workspaceId,
		...workspaceFields,
		region: result.data.region || null,
		status: "active",
		createdByUserId: currentSession.user.id,
	};

	try {
		await db.batch([
			db.insert(workspaces).values(workspace),
			db.insert(workspaceMembers).values({
				workspaceId,
				userId: currentSession.user.id,
				role: "owner",
			}),
			db.insert(workspaceAddresses).values(addresses),
		]);
	} catch (error) {
		if (error instanceof Error && error.message.includes("UNIQUE")) {
			return Response.json(
				{ error: "That group URL is already in use" },
				{ status: 409 },
			);
		}
		throw error;
	}

	return Response.json(
		{ workspace: { ...workspace, addresses, role: "owner" } },
		{ status: 201 },
	);
};

const updateWorkspace = async ({ request }: { request: Request }) => {
	const access = await getWorkspaceAccess(request);
	if ("response" in access) return access.response;
	if (access.workspace.role !== "owner") {
		return Response.json(
			{ error: "Only group owners can change group settings" },
			{ status: 403 },
		);
	}

	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return Response.json({ error: "Invalid request body" }, { status: 400 });
	}

	const result = workspaceInput.safeParse(body);
	if (!result.success) {
		return Response.json(
			{ error: workspaceInputError(result.error) },
			{ status: 400 },
		);
	}

	try {
		Intl.DateTimeFormat(undefined, { timeZone: result.data.timezone });
	} catch {
		return Response.json(
			{ error: "Enter a valid IANA timezone, such as America/New_York" },
			{ status: 400 },
		);
	}

	try {
		const updateResult = await access.db.run(sql`
			UPDATE workspace
			SET name = ${result.data.name},
				slug = ${result.data.slug},
				locality = ${result.data.locality},
				region = ${result.data.region || null},
				country_code = ${result.data.countryCode},
				timezone = ${result.data.timezone},
				updated_at = unixepoch()
			WHERE id = ${access.workspace.id}
				AND EXISTS (
					SELECT 1
					FROM workspace_member
					WHERE workspace_id = ${access.workspace.id}
						AND user_id = ${access.currentSession.user.id}
						AND role = 'owner'
				)
		`);

		if (updateResult.meta.changes !== 1) {
			return Response.json(
				{ error: "Your permissions changed. Refresh and try again." },
				{ status: 409 },
			);
		}

		const addresses = result.data.addresses.map((address, index) => ({
			id: crypto.randomUUID(),
			workspaceId: access.workspace.id,
			label: address.label || null,
			street: address.street,
			locality: address.locality,
			region: address.region || null,
			postalCode: address.postalCode || null,
			countryCode: address.countryCode,
			sortOrder: index,
		}));
		await access.db.batch([
			access.db
				.delete(workspaceAddresses)
				.where(eq(workspaceAddresses.workspaceId, access.workspace.id)),
			access.db.insert(workspaceAddresses).values(addresses),
		]);
	} catch (error) {
		if (error instanceof Error && error.message.includes("UNIQUE")) {
			return Response.json(
				{ error: "That group URL is already in use" },
				{ status: 409 },
			);
		}
		throw error;
	}

	return Response.json({
		workspace: {
			...access.workspace,
			...result.data,
			region: result.data.region || null,
			addresses: await getMeetingAddresses(access.db, access.workspace.id),
		},
	});
};

const deleteWorkspace = async ({ request }: { request: Request }) => {
	const access = await getWorkspaceAccess(request);
	if ("response" in access) return access.response;
	if (access.workspace.role !== "owner") {
		return Response.json(
			{ error: "Only group owners can delete a group" },
			{ status: 403 },
		);
	}

	const deleteResult = await access.db.run(sql`
		DELETE FROM workspace
		WHERE id = ${access.workspace.id}
			AND EXISTS (
				SELECT 1
				FROM workspace_member
				WHERE workspace_id = ${access.workspace.id}
					AND user_id = ${access.currentSession.user.id}
					AND role = 'owner'
			)
	`);

	if (deleteResult.meta.changes < 1) {
		return Response.json(
			{ error: "Your permissions changed. Refresh and try again." },
			{ status: 409 },
		);
	}

	return new Response(null, { status: 204 });
};

export const Route = createFileRoute("/api/workspaces")({
	server: {
		handlers: {
			GET: getWorkspace,
			POST: createWorkspace,
			PATCH: updateWorkspace,
			DELETE: deleteWorkspace,
		},
	},
});
