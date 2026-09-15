import { Link } from "@tanstack/react-router";

export function NotFound() {
	return (
		<div className="page-wrap min-h-[60vh] flex flex-col items-center justify-center text-center py-24">
			<p
				className="display-title text-8xl font-bold tracking-tight leading-none"
				style={{ color: "var(--lagoon-deep)" }}
			>
				404
			</p>
			<h1
				className="display-title text-3xl font-semibold mt-6 mb-3"
				style={{ color: "var(--sea-ink)" }}
			>
				Page not found
			</h1>
			<p
				className="text-base max-w-md mb-8"
				style={{ color: "var(--sea-ink-soft)" }}
			>
				Sorry, we couldn't find what you're looking for. It may have been moved
				or doesn't exist anymore.
			</p>
			<Link
				to="/"
				className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-semibold transition-colors"
				style={{
					background: "var(--palm)",
					color: "#fff",
				}}
			>
				Back to home
			</Link>
		</div>
	);
}
