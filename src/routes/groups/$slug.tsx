import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
	CircleAlert,
	MapPin,
	Settings,
	ShieldCheck,
	Trash2,
} from "lucide-react";
import { type FormEvent, useEffect, useState } from "react";
import { Alert, AlertDescription } from "#/components/ui/alert";
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
	const navigate = useNavigate();
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
				{workspace.role === "owner" && (
					<WorkspaceSettings
						workspace={workspace}
						onUpdated={(updatedWorkspace) => setWorkspace(updatedWorkspace)}
						onNavigate={navigate}
					/>
				)}
			</div>
		</main>
	);
}

function WorkspaceSettings({
	workspace,
	onUpdated,
	onNavigate,
}: {
	workspace: WorkspaceDetails;
	onUpdated: (workspace: WorkspaceDetails) => void;
	onNavigate: ReturnType<typeof useNavigate>;
}) {
	const [name, setName] = useState(workspace.name);
	const [slug, setSlug] = useState(workspace.slug);
	const [locality, setLocality] = useState(workspace.locality);
	const [region, setRegion] = useState(workspace.region ?? "");
	const [countryCode, setCountryCode] = useState(workspace.countryCode);
	const [timezone, setTimezone] = useState(workspace.timezone);
	const [deleteConfirmation, setDeleteConfirmation] = useState("");
	const [isSaving, setIsSaving] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);
	const [message, setMessage] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);

	const handleSave = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		setError(null);
		setMessage(null);
		setIsSaving(true);

		try {
			const response = await fetch(
				`/api/workspaces?slug=${encodeURIComponent(workspace.slug)}`,
				{
					method: "PATCH",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						name,
						slug,
						locality,
						region,
						countryCode,
						timezone,
					}),
				},
			);
			const result = (await response.json()) as {
				error?: string;
				workspace?: WorkspaceDetails;
			};

			if (!response.ok || !result.workspace) {
				throw new Error(result.error ?? "Could not update the group");
			}

			onUpdated(result.workspace);
			setMessage("Group settings saved.");
			if (result.workspace.slug !== workspace.slug) {
				await onNavigate({
					to: "/groups/$slug",
					params: { slug: result.workspace.slug },
					replace: true,
				});
			}
		} catch (saveError) {
			setError(
				saveError instanceof Error
					? saveError.message
					: "Could not update the group",
			);
		} finally {
			setIsSaving(false);
		}
	};

	const handleDelete = async () => {
		setError(null);
		setMessage(null);
		setIsDeleting(true);

		try {
			const response = await fetch(
				`/api/workspaces?slug=${encodeURIComponent(workspace.slug)}`,
				{ method: "DELETE" },
			);
			if (!response.ok) {
				const result = (await response.json()) as { error?: string };
				throw new Error(result.error ?? "Could not delete the group");
			}

			await onNavigate({ to: "/home", replace: true });
		} catch (deleteError) {
			setError(
				deleteError instanceof Error
					? deleteError.message
					: "Could not delete the group",
			);
			setIsDeleting(false);
		}
	};

	return (
		<Card className="island-shell mt-8 rounded-2xl p-0">
			<CardHeader className="border-b px-6 py-7 sm:px-10">
				<div className="flex items-center gap-3">
					<Settings
						className="size-5 text-muted-foreground"
						aria-hidden="true"
					/>
					<CardTitle>Group settings</CardTitle>
				</div>
				<CardDescription>
					Update how this group is named and located. These settings are
					available to group owners.
				</CardDescription>
			</CardHeader>
			<CardContent className="px-6 py-8 sm:px-10">
				<form className="grid gap-5" onSubmit={handleSave}>
					<div className="grid gap-2">
						<Label htmlFor="settings-name">Group name</Label>
						<Input
							id="settings-name"
							value={name}
							onChange={(event) => setName(event.target.value)}
							minLength={2}
							maxLength={80}
							required
						/>
					</div>
					<div className="grid gap-2">
						<Label htmlFor="settings-slug">Group URL</Label>
						<Input
							id="settings-slug"
							value={slug}
							onChange={(event) =>
								setSlug(
									event.target.value
										.toLowerCase()
										.replace(/[^a-z0-9]+/g, "-")
										.replace(/^-|-$/g, ""),
								)
							}
							pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
							minLength={2}
							maxLength={60}
							required
						/>
						<p className="text-xs text-muted-foreground">
							/groups/{slug || "your-location"}
						</p>
					</div>
					<div className="grid gap-5 sm:grid-cols-2">
						<div className="grid gap-2">
							<Label htmlFor="settings-locality">City or locality</Label>
							<Input
								id="settings-locality"
								value={locality}
								onChange={(event) => setLocality(event.target.value)}
								maxLength={100}
								required
							/>
						</div>
						<div className="grid gap-2">
							<Label htmlFor="settings-region">
								State, province, or region
							</Label>
							<Input
								id="settings-region"
								value={region}
								onChange={(event) => setRegion(event.target.value)}
								maxLength={100}
							/>
						</div>
					</div>
					<div className="grid gap-5 sm:grid-cols-[1fr_2fr]">
						<div className="grid gap-2">
							<Label htmlFor="settings-country-code">Country code</Label>
							<Input
								id="settings-country-code"
								value={countryCode}
								onChange={(event) =>
									setCountryCode(event.target.value.toUpperCase())
								}
								minLength={2}
								maxLength={2}
								required
							/>
						</div>
						<div className="grid gap-2">
							<Label htmlFor="settings-timezone">Timezone</Label>
							<Input
								id="settings-timezone"
								value={timezone}
								onChange={(event) => setTimezone(event.target.value)}
								maxLength={100}
								required
							/>
						</div>
					</div>
					{message && (
						<Alert>
							<AlertDescription>{message}</AlertDescription>
						</Alert>
					)}
					{error && (
						<Alert variant="destructive">
							<CircleAlert />
							<AlertDescription>{error}</AlertDescription>
						</Alert>
					)}
					<Button
						type="submit"
						disabled={isSaving || isDeleting}
						className="w-fit"
					>
						{isSaving ? "Saving..." : "Save settings"}
					</Button>
				</form>

				<Separator className="my-9" />

				<section aria-labelledby="delete-group-heading" className="grid gap-4">
					<div>
						<h2
							id="delete-group-heading"
							className="font-semibold text-destructive"
						>
							Delete group
						</h2>
						<p className="mt-1 text-sm leading-6 text-muted-foreground">
							This permanently removes the group, its memberships, invitations,
							and subscriptions. This action cannot be undone.
						</p>
					</div>
					<div className="grid max-w-md gap-2">
						<Label htmlFor="delete-confirmation">
							Type {workspace.name} to confirm
						</Label>
						<Input
							id="delete-confirmation"
							value={deleteConfirmation}
							onChange={(event) => setDeleteConfirmation(event.target.value)}
							autoComplete="off"
						/>
					</div>
					<Button
						type="button"
						variant="destructive"
						className="w-fit"
						disabled={
							deleteConfirmation !== workspace.name || isSaving || isDeleting
						}
						onClick={() => void handleDelete()}
					>
						<Trash2 aria-hidden="true" />
						{isDeleting ? "Deleting..." : "Delete group"}
					</Button>
				</section>
			</CardContent>
		</Card>
	);
}
