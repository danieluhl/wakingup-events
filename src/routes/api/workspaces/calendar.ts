import { env } from "cloudflare:workers";
import { createFileRoute } from "@tanstack/react-router";
import { and, asc, eq, isNull } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import { events, users, workspaceMembers, workspaces } from "#/db/schema";
import { auth } from "#/lib/auth";
import {
	createCalendar,
	createCalendarEvent,
	getGoogleCalendarUrls,
	isGoogleCalendarConfigured,
	makeCalendarPublic,
} from "#/lib/google-calendar";
import { getWorkspaceRoleRank, isWorkspaceRole } from "#/lib/workspace-roles";

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
			timezone: workspaces.timezone,
			googleCalendarId: workspaces.googleCalendarId,
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

	if (!isWorkspaceRole(workspace.role)) {
		return {
			response: Response.json(
				{ error: "Group has an invalid role configuration" },
				{ status: 500 },
			),
		};
	}

	if (getWorkspaceRoleRank(workspace.role) < getWorkspaceRoleRank("admin")) {
		return {
			response: Response.json(
				{ error: "Only group admins and owners can set up the calendar" },
				{ status: 403 },
			),
		};
	}

	return { currentSession, db, workspace };
}

const setupCalendar = async ({ request }: { request: Request }) => {
	const access = await getWorkspaceAccess(request);
	if ("response" in access) return access.response;

	if (!isGoogleCalendarConfigured()) {
		return Response.json(
			{ error: "Calendar sync is not configured on the server yet." },
			{ status: 400 },
		);
	}

	let calendarId = access.workspace.googleCalendarId;
	let created = false;

	if (!calendarId) {
		try {
			calendarId = await createCalendar(
				access.workspace.name,
				access.workspace.timezone,
			);
			await makeCalendarPublic(calendarId);
		} catch (error) {
			console.error(
				"Could not create a Google calendar for this group",
				access.workspace.id,
				error,
			);
			return Response.json(
				{ error: "Could not reach Google Calendar. Try again shortly." },
				{ status: 502 },
			);
		}

		await access.db
			.update(workspaces)
			.set({ googleCalendarId: calendarId, updatedAt: new Date() })
			.where(eq(workspaces.id, access.workspace.id));
		created = true;
	}

	const pendingEvents = await access.db
		.select({
			id: events.id,
			title: events.title,
			startsAt: events.startsAt,
			durationMinutes: events.durationMinutes,
			location: events.location,
			organizerName: users.name,
		})
		.from(events)
		.innerJoin(users, eq(users.id, events.organizerUserId))
		.where(
			and(
				eq(events.workspaceId, access.workspace.id),
				isNull(events.googleEventId),
			),
		)
		.orderBy(asc(events.startsAt), asc(events.id));

	let syncedEvents = 0;
	for (const event of pendingEvents) {
		try {
			const googleEventId = await createCalendarEvent(calendarId, {
				title: event.title,
				startsAt: event.startsAt,
				durationMinutes: event.durationMinutes,
				location: event.location,
				description: `Hosted by ${event.organizerName} for ${access.workspace.name}.`,
				timeZone: access.workspace.timezone,
			});
			await access.db
				.update(events)
				.set({ googleEventId })
				.where(eq(events.id, event.id));
			syncedEvents += 1;
		} catch (error) {
			console.error(
				"Could not add an event to the group calendar",
				event.id,
				error,
			);
		}
	}

	return Response.json({
		calendar: getGoogleCalendarUrls(calendarId, access.workspace.timezone),
		created,
		syncedEvents,
	});
};

export const Route = createFileRoute("/api/workspaces/calendar")({
	server: {
		handlers: {
			POST: setupCalendar,
		},
	},
});
