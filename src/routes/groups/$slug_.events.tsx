import { createFileRoute, Link } from "@tanstack/react-router";
import {
	CalendarDays,
	CircleAlert,
	Clock,
	MapPin,
	Plus,
	UserRound,
} from "lucide-react";
import { useEffect, useState } from "react";
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
	type WorkspaceEvent,
} from "#/lib/events";

interface EventsData {
	workspace: {
		id: string;
		name: string;
		slug: string;
		timezone: string;
		role: string;
	};
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

	useEffect(() => {
		if (!session?.user) return;

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
					events?: WorkspaceEvent[];
				};

				if (!response.ok || !result.workspace || !result.events) {
					throw new Error(result.error ?? "Could not load events");
				}

				return { workspace: result.workspace, events: result.events };
			})
			.then(setData)
			.catch((fetchError: unknown) => {
				if (fetchError instanceof Error && fetchError.name !== "AbortError") {
					setError(fetchError.message);
				}
			});

		return () => controller.abort();
	}, [session?.user, slug]);

	if (isSessionPending || (session?.user && !data && !error)) {
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

	if (!session?.user) {
		return (
			<main className="page-wrap flex min-h-[calc(100dvh-4rem)] items-center py-16">
				<Card className="island-shell mx-auto max-w-lg">
					<CardHeader>
						<CardTitle>Sign in to view events</CardTitle>
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

	const { workspace, events } = data;

	return (
		<main className="page-wrap min-h-[calc(100dvh-4rem)] py-10 sm:py-16">
			<div className="mx-auto grid max-w-5xl gap-7">
				<Link
					to="/groups/$slug"
					params={{ slug }}
					className="w-fit text-sm text-[var(--sea-ink-soft)]"
				>
					Back to {workspace.name}
				</Link>

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
					<Link
						to="/groups/$slug/events/new"
						params={{ slug }}
						className={buttonVariants()}
					>
						<Plus aria-hidden="true" />
						Add event
					</Link>
				</header>

				<Card className="island-shell overflow-hidden rounded-2xl p-0">
					<CardHeader className="px-6 pt-7 sm:px-9 sm:pt-9">
						<CardTitle>Upcoming and recent</CardTitle>
						<CardDescription>
							{events.length} {events.length === 1 ? "event" : "events"} for
							this group
						</CardDescription>
					</CardHeader>
					<CardContent className="px-6 pb-7 sm:px-9 sm:pb-9">
						{events.length === 0 ? (
							<div className="grid gap-2 rounded-xl border border-dashed px-6 py-10 text-center">
								<p className="font-medium">No events yet</p>
								<p className="text-sm text-muted-foreground">
									Add the first gathering for this group.
								</p>
							</div>
						) : (
							<ul>
								{events.map((event, index) => (
									<li key={event.id}>
										{index > 0 && <Separator />}
										<EventRow event={event} timezone={workspace.timezone} />
									</li>
								))}
							</ul>
						)}
					</CardContent>
				</Card>
			</div>
		</main>
	);
}

function EventRow({
	event,
	timezone,
}: {
	event: WorkspaceEvent;
	timezone: string;
}) {
	return (
		<div className="grid gap-2 py-5">
			<h2 className="text-lg font-semibold">{event.title}</h2>
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
		</div>
	);
}
