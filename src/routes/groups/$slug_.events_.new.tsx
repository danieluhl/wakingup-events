import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { CircleAlert, Plus } from "lucide-react";
import { type FormEvent, useEffect, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "#/components/ui/alert";
import { Badge } from "#/components/ui/badge";
import { Button, buttonVariants } from "#/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "#/components/ui/card";
import { Input } from "#/components/ui/input";
import { Label } from "#/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "#/components/ui/select";
import { Skeleton } from "#/components/ui/skeleton";
import { authClient } from "#/lib/auth-client";
import { zonedDateTimeInputDefault, zonedDateTimeToUtc } from "#/lib/events";
import {
	formatMeetingAddress,
	type StoredMeetingAddress,
} from "#/lib/workspace-addresses";
import {
	canManageEvents,
	isWorkspaceRole,
	type WorkspaceRole,
	workspaceRoleLabels,
} from "#/lib/workspace-roles";

interface WorkspaceDetails {
	id: string;
	name: string;
	slug: string;
	timezone: string;
	role: WorkspaceRole;
	addresses: StoredMeetingAddress[];
}

interface WorkspaceMember {
	userId: string;
	name: string;
	email: string;
	image: string | null;
	role: WorkspaceRole;
	createdAt: string;
}

const OTHER_LOCATION = "other";

export const Route = createFileRoute("/groups/$slug_/events_/new")({
	component: NewEvent,
});

function NewEvent() {
	const { slug } = Route.useParams();
	const navigate = useNavigate();
	const { data: session, isPending: isSessionPending } =
		authClient.useSession();
	const [workspace, setWorkspace] = useState<WorkspaceDetails | null>(null);
	const [members, setMembers] = useState<WorkspaceMember[] | null>(null);
	const [loadError, setLoadError] = useState<string | null>(null);

	const [title, setTitle] = useState("");
	const [startsAt, setStartsAt] = useState("");
	const [durationMinutes, setDurationMinutes] = useState("60");
	const [locationChoice, setLocationChoice] = useState("");
	const [customLocation, setCustomLocation] = useState("");
	const [organizerUserId, setOrganizerUserId] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (!session?.user) return;

		const controller = new AbortController();
		setWorkspace(null);
		setMembers(null);
		setLoadError(null);

		void Promise.all([
			fetch(`/api/workspaces?slug=${encodeURIComponent(slug)}`, {
				signal: controller.signal,
			}).then(async (response) => {
				const result = (await response.json()) as {
					error?: string;
					workspace?: WorkspaceDetails;
				};
				if (!response.ok || !result.workspace) {
					throw new Error(result.error ?? "Could not load the group");
				}
				return result.workspace;
			}),
			fetch(`/api/workspaces/members?slug=${encodeURIComponent(slug)}`, {
				signal: controller.signal,
			}).then(async (response) => {
				const result = (await response.json()) as {
					error?: string;
					currentUserId?: string;
					members?: WorkspaceMember[];
				};
				if (
					!response.ok ||
					!result.currentUserId ||
					!result.members ||
					result.members.some((member) => !isWorkspaceRole(member.role))
				) {
					throw new Error(result.error ?? "Could not load the group");
				}
				return {
					currentUserId: result.currentUserId,
					members: result.members,
				};
			}),
		])
			.then(([nextWorkspace, memberData]) => {
				setWorkspace(nextWorkspace);
				setMembers(memberData.members);
				setStartsAt(zonedDateTimeInputDefault(nextWorkspace.timezone));
				setLocationChoice(nextWorkspace.addresses[0]?.id ?? OTHER_LOCATION);

				const organizers = memberData.members.filter((member) =>
					canManageEvents(member.role),
				);
				const defaultOrganizer =
					organizers.find(
						(member) => member.userId === memberData.currentUserId,
					) ?? organizers[0];
				if (defaultOrganizer) {
					setOrganizerUserId(defaultOrganizer.userId);
				}
			})
			.catch((fetchError: unknown) => {
				if (fetchError instanceof Error && fetchError.name !== "AbortError") {
					setLoadError(fetchError.message);
				}
			});

		return () => controller.abort();
	}, [session?.user, slug]);

	const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		setError(null);

		if (!workspace) return;

		const organizerOptions =
			members?.filter((member) => canManageEvents(member.role)) ?? [];
		if (organizerOptions.length === 0) {
			setError("Add an organizer to this group before scheduling an event");
			return;
		}

		const startsAtUtc = zonedDateTimeToUtc(startsAt, workspace.timezone);
		if (!startsAtUtc) {
			setError("Enter a valid date and time for the event");
			return;
		}

		const selectedAddress = workspace.addresses.find(
			(address) => address.id === locationChoice,
		);
		const location =
			locationChoice === OTHER_LOCATION || !selectedAddress
				? customLocation.trim()
				: formatMeetingAddress(selectedAddress);
		if (location.length < 2) {
			setError("Enter where the event will take place");
			return;
		}

		setIsSubmitting(true);

		try {
			const response = await fetch(
				`/api/events?slug=${encodeURIComponent(slug)}`,
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						title,
						startsAt: startsAtUtc.toISOString(),
						durationMinutes: Number(durationMinutes),
						location,
						organizerUserId,
					}),
				},
			);
			const result = (await response.json()) as { error?: string };

			if (!response.ok) {
				throw new Error(result.error ?? "Could not create the event");
			}

			await navigate({
				to: "/groups/$slug/events",
				params: { slug },
			});
		} catch (submitError) {
			setError(
				submitError instanceof Error
					? submitError.message
					: "Could not create the event",
			);
			setIsSubmitting(false);
		}
	};

	if (isSessionPending || (session?.user && !workspace && !loadError)) {
		return (
			<main className="page-wrap min-h-[calc(100dvh-4rem)] py-16">
				<div className="mx-auto grid max-w-2xl gap-6">
					<Skeleton className="h-5 w-40" />
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
						<CardTitle>Sign in to add an event</CardTitle>
						<CardDescription>
							Event planning is available to the people who organize this group.
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

	if (!workspace) {
		return (
			<main className="page-wrap min-h-[calc(100dvh-4rem)] py-16">
				<Alert variant="destructive" className="mx-auto max-w-xl">
					<CircleAlert />
					<AlertTitle>Event unavailable</AlertTitle>
					<AlertDescription>{loadError}</AlertDescription>
				</Alert>
			</main>
		);
	}

	if (!canManageEvents(workspace.role)) {
		return (
			<main className="page-wrap min-h-[calc(100dvh-4rem)] py-16">
				<Alert className="mx-auto max-w-xl">
					<CircleAlert />
					<AlertTitle>Organizers only</AlertTitle>
					<AlertDescription>
						Only organizers and above can add events for this group.
					</AlertDescription>
				</Alert>
			</main>
		);
	}

	const organizerOptions =
		members?.filter((member) => canManageEvents(member.role)) ?? [];

	return (
		<main className="page-wrap min-h-[calc(100dvh-4rem)] py-10 sm:py-16">
			<div className="mx-auto max-w-2xl">
				<Link
					to="/groups/$slug/events"
					params={{ slug }}
					className="text-sm text-[var(--sea-ink-soft)]"
				>
					Back to events
				</Link>
				<Card className="island-shell mt-7 rounded-2xl p-0">
					<CardHeader className="border-b px-6 py-7 sm:px-10">
						<Badge variant="outline" className="island-kicker w-fit">
							<Plus />
							New gathering
						</Badge>
						<CardTitle className="display-title text-3xl sm:text-4xl">
							Add an event
						</CardTitle>
						<CardDescription className="max-w-xl leading-6">
							Share when {workspace.name} will meet, where, and who is holding
							the space.
						</CardDescription>
					</CardHeader>
					<CardContent className="px-6 pb-8 sm:px-10">
						<form className="grid gap-5" onSubmit={handleSubmit}>
							<div className="grid gap-2">
								<Label htmlFor="event-title">Event title</Label>
								<Input
									id="event-title"
									value={title}
									onChange={(event) => setTitle(event.target.value)}
									placeholder="Sunday morning sitting"
									minLength={2}
									maxLength={120}
									required
								/>
							</div>
							<div className="grid gap-5 sm:grid-cols-2">
								<div className="grid gap-2">
									<Label htmlFor="event-starts-at">Date and time</Label>
									<Input
										id="event-starts-at"
										type="datetime-local"
										value={startsAt}
										onChange={(event) => setStartsAt(event.target.value)}
										required
									/>
									<p className="text-xs text-muted-foreground">
										{workspace.timezone}
									</p>
								</div>
								<div className="grid gap-2">
									<Label htmlFor="event-duration">Duration in minutes</Label>
									<Input
										id="event-duration"
										type="number"
										value={durationMinutes}
										onChange={(event) => setDurationMinutes(event.target.value)}
										min={5}
										max={1440}
										step={5}
										required
									/>
								</div>
							</div>
							<div className="grid gap-2">
								<Label htmlFor="event-location">Location</Label>
								<Select
									value={locationChoice}
									onValueChange={setLocationChoice}
								>
									<SelectTrigger id="event-location" className="w-full">
										<SelectValue placeholder="Choose a meeting location" />
									</SelectTrigger>
									<SelectContent>
										{workspace.addresses.map((address) => (
											<SelectItem key={address.id} value={address.id}>
												{address.label
													? `${address.label} — ${formatMeetingAddress(address)}`
													: formatMeetingAddress(address)}
											</SelectItem>
										))}
										<SelectItem value={OTHER_LOCATION}>
											Online or another location
										</SelectItem>
									</SelectContent>
								</Select>
							</div>
							{locationChoice === OTHER_LOCATION && (
								<div className="grid gap-2">
									<Label htmlFor="event-location-other">Location details</Label>
									<Input
										id="event-location-other"
										value={customLocation}
										onChange={(event) => setCustomLocation(event.target.value)}
										placeholder="Online, or a hall not listed yet"
										minLength={2}
										maxLength={200}
										required
									/>
								</div>
							)}
							<div className="grid gap-2">
								<Label htmlFor="event-organizer">Assigned organizer</Label>
								<Select
									value={organizerUserId}
									onValueChange={setOrganizerUserId}
									disabled={organizerOptions.length === 0}
								>
									<SelectTrigger id="event-organizer" className="w-full">
										<SelectValue placeholder="Choose an organizer" />
									</SelectTrigger>
									<SelectContent>
										{organizerOptions.map((member) => (
											<SelectItem key={member.userId} value={member.userId}>
												{member.name} · {workspaceRoleLabels[member.role]}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
								{organizerOptions.length === 0 && (
									<p className="text-xs text-muted-foreground">
										No one in this group holds the organizer role yet.
									</p>
								)}
							</div>
							{error && (
								<Alert variant="destructive">
									<CircleAlert />
									<AlertDescription>{error}</AlertDescription>
								</Alert>
							)}
							<Button
								type="submit"
								disabled={isSubmitting || organizerOptions.length === 0}
								className="mt-2 w-full sm:w-fit"
							>
								{isSubmitting ? "Creating..." : "Create event"}
							</Button>
						</form>
					</CardContent>
				</Card>
			</div>
		</main>
	);
}
