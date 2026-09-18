import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, CalendarDays, MapPin, Users } from "lucide-react";
import { buttonVariants } from "#/components/ui/button";
import { Skeleton } from "#/components/ui/skeleton";
import { authClient } from "#/lib/auth-client";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
	const { data: session, isPending } = authClient.useSession();
	const destination = session?.user ? "/home" : "/login";

	return (
		<main className="relative isolate min-h-[calc(100dvh-4rem)] overflow-hidden bg-background text-foreground">
			<div
				className="pointer-events-none absolute inset-0 opacity-45 dark:opacity-20"
				style={{
					backgroundImage:
						"linear-gradient(var(--line) 1px, transparent 1px), linear-gradient(90deg, var(--line) 1px, transparent 1px)",
					backgroundSize: "72px 72px",
					maskImage:
						"linear-gradient(to right, transparent, black 45%, black 100%)",
				}}
			/>
			<div className="pointer-events-none absolute -right-32 top-14 size-136 rounded-full border border-(--line) bg-[color-mix(in_oklab,var(--lagoon)_13%,transparent)] sm:-right-16 lg:right-[5%] lg:size-168" />
			<div className="pointer-events-none absolute right-[18%] top-44 hidden size-72 rounded-full border border-(--line) lg:block" />

			<div className="relative mx-auto grid min-h-[calc(100dvh-4rem)] max-w-360 items-center gap-14 px-6 py-16 sm:px-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(25rem,0.9fr)] lg:px-16 lg:py-20">
				<section className="rise-in max-w-4xl">
					<p className="island-kicker flex items-center gap-3">
						<span className="h-px w-10 bg-(--kicker)" />A place for shared
						practice
					</p>
					<h1 className="display-title mt-7 text-[clamp(3.5rem,8.5vw,8rem)] font-bold leading-[0.88] tracking-[-0.045em] text-(--sea-ink)">
						Meet in
						<br />
						<span className="text-(--lagoon-deep)">presence.</span>
					</h1>
					<p className="mt-8 max-w-2xl text-lg leading-8 text-(--sea-ink-soft) sm:text-xl sm:leading-9">
						Discover meditation events and local gatherings made for quiet
						attention, open inquiry, and meaningful connection.
					</p>

					<div className="mt-10 flex flex-wrap items-center gap-x-7 gap-y-5">
						{isPending ? (
							<Skeleton className="h-13 w-44 rounded-none" />
						) : (
							<Link to={destination} className={buttonVariants({ size: "lg" })}>
								{session?.user ? "Go to home" : "Sign in to begin"}
								<ArrowRight className="ml-2 size-4" aria-hidden="true" />
							</Link>
						)}
						<p className="max-w-52 text-sm leading-6 text-(--sea-ink-soft)">
							{session?.user
								? `Welcome back, ${session.user.name}.`
								: "Your next gathering may be closer than you think."}
						</p>
					</div>
				</section>

				<section
					aria-label="What you can do"
					className="relative mx-auto w-full max-w-xl lg:justify-self-end"
				>
					<div className="island-shell relative rounded-2xl p-7 sm:p-10">
						<div className="mb-10 flex items-start justify-between gap-6">
							<div>
								<p className="island-kicker">Gather nearby</p>
								<h2 className="display-title mt-2 text-3xl font-bold">
									Find your community
								</h2>
							</div>
							<div className="flex size-12 shrink-0 items-center justify-center rounded-full border border-(--line) bg-(--chip-bg)">
								<MapPin className="size-5" aria-hidden="true" />
							</div>
						</div>

						<div className="grid gap-3">
							<Feature
								icon={CalendarDays}
								title="Discover gatherings"
								description="Explore sittings, workshops, and retreats around you."
							/>
							<Feature
								icon={Users}
								title="Share your story"
								description="Meet people who value attention, reflection, and care."
							/>
							<Feature
								icon={MapPin}
								title="Create a local group"
								description="Offer your community a steady place to connect."
							/>
						</div>
					</div>
				</section>
			</div>
		</main>
	);
}

function Feature({
	icon: Icon,
	title,
	description,
}: {
	icon: typeof CalendarDays;
	title: string;
	description: string;
}) {
	return (
		<div className="flex gap-4 border-t border-(--line) py-5 first:border-t-0 first:pt-0 last:pb-0">
			<Icon
				className="mt-1 size-5 shrink-0 text-(--lagoon-deep)"
				aria-hidden="true"
			/>
			<div>
				<h3 className="font-bold text-(--sea-ink)">{title}</h3>
				<p className="mt-1 text-sm leading-6 text-(--sea-ink-soft)">
					{description}
				</p>
			</div>
		</div>
	);
}
