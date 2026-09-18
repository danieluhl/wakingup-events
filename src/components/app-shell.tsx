import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
	Building2,
	CalendarDays,
	Check,
	ChevronsUpDown,
	House,
	LogOut,
	Menu,
	PanelLeftClose,
	PanelLeftOpen,
	Plus,
	X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { type GroupSummary, useGroup } from "#/components/group-context";
import { ThemeSelector } from "#/components/theme-selector";
import { Avatar, AvatarFallback, AvatarImage } from "#/components/ui/avatar";
import { Button } from "#/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "#/components/ui/dropdown-menu";
import { authClient } from "#/lib/auth-client";
import { cn } from "#/lib/utils";

const navigation = [
	{ label: "Home", to: "/home", icon: House },
	{ label: "Create group", to: "/groups/new", icon: Plus },
] as const;

function getInitials(name: string) {
	return name
		.split(/\s+/)
		.filter(Boolean)
		.slice(0, 2)
		.map((part) => part.charAt(0).toUpperCase())
		.join("");
}

export function AppShell({ children }: { children: React.ReactNode }) {
	const navigate = useNavigate();
	const pathname = useRouterState({
		select: (state) => state.location.pathname,
	});
	const { data: session } = authClient.useSession();
	const {
		selectedGroup,
		isPending: areGroupsPending,
		hasRestorableSelection,
	} = useGroup();
	const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
	const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
	const defaultSelectionAppliedForUser = useRef<string | null>(null);
	const isPublicPage = pathname === "/" || pathname === "/login";

	useEffect(() => {
		const userId = session?.user.id;
		if (!userId) {
			defaultSelectionAppliedForUser.current = null;
			return;
		}
		if (
			areGroupsPending ||
			!selectedGroup ||
			defaultSelectionAppliedForUser.current === userId
		) {
			return;
		}

		defaultSelectionAppliedForUser.current = userId;
		if (pathname === "/home" && hasRestorableSelection) {
			void navigate({
				to: "/groups/$slug",
				params: { slug: selectedGroup.slug },
				replace: true,
			});
		}
	}, [
		areGroupsPending,
		hasRestorableSelection,
		navigate,
		pathname,
		selectedGroup,
		session?.user.id,
	]);

	return (
		<div className="min-h-dvh bg-background text-foreground">
			<header className="sticky top-0 z-40 h-16 border-b border-border bg-background">
				<div className="flex h-full items-center justify-between gap-4 px-4 sm:px-6">
					<div className="flex min-w-0 items-center gap-3">
						{!isPublicPage && (
							<Button
								type="button"
								variant="ghost"
								size="icon"
								className="button-flat border-transparent dark:border-transparent lg:hidden"
								aria-label={
									isMobileMenuOpen ? "Close navigation" : "Open navigation"
								}
								aria-expanded={isMobileMenuOpen}
								aria-controls="mobile-navigation"
								onClick={() => setIsMobileMenuOpen((isOpen) => !isOpen)}
							>
								{isMobileMenuOpen ? <X /> : <Menu />}
							</Button>
						)}
						<Link
							to="/home"
							className="flex min-w-0 items-center gap-3 text-foreground no-underline hover:text-foreground"
						>
							<span className="hidden size-9 shrink-0 items-center justify-center border border-primary bg-primary text-primary-foreground sm:flex">
								<CalendarDays className="size-4" aria-hidden="true" />
							</span>
							<span className="min-w-0 leading-none">
								<span className="display-title block truncate text-lg font-bold">
									Waking Up
								</span>
								<span className="mt-1 block text-[0.62rem] font-bold uppercase tracking-[0.22em] text-muted-foreground">
									Events
								</span>
							</span>
						</Link>
					</div>

					<div className="flex min-w-0 items-center gap-3">
						<ThemeSelector />
						{session?.user ? (
							<>
								<div className="hidden min-w-0 text-right sm:block">
									<p className="truncate text-sm font-semibold">
										{session.user.name}
									</p>
									<p className="truncate text-xs text-muted-foreground">
										{session.user.email}
									</p>
								</div>
								<DropdownMenu>
									<DropdownMenuTrigger
										asChild
										className="cursor-pointer rounded-full outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
									>
										<button type="button" aria-label="Open user menu">
											<Avatar>
												{session.user.image && (
													<AvatarImage
														src={session.user.image}
														alt={session.user.name}
													/>
												)}
												<AvatarFallback>
													{getInitials(session.user.name) || "WU"}
												</AvatarFallback>
											</Avatar>
										</button>
									</DropdownMenuTrigger>
									<DropdownMenuContent align="end" className="w-56">
										<DropdownMenuLabel>
											<p className="truncate text-sm font-semibold">
												{session.user.name}
											</p>
											<p className="truncate text-xs font-normal text-muted-foreground">
												{session.user.email}
											</p>
										</DropdownMenuLabel>
										<DropdownMenuSeparator />
										<DropdownMenuItem asChild>
											<Link to="/home">Home</Link>
										</DropdownMenuItem>
										<DropdownMenuSeparator />
										<DropdownMenuItem
											variant="destructive"
											onClick={() => void authClient.signOut()}
										>
											<LogOut aria-hidden="true" />
											Sign out
										</DropdownMenuItem>
									</DropdownMenuContent>
								</DropdownMenu>
							</>
						) : (
							<Link to="/login" className="text-sm font-semibold">
								Sign in
							</Link>
						)}
					</div>
				</div>
			</header>

			{!isPublicPage && isMobileMenuOpen && (
				<>
					<button
						type="button"
						className="fixed inset-x-0 bottom-0 top-16 z-20 cursor-default bg-black/30 lg:hidden"
						aria-label="Close navigation"
						onClick={() => setIsMobileMenuOpen(false)}
					/>
					<nav
						id="mobile-navigation"
						aria-label="Main navigation"
						className="fixed inset-x-0 top-16 z-30 border-b border-border bg-card p-4 shadow-lg lg:hidden"
					>
						<GroupSwitcher onNavigate={() => setIsMobileMenuOpen(false)} />
						<div className="my-3 h-px bg-border" />
						<NavigationLinks
							pathname={pathname}
							onNavigate={() => setIsMobileMenuOpen(false)}
						/>
					</nav>
				</>
			)}

			<div className="flex min-h-[calc(100dvh-4rem)]">
				{!isPublicPage && (
					<aside
						className={cn(
							"sticky top-16 hidden h-[calc(100dvh-4rem)] shrink-0 border-r border-border bg-card transition-[width] duration-200 lg:flex lg:flex-col",
							isSidebarCollapsed ? "w-20" : "w-64",
						)}
					>
						<div className="border-b border-border px-3">
							<GroupSwitcher isCollapsed={isSidebarCollapsed} />
						</div>
						<nav aria-label="Main navigation" className="flex-1 p-3">
							<NavigationLinks
								pathname={pathname}
								isCollapsed={isSidebarCollapsed}
							/>
						</nav>
						<div className="border-t border-border p-3">
							<Button
								type="button"
								variant="ghost"
								className={cn(
									"button-flat w-full gap-3 border-transparent normal-case tracking-normal dark:border-transparent",
									isSidebarCollapsed ? "px-0" : "justify-start",
								)}
								aria-label={
									isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"
								}
								title={isSidebarCollapsed ? "Expand sidebar" : undefined}
								onClick={() =>
									setIsSidebarCollapsed((isCollapsed) => !isCollapsed)
								}
							>
								{isSidebarCollapsed ? <PanelLeftOpen /> : <PanelLeftClose />}
								{!isSidebarCollapsed && <span>Collapse sidebar</span>}
							</Button>
						</div>
					</aside>
				)}

				<div className="min-w-0 flex-1">{children}</div>
			</div>
		</div>
	);
}

function GroupSwitcher({
	isCollapsed = false,
	onNavigate,
}: {
	isCollapsed?: boolean;
	onNavigate?: () => void;
}) {
	const navigate = useNavigate();
	const { groups, selectedGroup, isPending, selectGroup } = useGroup();

	if (isPending) {
		return (
			<div
				className={cn(
					"h-14 animate-pulse bg-muted",
					isCollapsed && "mx-auto w-11",
				)}
			/>
		);
	}

	if (!selectedGroup) {
		return (
			<div
				className={cn(
					"flex h-14 items-center gap-3 px-3 text-sm text-muted-foreground",
					isCollapsed && "justify-center px-0",
				)}
				title={isCollapsed ? "No groups yet" : undefined}
			>
				<Building2 className="size-4 shrink-0" aria-hidden="true" />
				{!isCollapsed && <span>No groups yet</span>}
			</div>
		);
	}

	const chooseGroup = (group: GroupSummary) => {
		selectGroup(group);
		onNavigate?.();
		void navigate({
			to: "/groups/$slug",
			params: { slug: group.slug },
		});
	};

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button
					type="button"
					variant="ghost"
					className={cn(
						"button-flat h-14 w-full gap-3 border-transparent px-3 normal-case tracking-normal dark:border-transparent",
						isCollapsed ? "justify-center px-0" : "justify-start",
					)}
					aria-label={
						isCollapsed ? `Current group: ${selectedGroup.name}` : undefined
					}
					title={isCollapsed ? selectedGroup.name : undefined}
				>
					<Building2 className="size-5 shrink-0" aria-hidden="true" />
					{!isCollapsed && (
						<>
							<span className="min-w-0 flex-1 text-left">
								<span className="block truncate text-sm font-semibold text-foreground">
									{selectedGroup.name}
								</span>
							</span>
							<ChevronsUpDown className="size-4 shrink-0" aria-hidden="true" />
						</>
					)}
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent
				side={isCollapsed ? "right" : "bottom"}
				align="start"
				className="w-64"
			>
				<DropdownMenuLabel>Switch group</DropdownMenuLabel>
				<DropdownMenuSeparator />
				{groups.map((group) => (
					<DropdownMenuItem
						key={group.id}
						onSelect={() => chooseGroup(group)}
						className="py-2"
					>
						<Building2 aria-hidden="true" />
						<span className="min-w-0 flex-1">
							<span className="block truncate">{group.name}</span>
							<span className="block text-xs capitalize text-muted-foreground">
								{group.role}
							</span>
						</span>
						{group.id === selectedGroup.id && (
							<Check className="size-4" aria-label="Selected" />
						)}
					</DropdownMenuItem>
				))}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

function NavigationLinks({
	pathname,
	isCollapsed = false,
	onNavigate,
}: {
	pathname: string;
	isCollapsed?: boolean;
	onNavigate?: () => void;
}) {
	return (
		<ul className="grid gap-1">
			{navigation.map((item) => {
				const Icon = item.icon;
				const isActive =
					pathname === item.to || pathname.startsWith(`${item.to}/`);

				return (
					<li key={item.to}>
						<Link
							to={item.to}
							aria-current={isActive ? "page" : undefined}
							aria-label={isCollapsed ? item.label : undefined}
							title={isCollapsed ? item.label : undefined}
							onClick={onNavigate}
							className={cn(
								"flex h-11 items-center gap-3 border border-transparent px-3 text-sm font-semibold text-muted-foreground no-underline hover:bg-muted hover:text-foreground",
								isActive && "border-border bg-muted text-foreground",
								isCollapsed && "justify-center px-0",
							)}
						>
							<Icon className="size-4 shrink-0" aria-hidden="true" />
							{!isCollapsed && <span>{item.label}</span>}
						</Link>
					</li>
				);
			})}
		</ul>
	);
}
