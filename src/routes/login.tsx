import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { type FormEvent, useState } from "react";
import { authClient } from "#/lib/auth-client";

export const Route = createFileRoute("/login")({ component: Login });

function Login() {
	const navigate = useNavigate();
	const { data: session, isPending: isSessionPending } =
		authClient.useSession();
	const [isCreatingAccount, setIsCreatingAccount] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		setError(null);
		setIsSubmitting(true);

		const formData = new FormData(event.currentTarget);
		const email = String(formData.get("email"));
		const password = String(formData.get("password"));
		const result = isCreatingAccount
			? await authClient.signUp.email({
					email,
					name: String(formData.get("name")),
					password,
				})
			: await authClient.signIn.email({ email, password });

		setIsSubmitting(false);
		if (result.error) {
			setError(result.error.message ?? "Authentication failed");
			return;
		}

		await navigate({ to: "/" });
	};

	if (isSessionPending) {
		return <main className="min-h-screen bg-stone-950" />;
	}

	if (session?.user) {
		return (
			<main className="min-h-screen bg-stone-950 px-6 py-20 text-stone-100">
				<div className="mx-auto max-w-md border border-stone-800 bg-stone-900 p-8">
					<p className="text-sm uppercase tracking-[0.24em] text-amber-400">
						Already signed in
					</p>
					<h1 className="mt-3 text-3xl font-semibold">{session.user.email}</h1>
					<Link
						to="/"
						className="mt-8 inline-block bg-amber-400 px-5 py-3 font-medium text-stone-950"
					>
						View your account
					</Link>
				</div>
			</main>
		);
	}

	return (
		<main className="min-h-screen bg-stone-950 px-6 py-16 text-stone-100">
			<div className="mx-auto max-w-md">
				<Link to="/" className="text-sm text-stone-400 hover:text-stone-100">
					Back to Waking Up Events
				</Link>
				<div className="mt-8 border border-stone-800 bg-stone-900 p-8 shadow-2xl shadow-black/30">
					<p className="text-sm uppercase tracking-[0.24em] text-amber-400">
						Local account
					</p>
					<h1 className="mt-3 text-3xl font-semibold">
						{isCreatingAccount ? "Create your account" : "Welcome back"}
					</h1>
					<p className="mt-2 text-sm leading-6 text-stone-400">
						{isCreatingAccount
							? "Your account will be stored in the local D1 database."
							: "Sign in with an account in the local D1 database."}
					</p>

					<form className="mt-8 space-y-5" onSubmit={handleSubmit}>
						{isCreatingAccount && (
							<label className="block">
								<span className="text-sm text-stone-300">Name</span>
								<input
									name="name"
									type="text"
									autoComplete="name"
									required
									className="mt-2 w-full border border-stone-700 bg-stone-950 px-4 py-3 outline-none focus:border-amber-400"
								/>
							</label>
						)}
						<label className="block">
							<span className="text-sm text-stone-300">Email</span>
							<input
								name="email"
								type="email"
								autoComplete="email"
								required
								className="mt-2 w-full border border-stone-700 bg-stone-950 px-4 py-3 outline-none focus:border-amber-400"
							/>
						</label>
						<label className="block">
							<span className="text-sm text-stone-300">Password</span>
							<input
								name="password"
								type="password"
								autoComplete={
									isCreatingAccount ? "new-password" : "current-password"
								}
								minLength={8}
								required
								className="mt-2 w-full border border-stone-700 bg-stone-950 px-4 py-3 outline-none focus:border-amber-400"
							/>
						</label>
						{error && (
							<p className="border border-red-900 bg-red-950/50 p-3 text-sm text-red-300">
								{error}
							</p>
						)}
						<button
							type="submit"
							disabled={isSubmitting}
							className="w-full bg-amber-400 px-5 py-3 font-semibold text-stone-950 transition hover:bg-amber-300 disabled:cursor-wait disabled:opacity-60"
						>
							{isSubmitting
								? "Working..."
								: isCreatingAccount
									? "Create account"
									: "Sign in"}
						</button>
					</form>

					<button
						type="button"
						onClick={() => {
							setError(null);
							setIsCreatingAccount((value) => !value);
						}}
						className="mt-6 w-full text-sm text-stone-400 underline decoration-stone-600 underline-offset-4 hover:text-stone-100"
					>
						{isCreatingAccount
							? "Use an existing account"
							: "Create a local account first"}
					</button>
				</div>
			</div>
		</main>
	);
}
