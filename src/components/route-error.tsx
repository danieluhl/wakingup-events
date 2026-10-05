import {
	type ErrorComponentProps,
	Link,
	useRouter,
} from "@tanstack/react-router";
import { useEffect } from "react";
import { Button, buttonVariants } from "#/components/ui/button";

export function RouteError({ error, reset }: ErrorComponentProps) {
	const router = useRouter();

	useEffect(() => {
		console.error(error);
	}, [error]);

	const tryAgain = () => {
		reset();
		void router.invalidate();
	};

	return (
		<div className="page-wrap min-h-[60vh] flex flex-col items-center justify-center text-center py-24">
			<h1 className="display-title text-3xl font-semibold mb-3 text-[var(--sea-ink)]">
				Something went wrong
			</h1>
			<p className="text-base max-w-md mb-8 text-[var(--sea-ink-soft)]">
				This page ran into a problem while loading. Take a breath and try again,
				or head back home.
			</p>
			{import.meta.env.DEV && (
				<pre className="max-w-2xl mb-8 overflow-auto rounded-lg border p-4 text-left text-sm text-destructive">
					{error instanceof Error ? error.message : String(error)}
				</pre>
			)}
			<div className="flex gap-3">
				<Button type="button" onClick={tryAgain}>
					Try again
				</Button>
				<Link to="/home" className={buttonVariants({ variant: "outline" })}>
					Back to home
				</Link>
			</div>
		</div>
	);
}
