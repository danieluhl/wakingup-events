export const workspaceRoles = [
	"member",
	"organizer",
	"admin",
	"owner",
] as const;

export type WorkspaceRole = (typeof workspaceRoles)[number];
export type WorkspaceInvitationRole = Exclude<WorkspaceRole, "owner">;

export const workspaceRoleLabels: Record<WorkspaceRole, string> = {
	member: "Member",
	organizer: "Organizer",
	admin: "Admin",
	owner: "Owner",
};

export const workspaceRoleDescriptions: Record<WorkspaceRole, string> = {
	member: "Participates in the workspace without managing roles.",
	organizer: "Can manage members and organizer access.",
	admin: "Can manage members, organizers, and admins.",
	owner: "Can manage every role, including other owners.",
};

const workspaceRoleRanks: Record<WorkspaceRole, number> = {
	member: 0,
	organizer: 1,
	admin: 2,
	owner: 3,
};

export function isWorkspaceRole(value: string): value is WorkspaceRole {
	return (workspaceRoles as readonly string[]).includes(value);
}

export function getWorkspaceRoleRank(role: WorkspaceRole) {
	return workspaceRoleRanks[role];
}

export function getAssignableWorkspaceRoles(
	actorRole: WorkspaceRole,
): WorkspaceRole[] {
	const actorRank = getWorkspaceRoleRank(actorRole);
	if (actorRank === 0) return [];

	return workspaceRoles.filter(
		(role) => getWorkspaceRoleRank(role) <= actorRank,
	);
}

export function canManageEvents(role: WorkspaceRole) {
	return getWorkspaceRoleRank(role) >= getWorkspaceRoleRank("organizer");
}

export function canChangeWorkspaceRole(
	actorRole: WorkspaceRole,
	targetRole: WorkspaceRole,
	nextRole: WorkspaceRole,
) {
	const actorRank = getWorkspaceRoleRank(actorRole);
	return (
		actorRank > 0 &&
		getWorkspaceRoleRank(targetRole) <= actorRank &&
		getWorkspaceRoleRank(nextRole) <= actorRank
	);
}
