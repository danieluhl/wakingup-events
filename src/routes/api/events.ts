import { env } from "cloudflare:workers";
import { createFileRoute } from "@tanstack/react-router";
import { and, asc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import {
	events,
	meetingTypes,
	users,
	workspaceMembers,
	workspaces,
} from "#/db/schema";
import { auth } from "#/lib/auth";
import { eventInput, eventUpdateInput } from "#/lib/events";
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
	const slug = new URL(request.url).searchParams.get("slug");
	if (!slug) {
		return Response.json(
			{ error: "A group slug is required" },
			{ status: 400 },
		);
	}

	const db = drizzle(env.DB);
	const currentSession = await auth.api.getSession({
		headers: request.headers,
	});

	const workspaceRows = await db
		.select({
			id: workspaces.id,
			name: workspaces.name,
			slug: workspaces.slug,
			timezone: workspaces.timezone,
		})
		.from(workspaces)
		.where(eq(workspaces.slug, slug))
		.limit(1);

	const workspace = workspaceRows[0];
	if (!workspace) {
		return Response.json({ error: "Group not found" }, { status: 404 });
	}

	let role: string | null = null;
	if (currentSession) {
		const memberRows = await db
			.select({ role: workspaceMembers.role })
			.from(workspaceMembers)
			.where(
				and(
					eq(workspaceMembers.workspaceId, workspace.id),
					eq(workspaceMembers.userId, currentSession.user.id),
				),
			)
			.limit(1);
		role = memberRows[0]?.role ?? null;
	}

	const canManage =
		role !== null && isWorkspaceRole(role) && canManageEvents(role);

	const eventRows = await db
		.select({
			id: events.id,
			title: events.title,
			startsAt: events.startsAt,
			durationMinutes: events.durationMinutes,
			location: events.location,
			organizerUserId: events.organizerUserId,
			organizerName: users.name,
			meetingTypeId: events.meetingTypeId,
			meetingTypeTitle: meetingTypes.title,
			attendanceCount: events.attendanceCount,
			postEventNotes: events.postEventNotes,
			postEventUpdatedAt: events.postEventUpdatedAt,
		})
		.from(events)
		.innerJoin(users, eq(users.id, events.organizerUserId))
		.leftJoin(meetingTypes, eq(meetingTypes.id, events.meetingTypeId))
		.where(eq(events.workspaceId, workspace.id))
		.orderBy(asc(events.startsAt), asc(events.id));

	return Response.json({
		workspace: { ...workspace, role },
		currentUserId: currentSession?.user.id ?? null,
		events: eventRows.map((event) => ({
			...event,
			startsAt: event.startsAt.toISOString(),
			attendanceCount: canManage ? event.attendanceCount : null,
			postEventNotes: canManage ? event.postEventNotes : null,
			postEventUpdatedAt: canManage
				? (event.postEventUpdatedAt?.toISOString() ?? null)
				: null,
		})),
	});
};

const updateEvent = async ({ request }: { request: Request }) => {
	const access = await getEventAccess(request);
	if ("response" in access) return access.response;

	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return Response.json({ error: "Invalid request body" }, { status: 400 });
	}

	const result = eventUpdateInput.safeParse(body);
	if (!result.success) {
		return Response.json(
			{ error: "Check the event update and try again" },
			{ status: 400 },
		);
	}

	const eventRows = await access.db
		.select({ id: events.id })
		.from(events)
		.where(
			and(
				eq(events.id, result.data.eventId),
				eq(events.workspaceId, access.workspace.id),
			),
		)
		.limit(1);

	if (!eventRows[0]) {
		return Response.json({ error: "Event not found" }, { status: 404 });
	}

	const now = new Date();
	const notes = result.data.notes?.length ? result.data.notes : null;

	await access.db
		.update(events)
		.set({
			attendanceCount: result.data.attendanceCount,
			postEventNotes: notes,
			postEventUpdatedAt: now,
			updatedAt: now,
		})
		.where(eq(events.id, result.data.eventId));

	return Response.json({
		event: {
			id: result.data.eventId,
			attendanceCount: result.data.attendanceCount,
			postEventNotes: notes,
			postEventUpdatedAt: now.toISOString(),
		},
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

	let meetingTypeId: string | null = null;
	if (result.data.meetingTypeId) {
		const meetingTypeRows = await access.db
			.select({ id: meetingTypes.id })
			.from(meetingTypes)
			.where(
				and(
					eq(meetingTypes.id, result.data.meetingTypeId),
					eq(meetingTypes.workspaceId, access.workspace.id),
				),
			)
			.limit(1);

		if (!meetingTypeRows[0]) {
			return Response.json(
				{ error: "Choose a meeting type from this group" },
				{ status: 400 },
			);
		}

		meetingTypeId = result.data.meetingTypeId;
	}

	const event = {
		id: crypto.randomUUID(),
		workspaceId: access.workspace.id,
		meetingTypeId,
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
			PATCH: updateEvent,
		},
	},
});
