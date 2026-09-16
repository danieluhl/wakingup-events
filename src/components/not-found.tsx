import { Link } from "@tanstack/react-router";
import { buttonVariants } from "#/components/ui/button";

export function NotFound() {
	return (
		<div className="page-wrap min-h-[60vh] flex flex-col items-center justify-center text-center py-24">
			<p className="display-title text-8xl font-bold tracking-tight leading-none text-[var(--lagoon-deep)]">
				404
			</p>
			<h1 className="display-title text-3xl font-semibold mt-6 mb-3 text-[var(--sea-ink)]">
				Page not found
			</h1>
			<p className="text-base max-w-md mb-8 text-[var(--sea-ink-soft)]">
				Sorry, we couldn't find what you're looking for. It may have been moved
				or doesn't exist anymore.
			</p>
			<Link to="/" className={buttonVariants()}>
				Back to home
			</Link>
		</div>
	);
}
