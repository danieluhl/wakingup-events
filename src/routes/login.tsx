import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { CircleAlert } from "lucide-react";
import { type FormEvent, useState } from "react";
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
		return (
			<main className="dark min-h-screen bg-background px-6 py-16">
				<div className="mx-auto max-w-md space-y-4">
					<Skeleton className="h-5 w-40" />
					<Skeleton className="h-72 w-full rounded-none" />
				</div>
			</main>
		);
	}

	if (session?.user) {
		return (
			<main className="dark min-h-screen bg-background px-6 py-20 text-foreground">
				<Card className="mx-auto max-w-md gap-8 rounded-none border-border bg-card shadow-none">
					<CardHeader>
						<Badge
							variant="outline"
							className="w-fit border-0 bg-transparent px-0 text-sm uppercase tracking-[0.24em] text-[#bba176]"
						>
							Already signed in
						</Badge>
						<CardTitle className="text-3xl">{session.user.email}</CardTitle>
					</CardHeader>
					<CardContent>
						<Link to="/" className={buttonVariants()}>
							View your account
						</Link>
					</CardContent>
				</Card>
			</main>
		);
	}

	return (
		<main className="dark min-h-screen bg-background px-6 py-16 text-foreground">
			<div className="mx-auto max-w-md">
				<Link
					to="/"
					className="text-sm text-muted-foreground hover:text-foreground"
				>
					Back to Waking Up Events
				</Link>
				<Card className="mt-8 gap-8 rounded-none border-border bg-card shadow-2xl shadow-black/30">
					<CardHeader>
						<Badge
							variant="outline"
							className="w-fit border-0 bg-transparent px-0 text-sm uppercase tracking-[0.24em] text-[#bba176]"
						>
							Local account
						</Badge>
						<CardTitle className="text-3xl">
							{isCreatingAccount ? "Create your account" : "Welcome back"}
						</CardTitle>
						<CardDescription className="leading-6 text-muted-foreground">
							{isCreatingAccount
								? "Your account will be stored in the local D1 database."
								: "Sign in with an account in the local D1 database."}
						</CardDescription>
					</CardHeader>
					<CardContent>
						<form className="space-y-5" onSubmit={handleSubmit}>
							{isCreatingAccount && (
								<div className="grid gap-2">
									<Label htmlFor="name">Name</Label>
									<Input
										id="name"
										name="name"
										type="text"
										autoComplete="name"
										required
										className="h-auto rounded-none border-input bg-background px-4 py-3 text-foreground focus-visible:border-[#8aa39d] focus-visible:ring-[#8aa39d]/20"
									/>
								</div>
							)}
							<div className="grid gap-2">
								<Label htmlFor="email">Email</Label>
								<Input
									id="email"
									name="email"
									type="email"
									autoComplete="email"
									required
									className="h-auto rounded-none border-input bg-background px-4 py-3 text-foreground focus-visible:border-[#8aa39d] focus-visible:ring-[#8aa39d]/20"
								/>
							</div>
							<div className="grid gap-2">
								<Label htmlFor="password">Password</Label>
								<Input
									id="password"
									name="password"
									type="password"
									autoComplete={
										isCreatingAccount ? "new-password" : "current-password"
									}
									minLength={8}
									required
									className="h-auto rounded-none border-input bg-background px-4 py-3 text-foreground focus-visible:border-[#8aa39d] focus-visible:ring-[#8aa39d]/20"
								/>
							</div>
							{error && (
								<Alert
									variant="destructive"
									className="rounded-none border-red-900 bg-red-950/50 [&>svg]:text-red-400"
								>
									<CircleAlert className="size-4" />
									<AlertDescription className="text-red-300">
										{error}
									</AlertDescription>
								</Alert>
							)}
							<Button
								type="submit"
								disabled={isSubmitting}
								className="w-full disabled:cursor-wait"
							>
								{isSubmitting
									? "Working..."
									: isCreatingAccount
										? "Create account"
										: "Sign in"}
							</Button>
						</form>

						<Button
							type="button"
							onClick={() => {
								setError(null);
								setIsCreatingAccount((value) => !value);
							}}
							variant="secondary"
							className="mt-6 w-full"
						>
							{isCreatingAccount
								? "Use an existing account"
								: "Create a new account"}
						</Button>
					</CardContent>
				</Card>
			</div>
		</main>
	);
}
