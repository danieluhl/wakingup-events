import { env } from "cloudflare:workers";
import { createFileRoute } from "@tanstack/react-router";
import { and, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import { z } from "zod";
import { workspaceMembers, workspaces } from "#/db/schema";
import { auth } from "#/lib/auth";

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
});

async function getSession(request: Request) {
	return auth.api.getSession({ headers: request.headers });
}

const getWorkspace = async ({ request }: { request: Request }) => {
	const currentSession = await getSession(request);
	if (!currentSession) {
		return Response.json({ error: "Unauthorized" }, { status: 401 });
	}

	const slug = new URL(request.url).searchParams.get("slug");
	if (!slug) {
		return Response.json(
			{ error: "A group slug is required" },
			{ status: 400 },
		);
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
		return Response.json({ error: "Group not found" }, { status: 404 });
	}

	return Response.json({ workspace });
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
			{ error: "Check the group details and try again" },
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
	const workspace = {
		id: workspaceId,
		...result.data,
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
		{ workspace: { ...workspace, role: "owner" } },
		{ status: 201 },
	);
};

export const Route = createFileRoute("/api/workspaces")({
	server: {
		handlers: {
			GET: getWorkspace,
			POST: createWorkspace,
		},
	},
});
