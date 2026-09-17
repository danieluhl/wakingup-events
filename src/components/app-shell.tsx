import { Link, useRouterState } from "@tanstack/react-router";
import {
	CalendarDays,
	House,
	Menu,
	PanelLeftClose,
	PanelLeftOpen,
	Plus,
	X,
} from "lucide-react";
import { useState } from "react";
import { Avatar, AvatarFallback } from "#/components/ui/avatar";
import { Button } from "#/components/ui/button";
import { authClient } from "#/lib/auth-client";
import { cn } from "#/lib/utils";

const navigation = [
	{ label: "Home", to: "/", icon: House },
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
	const pathname = useRouterState({
		select: (state) => state.location.pathname,
	});
	const { data: session } = authClient.useSession();
	const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
	const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

	return (
		<div className="min-h-dvh bg-background text-foreground">
			<header className="sticky top-0 z-40 h-16 border-b border-border bg-background">
				<div className="flex h-full items-center justify-between gap-4 px-4 sm:px-6">
					<div className="flex min-w-0 items-center gap-3">
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
						<Link
							to="/"
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

					{session?.user ? (
						<div className="flex min-w-0 items-center gap-3">
							<div className="hidden min-w-0 text-right sm:block">
								<p className="truncate text-sm font-semibold">
									{session.user.name}
								</p>
								<p className="truncate text-xs text-muted-foreground">
									{session.user.email}
								</p>
							</div>
							<Avatar>
								<AvatarFallback>
									{getInitials(session.user.name) || "WU"}
								</AvatarFallback>
							</Avatar>
						</div>
					) : (
						<Link to="/login" className="text-sm font-semibold">
							Sign in
						</Link>
					)}
				</div>
			</header>

			{isMobileMenuOpen && (
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
						<NavigationLinks
							pathname={pathname}
							onNavigate={() => setIsMobileMenuOpen(false)}
						/>
					</nav>
				</>
			)}

			<div className="flex min-h-[calc(100dvh-4rem)]">
				<aside
					className={cn(
						"sticky top-16 hidden h-[calc(100dvh-4rem)] shrink-0 border-r border-border bg-card transition-[width] duration-200 lg:flex lg:flex-col",
						isSidebarCollapsed ? "w-20" : "w-64",
					)}
				>
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

				<div className="min-w-0 flex-1">{children}</div>
			</div>
		</div>
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
					item.to === "/" ? pathname === item.to : pathname.startsWith(item.to);

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
