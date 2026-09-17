import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { CircleAlert } from "lucide-react";
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
import { Skeleton } from "#/components/ui/skeleton";
import { authClient } from "#/lib/auth-client";

export const Route = createFileRoute("/groups/new")({
	component: NewWorkspace,
});

function toSlug(value: string) {
	return value
		.toLowerCase()
		.trim()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-|-$/g, "");
}

function NewWorkspace() {
	const navigate = useNavigate();
	const { data: session, isPending: isSessionPending } =
		authClient.useSession();
	const [name, setName] = useState("");
	const [slug, setSlug] = useState("");
	const [isSlugEdited, setIsSlugEdited] = useState(false);
	const [timezone, setTimezone] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		setTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone);
	}, []);

	const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		setError(null);
		setIsSubmitting(true);

		const formData = new FormData(event.currentTarget);
		const response = await fetch("/api/workspaces", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				name,
				slug,
				locality: String(formData.get("locality")),
				region: String(formData.get("region")),
				countryCode: String(formData.get("countryCode")),
				timezone,
			}),
		});
		const result = (await response.json()) as {
			error?: string;
			workspace?: { slug: string };
		};

		if (!response.ok || !result.workspace) {
			setError(result.error ?? "Could not create the group");
			setIsSubmitting(false);
			return;
		}

		await navigate({
			to: "/groups/$slug",
			params: { slug: result.workspace.slug },
		});
	};

	if (isSessionPending) {
		return (
			<main className="page-wrap min-h-[calc(100dvh-4rem)] py-16">
				<Skeleton className="mx-auto h-96 max-w-2xl rounded-2xl" />
			</main>
		);
	}

	if (!session?.user) {
		return (
			<main className="page-wrap flex min-h-[calc(100dvh-4rem)] items-center py-16">
				<Card className="island-shell mx-auto max-w-lg">
					<CardHeader>
						<CardTitle>Sign in to create a group</CardTitle>
						<CardDescription>
							Group owners need an account before establishing a local
							community.
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

	return (
		<main className="page-wrap min-h-[calc(100dvh-4rem)] py-10 sm:py-16">
			<div className="mx-auto max-w-2xl">
				<Link to="/" className="text-sm text-[var(--sea-ink-soft)]">
					Back to home
				</Link>
				<Card className="island-shell mt-7 rounded-2xl p-0">
					<CardHeader className="border-b px-6 py-7 sm:px-10">
						<Badge variant="outline" className="island-kicker w-fit">
							New local community
						</Badge>
						<CardTitle className="display-title text-3xl sm:text-4xl">
							Create a group
						</CardTitle>
						<CardDescription className="max-w-xl leading-6">
							This location will be the home for its organizers, members, and
							events, including gatherings held online.
						</CardDescription>
					</CardHeader>
					<CardContent className="px-6 pb-8 sm:px-10">
						<form className="grid gap-5" onSubmit={handleSubmit}>
							<div className="grid gap-2">
								<Label htmlFor="name">Group name</Label>
								<Input
									id="name"
									value={name}
									onChange={(event) => {
										setName(event.target.value);
										if (!isSlugEdited) setSlug(toSlug(event.target.value));
									}}
									placeholder="Boston"
									minLength={2}
									maxLength={80}
									required
								/>
							</div>
							<div className="grid gap-2">
								<Label htmlFor="slug">Group URL</Label>
								<Input
									id="slug"
									value={slug}
									onChange={(event) => {
										setIsSlugEdited(true);
										setSlug(toSlug(event.target.value));
									}}
									placeholder="boston"
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
									<Label htmlFor="locality">City or locality</Label>
									<Input
										id="locality"
										name="locality"
										placeholder="Boston"
										required
									/>
								</div>
								<div className="grid gap-2">
									<Label htmlFor="region">State, province, or region</Label>
									<Input
										id="region"
										name="region"
										placeholder="Massachusetts"
									/>
								</div>
							</div>
							<div className="grid gap-5 sm:grid-cols-[1fr_2fr]">
								<div className="grid gap-2">
									<Label htmlFor="countryCode">Country code</Label>
									<Input
										id="countryCode"
										name="countryCode"
										placeholder="US"
										minLength={2}
										maxLength={2}
										required
									/>
								</div>
								<div className="grid gap-2">
									<Label htmlFor="timezone">Timezone</Label>
									<Input
										id="timezone"
										value={timezone}
										onChange={(event) => setTimezone(event.target.value)}
										placeholder="America/New_York"
										required
									/>
								</div>
							</div>
							{error && (
								<Alert variant="destructive">
									<CircleAlert />
									<AlertDescription>{error}</AlertDescription>
								</Alert>
							)}
							<Button
								type="submit"
								disabled={isSubmitting}
								className="mt-2 w-full sm:w-fit"
							>
								{isSubmitting ? "Creating..." : "Create group"}
							</Button>
						</form>
					</CardContent>
				</Card>
			</div>
		</main>
	);
}
