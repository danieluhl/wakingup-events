import { env } from "cloudflare:workers";
import { createFileRoute } from "@tanstack/react-router";
import { and, asc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import { events, users, workspaceMembers, workspaces } from "#/db/schema";
import { auth } from "#/lib/auth";
import { eventInput } from "#/lib/events";
import { canManageEvents, isWorkspaceRole } from "#/lib/workspace-roles";

async function getEventAccess(request: Request) {
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
			timezone: workspaces.timezone,
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

	if (!isWorkspaceRole(workspace.role) || !canManageEvents(workspace.role)) {
		return {
			response: Response.json(
				{ error: "Only organizers and above can manage events" },
				{ status: 403 },
			),
		};
	}

	return { currentSession, db, workspace };
}

const getEvents = async ({ request }: { request: Request }) => {
	const access = await getEventAccess(request);
	if ("response" in access) return access.response;

	const eventRows = await access.db
		.select({
			id: events.id,
			title: events.title,
			startsAt: events.startsAt,
			durationMinutes: events.durationMinutes,
			location: events.location,
			organizerUserId: events.organizerUserId,
			organizerName: users.name,
		})
		.from(events)
		.innerJoin(users, eq(users.id, events.organizerUserId))
		.where(eq(events.workspaceId, access.workspace.id))
		.orderBy(asc(events.startsAt), asc(events.id));

	return Response.json({
		workspace: access.workspace,
		events: eventRows,
	});
};

const createEvent = async ({ request }: { request: Request }) => {
	const access = await getEventAccess(request);
	if ("response" in access) return access.response;

	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return Response.json({ error: "Invalid request body" }, { status: 400 });
	}

	const result = eventInput.safeParse(body);
	if (!result.success) {
		return Response.json(
			{ error: "Check the event details and try again" },
			{ status: 400 },
		);
	}

	const startsAt = new Date(result.data.startsAt);
	if (Number.isNaN(startsAt.getTime())) {
		return Response.json(
			{ error: "Enter a valid date and time for the event" },
			{ status: 400 },
		);
	}

	const organizerRows = await access.db
		.select({
			userId: users.id,
			name: users.name,
			role: workspaceMembers.role,
		})
		.from(workspaceMembers)
		.innerJoin(users, eq(users.id, workspaceMembers.userId))
		.where(
			and(
				eq(workspaceMembers.workspaceId, access.workspace.id),
				eq(workspaceMembers.userId, result.data.organizerUserId),
			),
		)
		.limit(1);

	const organizer = organizerRows[0];
	if (
		!organizer ||
		!isWorkspaceRole(organizer.role) ||
		!canManageEvents(organizer.role)
	) {
		return Response.json(
			{ error: "Choose an organizer, admin, or owner for this event" },
			{ status: 400 },
		);
	}

	const event = {
		id: crypto.randomUUID(),
		workspaceId: access.workspace.id,
		title: result.data.title,
		startsAt,
		durationMinutes: result.data.durationMinutes,
		location: result.data.location,
		organizerUserId: result.data.organizerUserId,
		createdByUserId: access.currentSession.user.id,
	};

	await access.db.insert(events).values(event);

	return Response.json(
		{
			event: {
				...event,
				startsAt: startsAt.toISOString(),
				organizerName: organizer.name,
			},
		},
		{ status: 201 },
	);
};

export const Route = createFileRoute("/api/events")({
	server: {
		handlers: {
			GET: getEvents,
			POST: createEvent,
		},
	},
});
