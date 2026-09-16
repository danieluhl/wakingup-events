import { Avatar, AvatarFallback, AvatarImage } from "#/components/ui/avatar";
import { Button } from "#/components/ui/button";
import { Skeleton } from "#/components/ui/skeleton";
import { authClient } from "#/lib/auth-client";

export default function BetterAuthHeader() {
	const { data: session, isPending } = authClient.useSession();

	if (isPending) {
		return <Skeleton className="size-8 rounded-full" />;
	}

	if (session?.user) {
		return (
			<div className="flex items-center gap-2">
				<Avatar>
					{session.user.image ? (
						<AvatarImage
							src={session.user.image}
							alt={session.user.name ?? "User"}
						/>
					) : null}
					<AvatarFallback className="text-xs font-medium">
						{session.user.name?.charAt(0).toUpperCase() || "U"}
					</AvatarFallback>
				</Avatar>
				<Button
					type="button"
					onClick={() => {
						void authClient.signOut();
					}}
					className="flex-1"
					size="sm"
					variant="outline"
				>
					Sign out
				</Button>
			</div>
		);
	}

	return null;
}
