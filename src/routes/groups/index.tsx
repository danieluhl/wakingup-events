import { createFileRoute, Link } from "@tanstack/react-router";
import {
	Building2,
	CalendarDays,
	Clock,
	MapPin,
	Plus,
	Settings,
	ShieldCheck,
} from "lucide-react";
import { useGroup } from "#/components/group-context";
import { Alert, AlertDescription } from "#/components/ui/alert";
import { Badge } from "#/components/ui/badge";
import { buttonVariants } from "#/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "#/components/ui/card";
import { Skeleton } from "#/components/ui/skeleton";
import { authClient } from "#/lib/auth-client";
import { formatMeetingAddress } from "#/lib/workspace-addresses";

export const Route = createFileRoute("/groups/")({ component: Groups });

function Groups() {
	const { data: session, isPending: isSessionPending } =
		authClient.useSession();
	const { groups, isPending: areGroupsPending, error } = useGroup();

	if (isSessionPending || areGroupsPending) {
		return (
			<main className="page-wrap min-h-[calc(100dvh-4rem)] py-10 sm:py-16">
				<div className="mx-auto max-w-5xl space-y-5">
					<Skeleton className="h-10 w-48 rounded-full" />
					<Skeleton className="h-48 w-full rounded-2xl" />
				</div>
			</main>
		);
	}

	if (!session?.user) {
		return (
			<main className="page-wrap flex min-h-[calc(100dvh-4rem)] items-center justify-center py-16">
				<Link to="/login" className={buttonVariants()}>
					Sign in to manage your groups
				</Link>
			</main>
		);
	}

	return (
		<main className="page-wrap min-h-[calc(100dvh-4rem)] py-10 sm:py-16">
			<div className="mx-auto max-w-5xl">
				<div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
					<div>
						<p className="island-kicker">Your communities</p>
						<h1 className="display-title mt-3 text-4xl font-bold sm:text-5xl">
							Groups
						</h1>
						<p className="mt-3 max-w-2xl leading-7 text-muted-foreground">
							Visit the groups where you practice and connect. Owners can update
							group details or remove a group.
						</p>
					</div>
					<Link to="/groups/new" className={buttonVariants()}>
						<Plus />
						Create group
					</Link>
				</div>

				{error ? (
					<Alert variant="destructive" className="mt-8">
						<AlertDescription>{error}</AlertDescription>
					</Alert>
				) : groups.length === 0 ? (
					<Card className="island-shell mt-8 items-center rounded-2xl p-8 text-center">
						<Building2
							className="size-8 text-muted-foreground"
							aria-hidden="true"
						/>
						<CardTitle role="heading" aria-level={2}>
							No groups yet
						</CardTitle>
						<CardDescription>
							Create a group to offer your community a place to gather.
						</CardDescription>
					</Card>
				) : (
					<section aria-labelledby="group-list-heading" className="mt-9">
						<h2 id="group-list-heading" className="sr-only">
							Your group memberships
						</h2>
						<div className="grid gap-5 md:grid-cols-2">
							{groups.map((group) => {
								const location = [
									group.locality,
									group.region,
									group.countryCode,
								]
									.filter(Boolean)
									.join(", ");
								const createdAt = new Date(group.createdAt).toLocaleDateString(
									undefined,
									{
										year: "numeric",
										month: "long",
										day: "numeric",
									},
								);

								return (
									<Card key={group.id} className="island-shell rounded-2xl">
										<CardHeader>
											<div className="flex items-start justify-between gap-4">
												<div className="min-w-0">
													<CardTitle
														role="heading"
														aria-level={2}
														className="display-title truncate text-2xl"
													>
														{group.name}
													</CardTitle>
													<CardDescription className="mt-1 truncate">
														/groups/{group.slug}
													</CardDescription>
												</div>
												<Badge
													variant="outline"
													className="shrink-0 capitalize"
												>
													<ShieldCheck
														className="size-3.5"
														aria-hidden="true"
													/>
													{group.role}
												</Badge>
											</div>
										</CardHeader>
										<CardContent className="grid gap-5">
											<dl className="grid gap-3 text-sm">
												<div className="flex items-start gap-2">
													<MapPin
														className="mt-0.5 size-4 shrink-0 text-muted-foreground"
														aria-hidden="true"
													/>
													<div>
														<dt className="island-kicker">Location</dt>
														<dd className="mt-1 font-medium">{location}</dd>
													</div>
												</div>
												<div className="flex items-start gap-2">
													<Clock
														className="mt-0.5 size-4 shrink-0 text-muted-foreground"
														aria-hidden="true"
													/>
													<div>
														<dt className="island-kicker">Timezone</dt>
														<dd className="mt-1 font-medium">
															{group.timezone}
														</dd>
													</div>
												</div>
												<div className="flex items-start gap-2">
													<CalendarDays
														className="mt-0.5 size-4 shrink-0 text-muted-foreground"
														aria-hidden="true"
													/>
													<div>
														<dt className="island-kicker">Created</dt>
														<dd className="mt-1 font-medium">{createdAt}</dd>
													</div>
												</div>
												<div className="flex items-start gap-2">
													<MapPin
														className="mt-0.5 size-4 shrink-0 text-muted-foreground"
														aria-hidden="true"
													/>
													<div className="min-w-0">
														<dt className="island-kicker">Meeting locations</dt>
														<dd className="mt-1">
															<ul className="grid gap-1">
																{group.addresses.map((address) => (
																	<li key={address.id}>
																		{address.label && (
																			<span className="font-medium">
																				{address.label}:{" "}
																			</span>
																		)}
																		<span className="text-muted-foreground">
																			{formatMeetingAddress(address)}
																		</span>
																	</li>
																))}
															</ul>
														</dd>
													</div>
												</div>
											</dl>
											<div className="flex items-center justify-between gap-4">
												<Badge className="capitalize">{group.status}</Badge>
												<Link
													to="/groups/$slug"
													params={{ slug: group.slug }}
													hash={
														group.role === "owner"
															? "group-settings"
															: undefined
													}
													className={buttonVariants({
														variant:
															group.role === "owner" ? "default" : "outline",
														size: "sm",
													})}
												>
													{group.role === "owner" && (
														<Settings aria-hidden="true" />
													)}
													{group.role === "owner"
														? "Manage group"
														: "View group"}
												</Link>
											</div>
										</CardContent>
									</Card>
								);
							})}
						</div>
					</section>
				)}
			</div>
		</main>
	);
}
