import { createFileRoute, Link } from "@tanstack/react-router";
import { MapPin, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { Alert, AlertDescription } from "#/components/ui/alert";
import { Badge } from "#/components/ui/badge";
import { buttonVariants } from "#/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card";
import { Separator } from "#/components/ui/separator";
import { Skeleton } from "#/components/ui/skeleton";
import { authClient } from "#/lib/auth-client";

interface WorkspaceDetails {
	id: string;
	name: string;
	slug: string;
	locality: string;
	region: string | null;
	countryCode: string;
	timezone: string;
	status: string;
	createdAt: string;
	role: string;
}

export const Route = createFileRoute("/groups/$slug")({
	component: Workspace,
});

function Workspace() {
	const { slug } = Route.useParams();
	const { data: session, isPending: isSessionPending } =
		authClient.useSession();
	const [workspace, setWorkspace] = useState<WorkspaceDetails | null>(null);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (!session?.user) return;

		const controller = new AbortController();
		void fetch(`/api/workspaces?slug=${encodeURIComponent(slug)}`, {
			signal: controller.signal,
		})
			.then(async (response) => {
				const result = (await response.json()) as {
					error?: string;
					workspace?: WorkspaceDetails;
				};
				if (!response.ok || !result.workspace) {
					throw new Error(result.error ?? "Could not load the group");
				}
				return result.workspace;
			})
			.then(setWorkspace)
			.catch((fetchError: unknown) => {
				if (fetchError instanceof Error && fetchError.name !== "AbortError") {
					setError(fetchError.message);
				}
			});

		return () => controller.abort();
	}, [session?.user, slug]);

	if (isSessionPending || (session?.user && !workspace && !error)) {
		return (
			<main className="page-wrap min-h-[calc(100dvh-4rem)] py-16">
				<div className="mx-auto max-w-4xl space-y-5">
					<Skeleton className="h-5 w-36" />
					<Skeleton className="h-72 w-full rounded-2xl" />
				</div>
			</main>
		);
	}

	if (!session?.user) {
		return (
			<main className="page-wrap flex min-h-[calc(100dvh-4rem)] items-center justify-center py-16">
				<Link to="/login" className={buttonVariants()}>
					Sign in to view this group
				</Link>
			</main>
		);
	}

	if (!workspace) {
		return (
			<main className="page-wrap min-h-[calc(100dvh-4rem)] py-16">
				<Alert variant="destructive" className="mx-auto max-w-xl">
					<AlertDescription>{error}</AlertDescription>
				</Alert>
			</main>
		);
	}

	const location = [workspace.locality, workspace.region, workspace.countryCode]
		.filter(Boolean)
		.join(", ");

	return (
		<main className="page-wrap min-h-[calc(100dvh-4rem)] py-10 sm:py-16">
			<div className="mx-auto max-w-4xl">
				<Link to="/" className="text-sm text-[var(--sea-ink-soft)]">
					Back to home
				</Link>
				<Card className="island-shell mt-7 overflow-hidden rounded-2xl p-0">
					<CardHeader className="bg-[color-mix(in_oklab,var(--surface-strong)_84%,var(--lagoon)_16%)] px-6 py-9 sm:px-10 sm:py-12">
						<div className="flex flex-wrap items-center gap-3">
							<Badge>{workspace.status}</Badge>
							<Badge variant="outline" className="capitalize">
								<ShieldCheck className="size-3.5" />
								{workspace.role}
							</Badge>
						</div>
						<CardTitle
							role="heading"
							aria-level={1}
							className="display-title mt-3 text-4xl sm:text-6xl"
						>
							{workspace.name}
						</CardTitle>
						<p className="flex items-center gap-2 text-[var(--sea-ink-soft)]">
							<MapPin className="size-4" />
							{location}
						</p>
					</CardHeader>
					<CardContent className="grid gap-0 px-6 py-2 sm:grid-cols-2 sm:px-10">
						<div className="py-6 sm:pr-8">
							<p className="island-kicker">Timezone</p>
							<p className="mt-2 font-medium">{workspace.timezone}</p>
						</div>
						<div className="border-t py-6 sm:border-t-0 sm:border-l sm:pl-8">
							<p className="island-kicker">Group address</p>
							<p className="mt-2 font-medium">/groups/{workspace.slug}</p>
						</div>
					</CardContent>
					<Separator />
					<CardContent className="px-6 py-7 sm:px-10">
						<p className="text-sm leading-6 text-muted-foreground">
							Your role in this group is {workspace.role}. Event and community
							tools can be added here as the local group takes shape.
						</p>
					</CardContent>
				</Card>
			</div>
		</main>
	);
}
