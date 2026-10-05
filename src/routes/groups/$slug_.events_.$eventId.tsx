import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
	CalendarDays,
	CircleAlert,
	ClipboardList,
	Clock,
	MapPin,
	UserRound,
} from "lucide-react";
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
import { Skeleton } from "#/components/ui/skeleton";
import { Textarea } from "#/components/ui/textarea";
import { authClient } from "#/lib/auth-client";
import {
	formatEventDateTime,
	formatEventDuration,
	isPastEvent,
	type WorkspaceEvent,
} from "#/lib/events";
import {
	canManageEvents,
	isWorkspaceRole,
	type WorkspaceRole,
} from "#/lib/workspace-roles";

interface EventsData {
	workspace: {
		id: string;
		name: string;
		slug: string;
		timezone: string;
		role: WorkspaceRole;
	};
	currentUserId: string;
	events: WorkspaceEvent[];
}

export const Route = createFileRoute("/groups/$slug_/events_/$eventId")({
	component: EventUpdate,
});

function EventUpdate() {
	const { slug, eventId } = Route.useParams();
	const navigate = useNavigate();
	const { data: session, isPending: isSessionPending } =
		authClient.useSession();
	const [data, setData] = useState<EventsData | null>(null);
	const [loadError, setLoadError] = useState<string | null>(null);
	const [attendance, setAttendance] = useState("");
	const [notes, setNotes] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [submitError, setSubmitError] = useState<string | null>(null);

	useEffect(() => {
		if (!session?.user) return;

		const controller = new AbortController();
		setData(null);
		setLoadError(null);

		void fetch(`/api/events?slug=${encodeURIComponent(slug)}`, {
			signal: controller.signal,
		})
			.then(async (response) => {
				const result = (await response.json()) as {
					error?: string;
					workspace?: EventsData["workspace"];
					currentUserId?: string;
					events?: WorkspaceEvent[];
				};

				if (
					!response.ok ||
					!result.workspace ||
					!result.currentUserId ||
					!result.events ||
					!isWorkspaceRole(result.workspace.role)
				) {
					throw new Error(result.error ?? "Could not load the event");
				}

				return {
					workspace: result.workspace,
					currentUserId: result.currentUserId,
					events: result.events,
				};
			})
			.then((nextData) => {
				setData(nextData);
				const event = nextData.events.find((item) => item.id === eventId);
				if (event) {
					setAttendance(
						event.attendanceCount === null ? "" : String(event.attendanceCount),
					);
					setNotes(event.postEventNotes ?? "");
				}
			})
			.catch((fetchError: unknown) => {
				if (fetchError instanceof Error && fetchError.name !== "AbortError") {
					setLoadError(fetchError.message);
				}
			});

		return () => controller.abort();
	}, [session?.user, slug, eventId]);

	const handleSubmit = async (formEvent: FormEvent<HTMLFormElement>) => {
		formEvent.preventDefault();
		setSubmitError(null);

		const trimmedAttendance = attendance.trim();
		let attendanceCount: number | null = null;
		if (trimmedAttendance.length > 0) {
			const parsed = Number.parseInt(trimmedAttendance, 10);
			if (!Number.isFinite(parsed) || parsed < 0) {
				setSubmitError("Enter how many people attended, or leave it blank");
				return;
			}
			attendanceCount = parsed;
		}

		const trimmedNotes = notes.trim();

		setIsSubmitting(true);

		try {
			const response = await fetch(
				`/api/events?slug=${encodeURIComponent(slug)}`,
				{
					method: "PATCH",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						eventId,
						attendanceCount,
						notes: trimmedNotes.length > 0 ? trimmedNotes : null,
					}),
				},
			);
			const result = (await response.json()) as { error?: string };
			if (!response.ok) {
				throw new Error(result.error ?? "Could not save this update");
			}

			await navigate({
				to: "/groups/$slug/events",
				params: { slug },
			});
		} catch (error) {
			setSubmitError(
				error instanceof Error ? error.message : "Could not save this update",
			);
			setIsSubmitting(false);
		}
	};

	if (isSessionPending || (session?.user && !data && !loadError)) {
		return (
			<main className="page-wrap min-h-[calc(100dvh-4rem)] py-16">
				<div className="mx-auto grid max-w-2xl gap-6">
					<Skeleton className="h-5 w-40" />
					<Skeleton className="h-24 rounded-2xl" />
					<Skeleton className="h-80 rounded-2xl" />
				</div>
			</main>
		);
	}

	if (!session?.user) {
		return (
			<main className="page-wrap flex min-h-[calc(100dvh-4rem)] items-center py-16">
				<Card className="island-shell mx-auto max-w-lg">
					<CardHeader>
						<CardTitle>Sign in to update this event</CardTitle>
						<CardDescription>
							Event updates are available to the people who organize this group.
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

	const event = data?.events.find((item) => item.id === eventId);

	if (!data || !event) {
		return (
			<main className="page-wrap min-h-[calc(100dvh-4rem)] py-16">
				<Alert variant="destructive" className="mx-auto max-w-xl">
					<CircleAlert />
					<AlertTitle>Event unavailable</AlertTitle>
					<AlertDescription>
						{loadError ?? "This event could not be found."}
					</AlertDescription>
				</Alert>
			</main>
		);
	}

	if (!canManageEvents(data.workspace.role)) {
		return (
			<main className="page-wrap min-h-[calc(100dvh-4rem)] py-16">
				<Alert className="mx-auto max-w-xl">
					<CircleAlert />
					<AlertTitle>Organizers only</AlertTitle>
					<AlertDescription>
						Only organizers and above can update events for this group.
					</AlertDescription>
				</Alert>
			</main>
		);
	}

	if (!isPastEvent(event)) {
		return (
			<main className="page-wrap min-h-[calc(100dvh-4rem)] py-16">
				<div className="mx-auto max-w-2xl">
					<Link
						to="/groups/$slug/events"
						params={{ slug }}
						className="text-sm text-[var(--sea-ink-soft)]"
					>
						Back to events
					</Link>
					<Alert className="mt-7">
						<CircleAlert />
						<AlertTitle>This event hasn't happened yet</AlertTitle>
						<AlertDescription>
							You can add attendance and notes once the gathering is complete.
						</AlertDescription>
					</Alert>
				</div>
			</main>
		);
	}

	const hasUpdate = event.postEventUpdatedAt !== null;

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
							<ClipboardList />
							{hasUpdate ? "Event update" : "Add an update"}
						</Badge>
						<CardTitle className="display-title text-3xl sm:text-4xl">
							{event.title}
						</CardTitle>
						<CardDescription className="flex flex-wrap gap-x-6 gap-y-2">
							<span className="flex items-center gap-2">
								<CalendarDays className="size-4 shrink-0" aria-hidden="true" />
								{formatEventDateTime(event.startsAt, data.workspace.timezone)}
							</span>
							<span className="flex items-center gap-2">
								<Clock className="size-4 shrink-0" aria-hidden="true" />
								{formatEventDuration(event.durationMinutes)}
							</span>
							<span className="flex items-center gap-2">
								<MapPin className="size-4 shrink-0" aria-hidden="true" />
								{event.location}
							</span>
							<span className="flex items-center gap-2">
								<UserRound className="size-4 shrink-0" aria-hidden="true" />
								{event.organizerName}
							</span>
						</CardDescription>
					</CardHeader>
					<CardContent className="px-6 pb-8 pt-7 sm:px-10">
						<form className="grid gap-5" onSubmit={handleSubmit}>
							<div className="grid gap-2">
								<Label htmlFor="event-attendance">Attendance</Label>
								<Input
									id="event-attendance"
									type="number"
									inputMode="numeric"
									value={attendance}
									onChange={(inputEvent) =>
										setAttendance(inputEvent.target.value)
									}
									min={0}
									max={100000}
									placeholder="How many people came"
								/>
							</div>
							<div className="grid gap-2">
								<Label htmlFor="event-notes">Notes</Label>
								<Textarea
									id="event-notes"
									value={notes}
									onChange={(inputEvent) => setNotes(inputEvent.target.value)}
									placeholder="Anything worth remembering about how the gathering went"
									maxLength={2000}
									rows={6}
								/>
							</div>
							{submitError && (
								<Alert variant="destructive">
									<CircleAlert />
									<AlertDescription>{submitError}</AlertDescription>
								</Alert>
							)}
							<Button
								type="submit"
								disabled={isSubmitting}
								className="mt-2 w-full sm:w-fit"
							>
								{isSubmitting ? "Saving..." : "Save update"}
							</Button>
						</form>
					</CardContent>
				</Card>
			</div>
		</main>
	);
}
