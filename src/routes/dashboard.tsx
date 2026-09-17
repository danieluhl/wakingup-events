import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Alert, AlertDescription } from "#/components/ui/alert";
import { Badge } from "#/components/ui/badge";
import { Button, buttonVariants } from "#/components/ui/button";
import { Card } from "#/components/ui/card";
import { Separator } from "#/components/ui/separator";
import { Skeleton } from "#/components/ui/skeleton";
import { authClient } from "#/lib/auth-client";

export const Route = createFileRoute("/dashboard")({ component: Dashboard });

function Dashboard() {
	const { data: session, isPending } = authClient.useSession();
	const userId = session?.user.id;
	const [databaseData, setDatabaseData] = useState<unknown>(null);
	const [dataError, setDataError] = useState<string | null>(null);

	useEffect(() => {
		if (!userId) {
			setDatabaseData(null);
			return;
		}

		const controller = new AbortController();
		setDataError(null);
		void fetch("/api/me", { signal: controller.signal })
			.then(async (response) => {
				if (!response.ok) throw new Error("Could not load account data");
				return response.json();
			})
			.then(setDatabaseData)
			.catch((error: unknown) => {
				if (error instanceof Error && error.name !== "AbortError") {
					setDataError(error.message);
				}
			});

		return () => controller.abort();
	}, [userId]);

	if (isPending) {
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
					<p className="island-kicker">Your dashboard</p>
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
		<main className="page-wrap min-h-[calc(100dvh-4rem)] py-10 sm:py-16">
			<div className="mx-auto max-w-4xl">
				<div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
					<div>
						<Badge variant="outline" className="island-kicker w-fit">
							Your dashboard
						</Badge>
						<h1 className="display-title mt-3 text-4xl font-bold">
							Welcome, {session.user.name}
						</h1>
						<p className="mt-2 text-muted-foreground">{session.user.email}</p>
					</div>
					<div className="flex flex-wrap gap-4">
						<Link to="/groups/new" className={buttonVariants()}>
							Create group
						</Link>
						<Button
							type="button"
							onClick={() => void authClient.signOut()}
							variant="outline"
						>
							Sign out
						</Button>
					</div>
				</div>

				<Separator className="my-8" />

				<section className="mt-10">
					<div className="flex items-baseline justify-between gap-4">
						<h2 className="display-title text-2xl font-bold">Your account</h2>
						<Badge variant="outline" className="island-kicker w-fit">
							Credentials omitted
						</Badge>
					</div>
					<p className="mt-2 text-sm text-muted-foreground">
						Your local user, account, and session metadata.
					</p>
					<Card className="island-shell mt-6 overflow-x-auto rounded-2xl p-5">
						{dataError ? (
							<Alert variant="destructive">
								<AlertDescription>{dataError}</AlertDescription>
							</Alert>
						) : (
							<pre className="text-sm leading-7">
								{databaseData
									? JSON.stringify(databaseData, null, 2)
									: "Loading account details..."}
							</pre>
						)}
					</Card>
				</section>
			</div>
		</main>
	);
}
