import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
	Building2,
	CalendarDays,
	Check,
	ChevronsUpDown,
	House,
	LogOut,
	Users,
} from "lucide-react";
import { useEffect, useRef } from "react";
import { type GroupSummary, useGroup } from "#/components/group-context";
import { ThemeSelector } from "#/components/theme-selector";
import { Avatar, AvatarFallback, AvatarImage } from "#/components/ui/avatar";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "#/components/ui/dropdown-menu";
import {
	Sidebar,
	SidebarContent,
	SidebarHeader,
	SidebarInset,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarMenuSkeleton,
	SidebarProvider,
	SidebarRail,
	SidebarSeparator,
	SidebarTrigger,
} from "#/components/ui/sidebar";
import { authClient } from "#/lib/auth-client";
import { canManageEvents } from "#/lib/workspace-roles";

const navigation = [
	{ label: "Home", to: "/home", icon: House },
	{ label: "Groups", to: "/groups", icon: Users },
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
		<SidebarProvider>
			{isPublicPage ? (
				<div className="min-h-dvh w-full bg-background text-foreground">
					<header className="sticky top-0 z-40 h-16 border-b border-border bg-background">
						<div className="flex h-full items-center justify-between gap-4 px-4 sm:px-6">
							<Brand />
							<div className="flex min-w-0 items-center gap-3">
								<ThemeSelector />
								<Link to="/login" className="text-sm font-semibold">
									Sign in
								</Link>
							</div>
						</div>
					</header>
					<div>{children}</div>
				</div>
			) : (
				<>
					<Sidebar collapsible="icon">
						<SidebarHeader className="h-16 justify-center border-b border-border">
							<Brand />
						</SidebarHeader>
						<SidebarContent className="p-2">
							<GroupSwitcher />
							<SidebarSeparator className="mx-0 my-1" />
							<NavigationLinks pathname={pathname} />
						</SidebarContent>
						<SidebarRail />
					</Sidebar>
					<SidebarInset>
						<header className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-4 border-b border-border bg-background px-4 sm:px-5">
							<SidebarTrigger className="-ml-1" />
							<div className="ml-auto flex min-w-0 items-center gap-3">
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
										<UserMenu
											name={session.user.name}
											email={session.user.email}
											image={session.user.image}
										/>
									</>
								) : (
									<Link to="/login" className="text-sm font-semibold">
										Sign in
									</Link>
								)}
							</div>
						</header>
						<main className="min-w-0 flex-1">{children}</main>
					</SidebarInset>
				</>
			)}
		</SidebarProvider>
	);
}

function Brand() {
	return (
		<Link
			to="/home"
			className="flex min-w-0 items-center gap-3 text-foreground no-underline group-data-[collapsible=icon]:justify-center hover:text-foreground"
		>
			<span className="flex size-9 shrink-0 items-center justify-center border border-primary bg-primary text-primary-foreground">
				<CalendarDays className="size-4" aria-hidden="true" />
			</span>
			<span className="min-w-0 leading-none group-data-[collapsible=icon]:hidden">
				<span className="display-title block truncate text-lg font-bold">
					Waking Up
				</span>
				<span className="mt-1 block text-[0.62rem] font-bold uppercase tracking-[0.22em] text-muted-foreground">
					Events
				</span>
			</span>
		</Link>
	);
}

function UserMenu({
	name,
	email,
	image,
}: {
	name: string;
	email: string;
	image?: string | null;
}) {
	return (
		<DropdownMenu>
			<DropdownMenuTrigger
				asChild
				className="cursor-pointer rounded-full outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
			>
				<button type="button" aria-label="Open user menu">
					<Avatar>
						{image && <AvatarImage src={image} alt={name} />}
						<AvatarFallback>{getInitials(name) || "WU"}</AvatarFallback>
					</Avatar>
				</button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="w-56">
				<DropdownMenuLabel>
					<p className="truncate text-sm font-semibold">{name}</p>
					<p className="truncate text-xs font-normal text-muted-foreground">
						{email}
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
	);
}

function GroupSwitcher({ onNavigate }: { onNavigate?: () => void }) {
	const navigate = useNavigate();
	const { groups, selectedGroup, isPending, selectGroup } = useGroup();

	if (isPending) {
		return (
			<SidebarMenu>
				<SidebarMenuSkeleton showIcon className="h-14" />
			</SidebarMenu>
		);
	}

	if (!selectedGroup) {
		return (
			<SidebarMenu>
				<SidebarMenuItem>
					<SidebarMenuButton
						size="lg"
						className="text-muted-foreground"
						tooltip="No groups yet"
					>
						<Building2 />
						<span className="group-data-[collapsible=icon]:hidden">
							No groups yet
						</span>
					</SidebarMenuButton>
				</SidebarMenuItem>
			</SidebarMenu>
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
		<SidebarMenu>
			<SidebarMenuItem>
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<SidebarMenuButton
							size="lg"
							tooltip={`Current group: ${selectedGroup.name}`}
						>
							<Building2 />
							<span className="min-w-0 flex-1 truncate text-left font-semibold group-data-[collapsible=icon]:hidden">
								{selectedGroup.name}
							</span>
							<ChevronsUpDown className="ml-auto group-data-[collapsible=icon]:hidden" />
						</SidebarMenuButton>
					</DropdownMenuTrigger>
					<DropdownMenuContent side="right" align="start" className="w-64">
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
			</SidebarMenuItem>
		</SidebarMenu>
	);
}

function NavigationLinks({
	pathname,
	onNavigate,
}: {
	pathname: string;
	onNavigate?: () => void;
}) {
	const { selectedGroup } = useGroup();
	const isGroupsActive =
		pathname === "/groups" ||
		pathname === "/groups/new" ||
		/^\/groups\/[^/]+$/.test(pathname);
	const isEventsActive =
		selectedGroup !== null &&
		(pathname === `/groups/${selectedGroup.slug}/events` ||
			pathname.startsWith(`/groups/${selectedGroup.slug}/events/`));

	return (
		<SidebarMenu>
			{navigation.map((item) => {
				const Icon = item.icon;
				const isActive =
					item.to === "/groups" ? isGroupsActive : pathname === item.to;

				return (
					<SidebarMenuItem key={item.to}>
						<SidebarMenuButton asChild isActive={isActive} tooltip={item.label}>
							<Link
								to={item.to}
								aria-current={isActive ? "page" : undefined}
								onClick={onNavigate}
							>
								<Icon aria-hidden="true" />
								<span className="group-data-[collapsible=icon]:hidden">
									{item.label}
								</span>
							</Link>
						</SidebarMenuButton>
					</SidebarMenuItem>
				);
			})}
			{selectedGroup && canManageEvents(selectedGroup.role) && (
				<SidebarMenuItem>
					<SidebarMenuButton asChild isActive={isEventsActive} tooltip="Events">
						<Link
							to="/groups/$slug/events"
							params={{ slug: selectedGroup.slug }}
							aria-current={isEventsActive ? "page" : undefined}
							onClick={onNavigate}
						>
							<CalendarDays aria-hidden="true" />
							<span className="group-data-[collapsible=icon]:hidden">
								Events
							</span>
						</Link>
					</SidebarMenuButton>
				</SidebarMenuItem>
			)}
		</SidebarMenu>
	);
}
