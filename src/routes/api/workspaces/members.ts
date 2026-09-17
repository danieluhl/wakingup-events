import { env } from "cloudflare:workers";
import { createFileRoute } from "@tanstack/react-router";
import { and, asc, eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import { z } from "zod";
import { users, workspaceMembers, workspaces } from "#/db/schema";
import { auth } from "#/lib/auth";
import {
	canChangeWorkspaceRole,
	getWorkspaceRoleRank,
	isWorkspaceRole,
	workspaceRoles,
} from "#/lib/workspace-roles";

const updateMemberRoleInput = z.object({
	userId: z.string().min(1),
	role: z.enum(workspaceRoles),
});

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
				{ error: "A workspace slug is required" },
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
			response: Response.json(
				{ error: "Workspace not found" },
				{ status: 404 },
			),
		};
	}

	if (!isWorkspaceRole(workspace.role)) {
		return {
			response: Response.json(
				{ error: "Workspace has an invalid role configuration" },
				{ status: 500 },
			),
		};
	}

	return { db, currentSession, workspace };
}

const getMembers = async ({ request }: { request: Request }) => {
	const access = await getWorkspaceAccess(request);
	if ("response" in access) return access.response;

	const memberRows = await access.db
		.select({
			userId: users.id,
			name: users.name,
			email: users.email,
			image: users.image,
			role: workspaceMembers.role,
			createdAt: workspaceMembers.createdAt,
		})
		.from(workspaceMembers)
		.innerJoin(users, eq(users.id, workspaceMembers.userId))
		.where(eq(workspaceMembers.workspaceId, access.workspace.id))
		.orderBy(asc(users.name), asc(users.email));

	if (memberRows.some((member) => !isWorkspaceRole(member.role))) {
		return Response.json(
			{ error: "Workspace has an invalid role configuration" },
			{ status: 500 },
		);
	}

	const members = memberRows.sort(
		(a, b) =>
			getWorkspaceRoleRank(b.role) - getWorkspaceRoleRank(a.role) ||
			a.name.localeCompare(b.name),
	);

	return Response.json({
		workspace: access.workspace,
		currentUserId: access.currentSession.user.id,
		members,
	});
};

const updateMemberRole = async ({ request }: { request: Request }) => {
	const access = await getWorkspaceAccess(request);
	if ("response" in access) return access.response;

	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return Response.json({ error: "Invalid request body" }, { status: 400 });
	}

	const result = updateMemberRoleInput.safeParse(body);
	if (!result.success) {
		return Response.json(
			{ error: "Choose a valid workspace role" },
			{ status: 400 },
		);
	}

	const targetRows = await access.db
		.select({
			userId: users.id,
			name: users.name,
			email: users.email,
			image: users.image,
			role: workspaceMembers.role,
			createdAt: workspaceMembers.createdAt,
		})
		.from(workspaceMembers)
		.innerJoin(users, eq(users.id, workspaceMembers.userId))
		.where(
			and(
				eq(workspaceMembers.workspaceId, access.workspace.id),
				eq(workspaceMembers.userId, result.data.userId),
			),
		)
		.limit(1);

	const target = targetRows[0];
	if (!target) {
		return Response.json({ error: "Member not found" }, { status: 404 });
	}

	if (!isWorkspaceRole(target.role)) {
		return Response.json(
			{ error: "Member has an invalid role configuration" },
			{ status: 500 },
		);
	}

	if (
		!canChangeWorkspaceRole(
			access.workspace.role,
			target.role,
			result.data.role,
		)
	) {
		return Response.json(
			{ error: "You cannot manage this role" },
			{ status: 403 },
		);
	}

	if (target.role === result.data.role) {
		return Response.json({ member: target });
	}

	if (target.role === "owner" && result.data.role !== "owner") {
		const owners = await access.db
			.select({ userId: workspaceMembers.userId })
			.from(workspaceMembers)
			.where(
				and(
					eq(workspaceMembers.workspaceId, access.workspace.id),
					eq(workspaceMembers.role, "owner"),
				),
			)
			.limit(2);

		if (owners.length < 2) {
			return Response.json(
				{ error: "A workspace must always have at least one owner" },
				{ status: 409 },
			);
		}
	}

	const updateResult = await access.db.run(sql`
		UPDATE workspace_member AS target
		SET role = ${result.data.role}
		WHERE target.workspace_id = ${access.workspace.id}
			AND target.user_id = ${target.userId}
			AND EXISTS (
				SELECT 1
				FROM workspace_member AS actor
				WHERE actor.workspace_id = target.workspace_id
					AND actor.user_id = ${access.currentSession.user.id}
					AND (
						actor.role = 'owner'
						OR (
							actor.role = 'admin'
							AND target.role IN ('member', 'organizer', 'admin')
							AND ${result.data.role} IN ('member', 'organizer', 'admin')
						)
						OR (
							actor.role = 'organizer'
							AND target.role IN ('member', 'organizer')
							AND ${result.data.role} IN ('member', 'organizer')
						)
					)
			)
			AND (
				target.role <> 'owner'
				OR ${result.data.role} = 'owner'
				OR EXISTS (
					SELECT 1
					FROM workspace_member AS other_owner
					WHERE other_owner.workspace_id = target.workspace_id
						AND other_owner.role = 'owner'
						AND other_owner.user_id <> target.user_id
				)
			)
	`);

	if (updateResult.meta.changes !== 1) {
		return Response.json(
			{
				error: "Roles changed while you were editing. Refresh and try again.",
			},
			{ status: 409 },
		);
	}

	return Response.json({
		member: { ...target, role: result.data.role },
	});
};

export const Route = createFileRoute("/api/workspaces/members")({
	server: {
		handlers: {
			GET: getMembers,
			PATCH: updateMemberRole,
		},
	},
});
