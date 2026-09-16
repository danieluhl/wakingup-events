import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button, buttonVariants } from "#/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "#/components/ui/card";

export const Route = createFileRoute("/design")({
	beforeLoad: () => {
		if (import.meta.env.PROD) {
			throw redirect({ code: 404 });
		}
	},
	component: ComponentsGallery,
});

function ComponentsGallery() {
	const [isDark, setIsDark] = useState(false);

	useEffect(() => {
		const root = document.documentElement;
		root.classList.toggle("dark", isDark);
		return () => root.classList.remove("dark");
	}, [isDark]);

	return (
		<main className="page-wrap flex min-h-screen flex-col gap-12 py-16">
			<header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
				<div>
					<p className="island-kicker">Design draft — components</p>
					<h1 className="display-title mt-2 text-4xl font-bold text-[var(--sea-ink)]">
						ShadCN components
					</h1>
					<p className="mt-3 max-w-2xl text-[var(--sea-ink-soft)]">
						A living reference of every ShadCN component in use, rendered with
						the app's design tokens. Hover the buttons to see their active
						states.
					</p>
				</div>
				<Button type="button" onClick={() => setIsDark((value) => !value)}>
					{isDark ? "Light mode" : "Dark mode"}
				</Button>
			</header>

			<Card className="island-shell rounded-2xl p-0">
				<CardHeader className="px-6 pt-6 sm:px-10 sm:pt-10">
					<CardTitle className="island-kicker">Button — variants</CardTitle>
					<CardDescription className="text-sm text-[var(--sea-ink-soft)]">
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
					<CardDescription className="text-sm text-[var(--sea-ink-soft)]">
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
					<CardDescription className="text-sm text-[var(--sea-ink-soft)]">
						The same button styling, applied to a route link.
					</CardDescription>
				</CardHeader>
				<CardContent className="px-6 pb-6 sm:px-10 sm:pb-10">
					<div className="flex flex-wrap items-center gap-4">
						<Link to="/" className={buttonVariants()}>
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
		</main>
	);
}
