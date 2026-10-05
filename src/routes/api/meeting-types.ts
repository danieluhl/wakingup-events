import { env } from "cloudflare:workers";
import { createFileRoute } from "@tanstack/react-router";
import { and, asc, eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import { meetingTypes, workspaceMembers, workspaces } from "#/db/schema";
import { auth } from "#/lib/auth";
import {
	meetingTypeInput,
	meetingTypeToRecord,
	meetingTypeUpdateInput,
} from "#/lib/meeting-types";

async function getWorkspaceAccess(request: Request) {
	const currentSession = await auth.api.getSession({
		headers: request.headers,
	});
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

	return { db, currentSession, workspace };
}

async function findMeetingType(
	db: ReturnType<typeof drizzle>,
	workspaceId: string,
	id: string,
) {
	const rows = await db
		.select()
		.from(meetingTypes)
		.where(
			and(eq(meetingTypes.id, id), eq(meetingTypes.workspaceId, workspaceId)),
		)
		.limit(1);
	return rows[0];
}

const getMeetingTypes = async ({ request }: { request: Request }) => {
	const access = await getWorkspaceAccess(request);
	if ("response" in access) return access.response;

	const rows = await access.db
		.select()
		.from(meetingTypes)
		.where(eq(meetingTypes.workspaceId, access.workspace.id))
		.orderBy(asc(meetingTypes.sortOrder), asc(meetingTypes.createdAt));

	return Response.json({ meetingTypes: rows.map(meetingTypeToRecord) });
};

const createMeetingType = async ({ request }: { request: Request }) => {
	const access = await getWorkspaceAccess(request);
	if ("response" in access) return access.response;
	if (access.workspace.role !== "owner") {
		return Response.json(
			{ error: "Only group owners can change meeting types" },
			{ status: 403 },
		);
	}

	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return Response.json({ error: "Invalid request body" }, { status: 400 });
	}

	const result = meetingTypeInput.safeParse(body);
	if (!result.success) {
		return Response.json(
			{ error: "Check the meeting type details and try again" },
			{ status: 400 },
		);
	}

	const maxRows = await access.db
		.select({ max: sql<number | null>`max(${meetingTypes.sortOrder})` })
		.from(meetingTypes)
		.where(eq(meetingTypes.workspaceId, access.workspace.id));

	const meetingType = {
		id: crypto.randomUUID(),
		workspaceId: access.workspace.id,
		title: result.data.title,
		description: result.data.description || null,
		alert: result.data.alert || null,
		instructions: result.data.instructions || null,
		sortOrder: (maxRows[0]?.max ?? -1) + 1,
	};

	await access.db.insert(meetingTypes).values(meetingType);

	return Response.json(
		{ meetingType: meetingTypeToRecord(meetingType) },
		{ status: 201 },
	);
};

const updateMeetingType = async ({ request }: { request: Request }) => {
	const access = await getWorkspaceAccess(request);
	if ("response" in access) return access.response;
	if (access.workspace.role !== "owner") {
		return Response.json(
			{ error: "Only group owners can change meeting types" },
			{ status: 403 },
		);
	}

	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return Response.json({ error: "Invalid request body" }, { status: 400 });
	}

	const result = meetingTypeUpdateInput.safeParse(body);
	if (!result.success) {
		return Response.json(
			{ error: "Check the meeting type details and try again" },
			{ status: 400 },
		);
	}

	const existing = await findMeetingType(
		access.db,
		access.workspace.id,
		result.data.id,
	);
	if (!existing) {
		return Response.json({ error: "Meeting type not found" }, { status: 404 });
	}

	const updated = {
		title: result.data.title,
		description: result.data.description || null,
		alert: result.data.alert || null,
		instructions: result.data.instructions || null,
		updatedAt: new Date(),
	};

	await access.db
		.update(meetingTypes)
		.set(updated)
		.where(eq(meetingTypes.id, result.data.id));

	return Response.json({
		meetingType: meetingTypeToRecord({ ...existing, ...updated }),
	});
};

const deleteMeetingType = async ({ request }: { request: Request }) => {
	const access = await getWorkspaceAccess(request);
	if ("response" in access) return access.response;
	if (access.workspace.role !== "owner") {
		return Response.json(
			{ error: "Only group owners can change meeting types" },
			{ status: 403 },
		);
	}

	const id = new URL(request.url).searchParams.get("id");
	if (!id) {
		return Response.json(
			{ error: "A meeting type id is required" },
			{ status: 400 },
		);
	}

	const existing = await findMeetingType(access.db, access.workspace.id, id);
	if (!existing) {
		return Response.json({ error: "Meeting type not found" }, { status: 404 });
	}

	await access.db.delete(meetingTypes).where(eq(meetingTypes.id, id));

	return new Response(null, { status: 204 });
};

export const Route = createFileRoute("/api/meeting-types")({
	server: {
		handlers: {
			GET: getMeetingTypes,
			POST: createMeetingType,
			PATCH: updateMeetingType,
			DELETE: deleteMeetingType,
		},
	},
});
