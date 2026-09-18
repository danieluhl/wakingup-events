import { useRouterState } from "@tanstack/react-router";
import {
	createContext,
	type ReactNode,
	useContext,
	useEffect,
	useState,
} from "react";
import { authClient } from "#/lib/auth-client";

export interface GroupSummary {
	id: string;
	name: string;
	slug: string;
	status: string;
	role: "owner" | "admin" | "organizer" | "member";
}

interface GroupContextValue {
	groups: GroupSummary[];
	selectedGroup: GroupSummary | null;
	isPending: boolean;
	error: string | null;
	hasRestorableSelection: boolean;
	selectGroup: (group: GroupSummary) => void;
}

const GroupContext = createContext<GroupContextValue | null>(null);

function getStorageKey(userId: string) {
	return `selected-group:${userId}`;
}

export function GroupProvider({ children }: { children: ReactNode }) {
	const pathname = useRouterState({
		select: (state) => state.location.pathname,
	});
	const { data: session, isPending: isSessionPending } =
		authClient.useSession();
	const userId = session?.user.id;
	const [groups, setGroups] = useState<GroupSummary[]>([]);
	const [selectedGroup, setSelectedGroup] = useState<GroupSummary | null>(null);
	const [isPending, setIsPending] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [hasRestorableSelection, setHasRestorableSelection] = useState(false);

	useEffect(() => {
		if (!userId) {
			setGroups([]);
			setSelectedGroup(null);
			setError(null);
			setHasRestorableSelection(false);
			return;
		}

		const controller = new AbortController();
		setIsPending(true);
		setError(null);
		void fetch("/api/workspaces", { signal: controller.signal })
			.then(async (response) => {
				const result = (await response.json()) as {
					error?: string;
					workspaces?: GroupSummary[];
				};
				if (!response.ok || !result.workspaces) {
					throw new Error(result.error ?? "Could not load your groups");
				}
				return result.workspaces;
			})
			.then((nextGroups) => {
				const storedGroupId = window.localStorage.getItem(
					getStorageKey(userId),
				);
				const storedGroup = nextGroups.find(
					(group) => group.id === storedGroupId,
				);
				const routeSlug = pathname.match(/^\/groups\/([^/]+)$/)?.[1];
				const routeGroup = nextGroups.find((group) => group.slug === routeSlug);
				const nextSelection =
					routeGroup ?? storedGroup ?? nextGroups[0] ?? null;

				setGroups(nextGroups);
				setSelectedGroup(nextSelection);
				setHasRestorableSelection(Boolean(storedGroup));
				if (nextSelection) {
					window.localStorage.setItem(getStorageKey(userId), nextSelection.id);
				} else {
					window.localStorage.removeItem(getStorageKey(userId));
				}
			})
			.catch((fetchError: unknown) => {
				if (fetchError instanceof Error && fetchError.name !== "AbortError") {
					setError(fetchError.message);
				}
			})
			.finally(() => setIsPending(false));

		return () => controller.abort();
	}, [pathname, userId]);

	const selectGroup = (group: GroupSummary) => {
		setSelectedGroup(group);
		if (userId) {
			window.localStorage.setItem(getStorageKey(userId), group.id);
		}
	};

	return (
		<GroupContext.Provider
			value={{
				groups,
				selectedGroup,
				isPending: isSessionPending || isPending,
				error,
				hasRestorableSelection,
				selectGroup,
			}}
		>
			{children}
		</GroupContext.Provider>
	);
}

export function useGroup() {
	const context = useContext(GroupContext);
	if (!context) {
		throw new Error("useGroup must be used within GroupProvider");
	}
	return context;
}
