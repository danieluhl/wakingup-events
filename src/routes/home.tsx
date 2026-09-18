import { createFileRoute, Link } from "@tanstack/react-router";
import { useGroup } from "#/components/group-context";
import { Alert, AlertDescription } from "#/components/ui/alert";
import { Badge } from "#/components/ui/badge";
import { buttonVariants } from "#/components/ui/button";
import { Card } from "#/components/ui/card";
import { Separator } from "#/components/ui/separator";
import { Skeleton } from "#/components/ui/skeleton";
import { authClient } from "#/lib/auth-client";

export const Route = createFileRoute("/home")({ component: Home });

function Home() {
	const { data: session, isPending: isSessionPending } =
		authClient.useSession();
	const { groups, isPending: areGroupsPending, error } = useGroup();

	if (isSessionPending || areGroupsPending) {
		return (
			<main className="page-wrap min-h-[calc(100dvh-4rem)] py-16">
				<Skeleton className="mx-auto h-80 max-w-4xl rounded-2xl" />
			</main>
		);
	}

	if (!session?.user) {
		return (
			<main className="page-wrap flex min-h-[calc(100dvh-4rem)] items-center py-16">
				<Card className="island-shell mx-auto max-w-lg p-8">
					<p className="island-kicker">Your home</p>
					<h1 className="display-title text-4xl font-bold">
						Sign in to continue
					</h1>
					<p className="leading-7 text-muted-foreground">
						Your groups, events, and account details will be waiting here.
					</p>
					<Link to="/login" className={buttonVariants()}>
						Sign in
					</Link>
				</Card>
			</main>
		);
	}

	return (
		<main className="page-wrap flex min-h-[calc(100dvh-4rem)] py-4 xl:py-8">
			<div className="mx-auto flex w-full max-w-4xl flex-1 flex-col">
				<div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
					<div>
						<Badge
							variant="outline"
							className="island-kicker w-fit hidden lg:block"
						>
							Your home
						</Badge>
						<h1 className="display-title mt-3 text-4xl font-bold">
							Welcome, {session.user.name}
						</h1>
						<p className="mt-2 text-muted-foreground">{session.user.email}</p>
					</div>
				</div>

				<Separator className="my-8" />

				<section className="flex flex-1 items-center justify-center py-12">
					{error ? (
						<Alert variant="destructive" className="max-w-lg">
							<AlertDescription>{error}</AlertDescription>
						</Alert>
					) : groups.length === 0 ? (
						<Link
							to="/groups/new"
							className={buttonVariants({
								size: "lg",
								className: "min-w-56 px-10 py-7 text-lg",
							})}
						>
							Create group
						</Link>
					) : (
						<div className="w-full"></div>
					)}
				</section>
			</div>
		</main>
	);
}
