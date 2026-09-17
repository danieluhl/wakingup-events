import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Alert, AlertDescription } from "#/components/ui/alert";
import { Badge } from "#/components/ui/badge";
import { Button, buttonVariants } from "#/components/ui/button";
import { Card } from "#/components/ui/card";
import { Separator } from "#/components/ui/separator";
import { Skeleton } from "#/components/ui/skeleton";
import { authClient } from "#/lib/auth-client";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
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
			<main className="min-h-[calc(100dvh-4rem)] bg-background px-6 py-20">
				<div className="mx-auto max-w-3xl space-y-6">
					<Skeleton className="h-4 w-64" />
					<Skeleton className="h-16 w-full" />
				</div>
			</main>
		);
	}

	if (!session?.user) {
		return (
			<main className="min-h-[calc(100dvh-4rem)] bg-background px-6 py-20 text-foreground">
				<div className="mx-auto max-w-3xl border-l border-[#a98d63] pl-8 sm:pl-12">
					<Badge
						variant="outline"
						className="w-fit border-0 bg-transparent px-0 text-sm uppercase tracking-[0.3em] text-[#bba176]"
					>
						Waking Up Events
					</Badge>
					<h1 className="mt-6 max-w-2xl text-5xl font-semibold leading-tight sm:text-7xl">
						Meet with attention.
					</h1>
					<p className="mt-6 max-w-xl text-lg leading-8 text-muted-foreground">
						Sign in to explore your local account and verify the Better Auth
						flow.
					</p>
					<Link to="/login" className={buttonVariants({ className: "mt-10" })}>
						Sign in
					</Link>
				</div>
			</main>
		);
	}

	return (
		<main className="min-h-[calc(100dvh-4rem)] bg-background px-6 py-12 text-foreground">
			<div className="mx-auto max-w-4xl">
				<div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
					<div>
						<Badge
							variant="outline"
							className="w-fit border-0 bg-transparent px-0 text-sm uppercase tracking-[0.24em] text-[#bba176]"
						>
							Signed in locally
						</Badge>
						<h1 className="mt-3 text-4xl font-semibold">
							Hello, {session.user.name}
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

				<Separator className="my-8 bg-border" />

				<section className="mt-10">
					<div className="flex items-baseline justify-between gap-4">
						<h2 className="text-xl font-medium">
							Your Better Auth database records
						</h2>
						<Badge
							variant="outline"
							className="w-fit border-0 bg-transparent px-0 text-xs uppercase tracking-wider text-muted-foreground"
						>
							Credentials omitted
						</Badge>
					</div>
					<p className="mt-2 text-sm text-muted-foreground">
						This is the user, account, and session metadata stored in local D1.
						Password hashes and session tokens are never returned.
					</p>
					<Card className="mt-6 overflow-x-auto rounded-none border-border bg-card p-5 text-card-foreground shadow-none">
						{dataError ? (
							<Alert
								variant="destructive"
								className="rounded-none border-0 bg-transparent p-0 text-red-300"
							>
								<AlertDescription className="text-red-300">
									{dataError}
								</AlertDescription>
							</Alert>
						) : (
							<pre className="text-sm leading-7 text-card-foreground">
								{databaseData
									? JSON.stringify(databaseData, null, 2)
									: "Loading database records..."}
							</pre>
						)}
					</Card>
				</section>
			</div>
		</main>
	);
}
