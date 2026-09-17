import { createFileRoute, Link } from "@tanstack/react-router";
import { CircleAlert, Eye, Info, ShieldCheck, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "#/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "#/components/ui/avatar";
import { Badge } from "#/components/ui/badge";
import { Button, buttonVariants } from "#/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "#/components/ui/card";
import { Label } from "#/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "#/components/ui/select";
import { Separator } from "#/components/ui/separator";
import { Skeleton } from "#/components/ui/skeleton";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "#/components/ui/tooltip";
import { authClient } from "#/lib/auth-client";
import {
	canChangeWorkspaceRole,
	getAssignableWorkspaceRoles,
	getWorkspaceRoleRank,
	isWorkspaceRole,
	type WorkspaceRole,
	workspaceRoleLabels,
} from "#/lib/workspace-roles";

interface WorkspaceMember {
	userId: string;
	name: string;
	email: string;
	image: string | null;
	role: WorkspaceRole;
	createdAt: string;
}

interface RolesData {
	workspace: {
		id: string;
		name: string;
		slug: string;
		role: WorkspaceRole;
	};
	currentUserId: string;
	members: WorkspaceMember[];
}

export const Route = createFileRoute("/groups/$slug_/roles")({
	component: WorkspaceRoles,
});

function getInitials(name: string) {
	return name
		.split(/\s+/)
		.filter(Boolean)
		.slice(0, 2)
		.map((part) => part.charAt(0).toUpperCase())
		.join("");
}

function WorkspaceRoles() {
	const { slug } = Route.useParams();
	const { data: session, isPending: isSessionPending } =
		authClient.useSession();
	const [roles, setRoles] = useState<RolesData | null>(null);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (!session?.user) return;

		const controller = new AbortController();
		setRoles(null);
		setError(null);

		void fetch(`/api/workspaces/members?slug=${encodeURIComponent(slug)}`, {
			signal: controller.signal,
		})
			.then(async (response) => {
				const result = (await response.json()) as {
					error?: string;
					workspace?: RolesData["workspace"];
					currentUserId?: string;
					members?: WorkspaceMember[];
				};

				if (
					!response.ok ||
					!result.workspace ||
					!result.currentUserId ||
					!result.members ||
					!isWorkspaceRole(result.workspace.role) ||
					result.members.some((member) => !isWorkspaceRole(member.role))
				) {
					throw new Error(result.error ?? "Could not load workspace roles");
				}

				return {
					workspace: result.workspace,
					currentUserId: result.currentUserId,
					members: result.members,
				};
			})
			.then(setRoles)
			.catch((fetchError: unknown) => {
				if (fetchError instanceof Error && fetchError.name !== "AbortError") {
					setError(fetchError.message);
				}
			});

		return () => controller.abort();
	}, [session?.user, slug]);

	if (isSessionPending || (session?.user && !roles && !error)) {
		return (
			<main className="page-wrap min-h-[calc(100dvh-4rem)] py-16">
				<div className="mx-auto grid max-w-5xl gap-6">
					<Skeleton className="h-5 w-40" />
					<Skeleton className="h-56 rounded-2xl" />
					<Skeleton className="h-96 rounded-2xl" />
				</div>
			</main>
		);
	}

	if (!session?.user) {
		return (
			<main className="page-wrap flex min-h-[calc(100dvh-4rem)] items-center py-16">
				<Card className="island-shell mx-auto max-w-lg">
					<CardHeader>
						<CardTitle>Sign in to view roles</CardTitle>
						<CardDescription>
							Workspace membership details are available only to participants.
						</CardDescription>
					</CardHeader>
					<CardContent>
						<Link to="/login" className={buttonVariants()}>
							Sign in
						</Link>
					</CardContent>
				</Card>
			</main>
		);
	}

	if (!roles) {
		return (
			<main className="page-wrap min-h-[calc(100dvh-4rem)] py-16">
				<Alert variant="destructive" className="mx-auto max-w-xl">
					<CircleAlert />
					<AlertTitle>Roles unavailable</AlertTitle>
					<AlertDescription>{error}</AlertDescription>
				</Alert>
			</main>
		);
	}

	const ownerCount = roles.members.filter(
		(member) => member.role === "owner",
	).length;
	const isReadOnly = roles.workspace.role === "member";

	const updateMember = (updatedMember: WorkspaceMember) => {
		setRoles((current) => {
			if (!current) return current;

			const members = current.members.map((member) =>
				member.userId === updatedMember.userId ? updatedMember : member,
			);
			members.sort(
				(a, b) =>
					getWorkspaceRoleRank(b.role) - getWorkspaceRoleRank(a.role) ||
					a.name.localeCompare(b.name),
			);

			return {
				...current,
				workspace:
					updatedMember.userId === current.currentUserId
						? { ...current.workspace, role: updatedMember.role }
						: current.workspace,
				members,
			};
		});
	};

	return (
		<main className="page-wrap min-h-[calc(100dvh-4rem)] py-10 sm:py-16">
			<div className="mx-auto grid max-w-5xl gap-7">
				<Link
					to="/groups/$slug"
					params={{ slug }}
					className="w-fit text-sm text-[var(--sea-ink-soft)]"
				>
					Back to {roles.workspace.name}
				</Link>

				<header className="grid gap-3">
					<Badge variant="outline" className="island-kicker w-fit">
						<ShieldCheck />
						Workspace access
					</Badge>
					<h1 className="display-title text-4xl font-semibold sm:text-5xl">
						Roles
					</h1>
					<p className="max-w-2xl leading-7 text-[var(--sea-ink-soft)]">
						Update roles for people in this group
					</p>
				</header>

				{isReadOnly && (
					<Alert>
						<Eye />
						<AlertTitle>View-only access</AlertTitle>
						<AlertDescription>
							Members can see who participates in this workspace but cannot
							change roles.
						</AlertDescription>
					</Alert>
				)}

				<Card className="island-shell overflow-hidden rounded-2xl p-0">
					<CardHeader className="px-6 pt-7 sm:px-9 sm:pt-9">
						<div className="flex items-center gap-3">
							<Users className="size-5 text-[var(--lagoon-deep)]" />
							<CardTitle id="workspace-members-heading">
								People and roles
							</CardTitle>
						</div>
						<CardDescription>
							{roles.members.length}{" "}
							{roles.members.length === 1 ? "person" : "people"} in this
							workspace
						</CardDescription>
					</CardHeader>
					<CardContent className="px-6 pb-7 sm:px-9 sm:pb-9">
						<ul aria-labelledby="workspace-members-heading">
							{roles.members.map((member, index) => (
								<li key={member.userId}>
									{index > 0 && <Separator />}
									<MemberRoleRow
										member={member}
										actorRole={roles.workspace.role}
										currentUserId={roles.currentUserId}
										isLastOwner={member.role === "owner" && ownerCount === 1}
										onUpdated={updateMember}
										workspaceSlug={slug}
									/>
								</li>
							))}
						</ul>
					</CardContent>
				</Card>
			</div>
		</main>
	);
}

function MemberRoleRow({
	member,
	actorRole,
	currentUserId,
	isLastOwner,
	onUpdated,
	workspaceSlug,
}: {
	member: WorkspaceMember;
	actorRole: WorkspaceRole;
	currentUserId: string;
	isLastOwner: boolean;
	onUpdated: (member: WorkspaceMember) => void;
	workspaceSlug: string;
}) {
	const [selectedRole, setSelectedRole] = useState<WorkspaceRole>(member.role);
	const [isUpdating, setIsUpdating] = useState(false);
	const [updateError, setUpdateError] = useState<string | null>(null);
	const canManage = canChangeWorkspaceRole(actorRole, member.role, member.role);
	const assignableRoles = getAssignableWorkspaceRoles(actorRole);

	const saveRole = async () => {
		setIsUpdating(true);
		setUpdateError(null);

		try {
			const response = await fetch(
				`/api/workspaces/members?slug=${encodeURIComponent(workspaceSlug)}`,
				{
					method: "PATCH",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						userId: member.userId,
						role: selectedRole,
					}),
				},
			);
			const result = (await response.json()) as {
				error?: string;
				member?: WorkspaceMember;
			};

			if (
				!response.ok ||
				!result.member ||
				!isWorkspaceRole(result.member.role)
			) {
				throw new Error(result.error ?? "Could not update this role");
			}

			setSelectedRole(result.member.role);
			onUpdated(result.member);
		} catch (saveError) {
			setUpdateError(
				saveError instanceof Error
					? saveError.message
					: "Could not update this role",
			);
		} finally {
			setIsUpdating(false);
		}
	};

	return (
		<div className="grid gap-4 py-5 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
			<div className="flex min-w-0 items-center gap-3">
				<Avatar size="lg">
					{member.image && <AvatarImage src={member.image} alt="" />}
					<AvatarFallback>{getInitials(member.name) || "M"}</AvatarFallback>
				</Avatar>
				<div className="min-w-0">
					<div className="flex flex-wrap items-center gap-2">
						<p className="truncate font-semibold">{member.name}</p>
						<Badge variant="outline">{workspaceRoleLabels[member.role]}</Badge>
						{member.userId === currentUserId && (
							<Badge variant="secondary">You</Badge>
						)}
					</div>
					<p className="truncate text-sm text-muted-foreground">
						{member.email}
					</p>
				</div>
			</div>

			{canManage ? (
				<div className="grid gap-2">
					<div className="flex flex-col gap-2 sm:flex-row sm:items-end">
						<div className="grid gap-2">
							<div className="flex items-center gap-1.5">
								<Label htmlFor={`role-${member.userId}`}>Role</Label>
								{isLastOwner && (
									<Tooltip>
										<TooltipTrigger asChild>
											<Button
												type="button"
												variant="ghost"
												size="icon"
												className="size-5 border-0 p-0 text-muted-foreground shadow-none [text-shadow:none] hover:border-transparent hover:bg-transparent"
												aria-label="Why the owner role cannot be changed"
											>
												<Info className="size-4" />
											</Button>
										</TooltipTrigger>
										<TooltipContent
											side="top"
											sideOffset={8}
											className="max-w-64"
										>
											Every group must have at least one owner. Add another
											owner before changing this role.
										</TooltipContent>
									</Tooltip>
								)}
							</div>
							<Select
								value={selectedRole}
								onValueChange={(value) => {
									if (isWorkspaceRole(value)) setSelectedRole(value);
								}}
								disabled={isUpdating}
							>
								<SelectTrigger
									id={`role-${member.userId}`}
									className="w-full sm:w-40"
								>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{assignableRoles.map((role) => (
										<SelectItem
											key={role}
											value={role}
											disabled={isLastOwner && role !== "owner"}
										>
											{workspaceRoleLabels[role]}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<Button
							type="button"
							size="sm"
							variant="outline"
							disabled={isUpdating || selectedRole === member.role}
							onClick={() => void saveRole()}
						>
							{isUpdating ? "Saving..." : "Save role"}
						</Button>
					</div>
					{updateError && (
						<Alert variant="destructive" className="max-w-sm py-2">
							<CircleAlert />
							<AlertDescription>{updateError}</AlertDescription>
						</Alert>
					)}
				</div>
			) : (
				<p className="max-w-xs text-sm text-muted-foreground md:text-right">
					{actorRole === "member"
						? "You have view-only access."
						: "This role is above your role tier."}
				</p>
			)}
		</div>
	);
}
