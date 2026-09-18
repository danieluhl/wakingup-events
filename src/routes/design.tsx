import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { CircleAlert, Info } from "lucide-react";
import { useEffect, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "#/components/ui/alert";
import { Avatar, AvatarFallback } from "#/components/ui/avatar";
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

export const Route = createFileRoute("/design")({
	beforeLoad: () => {
		if (import.meta.env.PROD) {
			throw redirect({ code: 404 });
		}
	},
	component: ComponentsGallery,
});

function ComponentsGallery() {
	const [isDark, setIsDark] = useState<boolean | null>(null);

	useEffect(() => {
		const root = document.documentElement;
		setIsDark(root.classList.contains("dark"));
	}, []);

	useEffect(() => {
		if (isDark === null) return;

		const root = document.documentElement;
		root.classList.toggle("dark", isDark);
		return () => {
			root.classList.toggle(
				"dark",
				window.matchMedia("(prefers-color-scheme: dark)").matches,
			);
		};
	}, [isDark]);

	return (
		<main className="page-wrap flex min-h-[calc(100dvh-4rem)] flex-col gap-12 py-16">
			<div className="flex flex-col gap-6">
				<Link
					to="/home"
					className="w-fit text-sm text-(--sea-ink-soft) hover:text-(--sea-ink)"
				>
					← Back to homepage
				</Link>
				<header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
					<div>
						<p className="island-kicker">Design draft — components</p>
						<h1 className="display-title mt-2 text-4xl font-bold text-(--sea-ink)">
							ShadCN components
						</h1>
						<p className="mt-3 max-w-2xl text-(--sea-ink-soft)">
							A living reference of every ShadCN component in use, rendered with
							the app's design tokens. Hover the buttons to see their active
							states.
						</p>
					</div>
					<Button type="button" onClick={() => setIsDark((value) => !value)}>
						{isDark ? "Light mode" : "Dark mode"}
					</Button>
				</header>
			</div>

			<Card className="island-shell rounded-2xl p-0">
				<CardHeader className="px-6 pt-6 sm:px-10 sm:pt-10">
					<CardTitle className="island-kicker">Button — variants</CardTitle>
					<CardDescription className="text-sm text-(--sea-ink-soft)">
						Each variant includes a resting and a disabled example.
					</CardDescription>
				</CardHeader>
				<CardContent className="px-6 pb-6 sm:px-10 sm:pb-10">
					<div className="flex flex-wrap items-start gap-4">
						<Button>Default</Button>
						<Button disabled>Disabled</Button>
						<Button variant="secondary">Secondary</Button>
						<Button variant="secondary" disabled>
							Disabled
						</Button>
						<Button variant="outline">Outline</Button>
						<Button variant="outline" disabled>
							Disabled
						</Button>
						<Button variant="ghost">Ghost</Button>
						<Button variant="ghost" disabled>
							Disabled
						</Button>
						<Button variant="destructive">Destructive</Button>
						<Button variant="destructive" disabled>
							Disabled
						</Button>
					</div>
				</CardContent>
			</Card>

			<Card className="island-shell rounded-2xl p-0">
				<CardHeader className="px-6 pt-6 sm:px-10 sm:pt-10">
					<CardTitle className="island-kicker">Button — sizes</CardTitle>
					<CardDescription className="text-sm text-(--sea-ink-soft)">
						Default, small, large, and icon.
					</CardDescription>
				</CardHeader>
				<CardContent className="px-6 pb-6 sm:px-10 sm:pb-10">
					<div className="flex flex-wrap items-center gap-4">
						<Button size="lg">Large</Button>
						<Button>Default</Button>
						<Button size="sm">Small</Button>
						<Button size="icon" aria-label="Icon only">
							→
						</Button>
					</div>
				</CardContent>
			</Card>

			<Card className="island-shell rounded-2xl p-0">
				<CardHeader className="px-6 pt-6 sm:px-10 sm:pt-10">
					<CardTitle className="island-kicker">Button — as a link</CardTitle>
					<CardDescription className="text-sm text-(--sea-ink-soft)">
						The same button styling, applied to a route link.
					</CardDescription>
				</CardHeader>
				<CardContent className="px-6 pb-6 sm:px-10 sm:pb-10">
					<div className="flex flex-wrap items-center gap-4">
						<Link to="/home" className={buttonVariants()}>
							Back to home
						</Link>
						<Link
							to="/login"
							className={buttonVariants({ variant: "outline", size: "sm" })}
						>
							Sign in
						</Link>
					</div>
				</CardContent>
			</Card>

			<Card className="island-shell rounded-2xl p-0">
				<CardHeader className="px-6 pt-6 sm:px-10 sm:pt-10">
					<CardTitle className="island-kicker">Form controls</CardTitle>
					<CardDescription className="text-sm text-(--sea-ink-soft)">
						Labels and inputs in common states.
					</CardDescription>
				</CardHeader>
				<CardContent className="grid gap-6 px-6 pb-6 sm:grid-cols-3 sm:px-10 sm:pb-10">
					<div className="grid gap-2">
						<Label htmlFor="design-email">Email address</Label>
						<Input
							id="design-email"
							type="email"
							placeholder="you@example.com"
						/>
					</div>
					<div className="grid gap-2">
						<Label htmlFor="design-invalid">Invalid input</Label>
						<Input
							id="design-invalid"
							aria-invalid="true"
							defaultValue="Not an email"
						/>
					</div>
					<div className="grid gap-2">
						<Label htmlFor="design-disabled">Disabled input</Label>
						<Input id="design-disabled" disabled defaultValue="Unavailable" />
					</div>
				</CardContent>
			</Card>

			<Card className="island-shell rounded-2xl p-0">
				<CardHeader className="px-6 pt-6 sm:px-10 sm:pt-10">
					<CardTitle className="island-kicker">Status and feedback</CardTitle>
					<CardDescription className="text-sm text-(--sea-ink-soft)">
						Badge variants and alert treatments.
					</CardDescription>
				</CardHeader>
				<CardContent className="grid gap-8 px-6 pb-6 sm:px-10 sm:pb-10">
					<div className="flex flex-wrap gap-3">
						<Badge>Default</Badge>
						<Badge variant="secondary">Secondary</Badge>
						<Badge variant="destructive">Destructive</Badge>
						<Badge variant="outline">Outline</Badge>
						<Badge variant="ghost">Ghost</Badge>
						<Badge variant="link">Link</Badge>
					</div>
					<div className="grid gap-4 sm:grid-cols-2">
						<Alert>
							<Info />
							<AlertTitle>Event reminder</AlertTitle>
							<AlertDescription>
								Your gathering starts tomorrow at 7:00 PM.
							</AlertDescription>
						</Alert>
						<Alert variant="destructive">
							<CircleAlert />
							<AlertTitle>Could not save</AlertTitle>
							<AlertDescription>
								Check your connection and try again.
							</AlertDescription>
						</Alert>
					</div>
				</CardContent>
			</Card>

			<Card className="island-shell rounded-2xl p-0">
				<CardHeader className="px-6 pt-6 sm:px-10 sm:pt-10">
					<CardTitle className="island-kicker">Identity and loading</CardTitle>
					<CardDescription className="text-sm text-(--sea-ink-soft)">
						Avatars, separators, and loading placeholders.
					</CardDescription>
				</CardHeader>
				<CardContent className="grid gap-8 px-6 pb-6 sm:grid-cols-[auto_1fr] sm:px-10 sm:pb-10">
					<div className="flex items-center gap-3">
						<Avatar size="sm">
							<AvatarFallback>DU</AvatarFallback>
						</Avatar>
						<Avatar>
							<AvatarFallback>DU</AvatarFallback>
						</Avatar>
						<Avatar size="lg">
							<AvatarFallback>DU</AvatarFallback>
						</Avatar>
					</div>
					<div className="grid gap-5">
						<div className="flex h-5 items-center gap-4 text-sm text-muted-foreground">
							<span>Upcoming</span>
							<Separator orientation="vertical" />
							<span>Past events</span>
						</div>
						<Separator />
						<div className="flex items-center gap-4">
							<Skeleton className="size-10 rounded-full" />
							<div className="grid flex-1 gap-2">
								<Skeleton className="h-3 w-2/3" />
								<Skeleton className="h-3 w-1/3" />
							</div>
						</div>
					</div>
				</CardContent>
			</Card>
		</main>
	);
}
