import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
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
		return <main className="min-h-screen bg-stone-950" />;
	}

	if (!session?.user) {
		return (
			<main className="min-h-screen bg-stone-950 px-6 py-20 text-stone-100">
				<div className="mx-auto max-w-3xl border-l border-amber-400 pl-8 sm:pl-12">
					<p className="text-sm uppercase tracking-[0.3em] text-amber-400">
						Waking Up Events
					</p>
					<h1 className="mt-6 max-w-2xl text-5xl font-semibold leading-tight sm:text-7xl">
						Meet with attention.
					</h1>
					<p className="mt-6 max-w-xl text-lg leading-8 text-stone-400">
						Sign in to explore your local account and verify the Better Auth
						flow.
					</p>
					<Link
						to="/login"
						className="mt-10 inline-block bg-amber-400 px-6 py-3 font-semibold text-stone-950 transition hover:bg-amber-300"
					>
						Sign in
					</Link>
				</div>
			</main>
		);
	}

	return (
		<main className="min-h-screen bg-stone-950 px-6 py-12 text-stone-100">
			<div className="mx-auto max-w-4xl">
				<div className="flex flex-col gap-5 border-b border-stone-800 pb-8 sm:flex-row sm:items-end sm:justify-between">
					<div>
						<p className="text-sm uppercase tracking-[0.24em] text-amber-400">
							Signed in locally
						</p>
						<h1 className="mt-3 text-4xl font-semibold">
							Hello, {session.user.name}
						</h1>
						<p className="mt-2 text-stone-400">{session.user.email}</p>
					</div>
					<button
						type="button"
						onClick={() => void authClient.signOut()}
						className="border border-stone-700 px-5 py-2.5 text-sm hover:border-stone-500"
					>
						Sign out
					</button>
				</div>

				<section className="mt-10">
					<div className="flex items-baseline justify-between gap-4">
						<h2 className="text-xl font-medium">
							Your Better Auth database records
						</h2>
						<span className="text-xs uppercase tracking-wider text-stone-500">
							Credentials omitted
						</span>
					</div>
					<p className="mt-2 text-sm text-stone-400">
						This is the user, account, and session metadata stored in local D1.
						Password hashes and session tokens are never returned.
					</p>
					<div className="mt-6 overflow-x-auto border border-stone-800 bg-stone-900 p-5">
						{dataError ? (
							<p className="text-red-300">{dataError}</p>
						) : (
							<pre className="text-sm leading-7 text-stone-300">
								{databaseData
									? JSON.stringify(databaseData, null, 2)
									: "Loading database records..."}
							</pre>
						)}
					</div>
				</section>
			</div>
		</main>
	);
}
