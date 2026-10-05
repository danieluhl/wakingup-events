import { createFileRoute, Link } from "@tanstack/react-router";
import {
	CalendarDays,
	CircleAlert,
	ClipboardList,
	Clock,
	MapPin,
	Plus,
	UserRound,
} from "lucide-react";
import { type ReactNode, useEffect, useState } from "react";
import { EventCalendar } from "#/components/event-calendar";
import { EventDetailsDialog } from "#/components/event-details-dialog";
import { Alert, AlertDescription, AlertTitle } from "#/components/ui/alert";
import { Badge } from "#/components/ui/badge";
import { buttonVariants } from "#/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "#/components/ui/card";
import { Separator } from "#/components/ui/separator";
import { Skeleton } from "#/components/ui/skeleton";
import { authClient } from "#/lib/auth-client";
import {
	formatEventDateTime,
	formatEventDuration,
	isPastEvent,
	type WorkspaceEvent,
} from "#/lib/events";
import { canManageEvents, isWorkspaceRole } from "#/lib/workspace-roles";

interface EventsData {
	workspace: {
		id: string;
		name: string;
		slug: string;
		timezone: string;
		role: string | null;
	};
	currentUserId: string | null;
	events: WorkspaceEvent[];
}

export const Route = createFileRoute("/groups/$slug_/events")({
	component: WorkspaceEvents,
});

function WorkspaceEvents() {
	const { slug } = Route.useParams();
	const { data: session, isPending: isSessionPending } =
		authClient.useSession();
	const [data, setData] = useState<EventsData | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [selectedEvent, setSelectedEvent] = useState<WorkspaceEvent | null>(
		null,
	);

	useEffect(() => {
		if (isSessionPending) return;

		const controller = new AbortController();
		setData(null);
		setError(null);

		void fetch(`/api/events?slug=${encodeURIComponent(slug)}`, {
			signal: controller.signal,
		})
			.then(async (response) => {
				const result = (await response.json()) as {
					error?: string;
					workspace?: EventsData["workspace"];
					currentUserId?: string | null;
					events?: WorkspaceEvent[];
				};

				if (!response.ok || !result.workspace || !result.events) {
					throw new Error(result.error ?? "Could not load events");
				}

				return {
					workspace: result.workspace,
					currentUserId: result.currentUserId ?? null,
					events: result.events,
				};
			})
			.then(setData)
			.catch((fetchError: unknown) => {
				if (fetchError instanceof Error && fetchError.name !== "AbortError") {
					setError(fetchError.message);
				}
			});

		return () => controller.abort();
	}, [isSessionPending, slug]);

	if (isSessionPending || (!data && !error)) {
		return (
			<main className="page-wrap min-h-[calc(100dvh-4rem)] py-16">
				<div className="mx-auto grid max-w-5xl gap-6">
					<Skeleton className="h-5 w-40" />
					<Skeleton className="h-24 rounded-2xl" />
					<Skeleton className="h-72 rounded-2xl" />
				</div>
			</main>
		);
	}

	if (!data) {
		return (
			<main className="page-wrap min-h-[calc(100dvh-4rem)] py-16">
				<Alert variant="destructive" className="mx-auto max-w-xl">
					<CircleAlert />
					<AlertTitle>Events unavailable</AlertTitle>
					<AlertDescription>{error}</AlertDescription>
				</Alert>
			</main>
		);
	}

	const { workspace, events, currentUserId } = data;
	const canManage =
		workspace.role !== null &&
		isWorkspaceRole(workspace.role) &&
		canManageEvents(workspace.role);

	const now = new Date();
	const upcomingEvents = events.filter((event) => !isPastEvent(event, now));
	const pastEvents = events.filter((event) => isPastEvent(event, now));
	const needsUpdate = canManage
		? pastEvents.filter(
				(event) =>
					event.organizerUserId === currentUserId &&
					event.postEventUpdatedAt === null,
			)
		: [];

	return (
		<main className="page-wrap min-h-[calc(100dvh-4rem)] py-10 sm:py-16">
			<div className="mx-auto grid max-w-5xl gap-7">
				{session?.user ? (
					<Link
						to="/groups/$slug"
						params={{ slug }}
						className="w-fit text-sm text-[var(--sea-ink-soft)]"
					>
						Back to {workspace.name}
					</Link>
				) : (
					<Link to="/" className="w-fit text-sm text-[var(--sea-ink-soft)]">
						Back to home
					</Link>
				)}

				<header className="flex flex-wrap items-end justify-between gap-5">
					<div className="grid gap-3">
						<Badge variant="outline" className="island-kicker w-fit">
							<CalendarDays />
							Gatherings
						</Badge>
						<h1 className="display-title text-4xl font-semibold sm:text-5xl">
							Events
						</h1>
						<p className="max-w-2xl leading-7 text-[var(--sea-ink-soft)]">
							Keep track of what {workspace.name} is offering, and who is
							holding the space.
						</p>
					</div>
					{canManage && (
						<Link
							to="/groups/$slug/events/new"
							params={{ slug }}
							className={buttonVariants()}
						>
							<Plus aria-hidden="true" />
							Add event
						</Link>
					)}
				</header>

				<Card className="island-shell overflow-hidden rounded-2xl p-0">
					<CardHeader className="px-6 pt-7 sm:px-9 sm:pt-9">
						<CardTitle>Calendar</CardTitle>
						<CardDescription>
							Browse gatherings by month at {workspace.name}, and add any of
							them to your own calendar.
						</CardDescription>
					</CardHeader>
					<CardContent className="px-6 pb-7 sm:px-9 sm:pb-9">
						<EventCalendar
							events={events}
							timeZone={workspace.timezone}
							onSelectEvent={setSelectedEvent}
						/>
					</CardContent>
				</Card>

				<Card className="island-shell overflow-hidden rounded-2xl p-0">
					<CardHeader className="px-6 pt-7 sm:px-9 sm:pt-9">
						<CardTitle>Upcoming</CardTitle>
						<CardDescription>
							{upcomingEvents.length}{" "}
							{upcomingEvents.length === 1 ? "gathering" : "gatherings"} ahead
							for this group
						</CardDescription>
					</CardHeader>
					<CardContent className="px-6 pb-7 sm:px-9 sm:pb-9">
						{upcomingEvents.length === 0 ? (
							<div className="grid gap-2 rounded-xl border border-dashed px-6 py-10 text-center">
								<p className="font-medium">Nothing on the calendar</p>
								<p className="text-sm text-muted-foreground">
									Add the next gathering for this group.
								</p>
							</div>
						) : (
							<ul>
								{upcomingEvents.map((event, index) => (
									<li key={event.id}>
										{index > 0 && <Separator />}
										<EventRow
											event={event}
											timezone={workspace.timezone}
											action={
												<button
													type="button"
													onClick={() => setSelectedEvent(event)}
													className={buttonVariants({
														variant: "outline",
														size: "sm",
													})}
												>
													<CalendarDays aria-hidden="true" />
													Add to calendar
												</button>
											}
										/>
									</li>
								))}
							</ul>
						)}
					</CardContent>
				</Card>

				{needsUpdate.length > 0 && (
					<Card className="island-shell overflow-hidden rounded-2xl p-0">
						<CardHeader className="px-6 pt-7 sm:px-9 sm:pt-9">
							<CardTitle>Updates to add</CardTitle>
							<CardDescription>
								Gatherings you organized that could use a note on how they went.
							</CardDescription>
						</CardHeader>
						<CardContent className="px-6 pb-7 sm:px-9 sm:pb-9">
							<ul>
								{needsUpdate.map((event, index) => (
									<li key={event.id}>
										{index > 0 && <Separator />}
										<EventRow
											event={event}
											timezone={workspace.timezone}
											action={
												<Link
													to="/groups/$slug/events/$eventId"
													params={{ slug, eventId: event.id }}
													className={buttonVariants({
														variant: "outline",
														size: "sm",
													})}
												>
													<ClipboardList aria-hidden="true" />
													Add update
												</Link>
											}
										/>
									</li>
								))}
							</ul>
						</CardContent>
					</Card>
				)}

				<Card className="island-shell overflow-hidden rounded-2xl p-0">
					<CardHeader className="px-6 pt-7 sm:px-9 sm:pt-9">
						<CardTitle>Past events</CardTitle>
						<CardDescription>
							{pastEvents.length}{" "}
							{pastEvents.length === 1 ? "gathering" : "gatherings"} that have
							already happened
						</CardDescription>
					</CardHeader>
					<CardContent className="px-6 pb-7 sm:px-9 sm:pb-9">
						{pastEvents.length === 0 ? (
							<div className="grid gap-2 rounded-xl border border-dashed px-6 py-10 text-center">
								<p className="font-medium">No past events yet</p>
								<p className="text-sm text-muted-foreground">
									Gatherings will appear here once they have happened.
								</p>
							</div>
						) : (
							<ul>
								{pastEvents.map((event, index) => (
									<li key={event.id}>
										{index > 0 && <Separator />}
										<EventRow
											event={event}
											timezone={workspace.timezone}
											showUpdate
											action={
												canManage ? (
													<Link
														to="/groups/$slug/events/$eventId"
														params={{ slug, eventId: event.id }}
														className={buttonVariants({
															variant: "outline",
															size: "sm",
														})}
													>
														<ClipboardList aria-hidden="true" />
														{event.postEventUpdatedAt === null
															? "Add update"
															: "Edit update"}
													</Link>
												) : undefined
											}
										/>
									</li>
								))}
							</ul>
						)}
					</CardContent>
				</Card>
			</div>

			<EventDetailsDialog
				event={selectedEvent}
				workspaceName={workspace.name}
				timeZone={workspace.timezone}
				onOpenChange={(open) => {
					if (!open) setSelectedEvent(null);
				}}
			/>
		</main>
	);
}

function EventRow({
	event,
	timezone,
	action,
	showUpdate = false,
}: {
	event: WorkspaceEvent;
	timezone: string;
	action?: ReactNode;
	showUpdate?: boolean;
}) {
	const hasUpdate =
		event.attendanceCount !== null || event.postEventNotes !== null;

	return (
		<div className="flex flex-wrap items-start justify-between gap-4 py-5">
			<div className="grid gap-2">
				<div className="flex flex-wrap items-center gap-2">
					<h2 className="text-lg font-semibold">{event.title}</h2>
					{event.meetingTypeTitle && (
						<Badge variant="outline">{event.meetingTypeTitle}</Badge>
					)}
				</div>
				<p className="flex items-center gap-2 text-sm text-muted-foreground">
					<CalendarDays className="size-4 shrink-0" aria-hidden="true" />
					{formatEventDateTime(event.startsAt, timezone)}
				</p>
				<div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
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
				</div>
				{showUpdate && hasUpdate && (
					<div className="grid gap-1 rounded-xl border border-dashed px-4 py-3 text-sm">
						{event.attendanceCount !== null && (
							<p className="text-muted-foreground">
								Attendance:{" "}
								<span className="font-medium text-foreground">
									{event.attendanceCount}
								</span>
							</p>
						)}
						{event.postEventNotes && (
							<p className="whitespace-pre-line text-muted-foreground">
								{event.postEventNotes}
							</p>
						)}
					</div>
				)}
			</div>
			{action}
		</div>
	);
}
