import type { QueryClient } from "@tanstack/react-query";
import {
	createRootRouteWithContext,
	HeadContent,
	Scripts,
} from "@tanstack/react-router";
import { AppShell } from "#/components/app-shell";
import { GroupProvider } from "#/components/group-context";
import { TooltipProvider } from "#/components/ui/tooltip";
import appCss from "../styles.css?url";

interface MyRouterContext {
	queryClient: QueryClient;
}

const themeScript = `(() => {
	const key = "theme";
	const storage = window.localStorage;
	const preference = window.matchMedia("(prefers-color-scheme: dark)");
	const applyTheme = () => {
		const stored = storage.getItem(key);
		const theme =
			stored === "light" || stored === "dark" || stored === "system"
				? stored
				: "system";
		const isDark =
			theme === "system" ? preference.matches : theme === "dark";
		document.documentElement.classList.toggle("dark", isDark);
	};
	applyTheme();
	preference.addEventListener("change", applyTheme);
})();`;

export const Route = createRootRouteWithContext<MyRouterContext>()({
	head: () => ({
		meta: [
			{
				charSet: "utf-8",
			},
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1",
			},
			{
				name: "color-scheme",
				content: "light dark",
			},
			{
				title: "Waking Up Events",
			},
		],
		links: [
			{
				rel: "stylesheet",
				href: appCss,
			},
		],
	}),
	shellComponent: RootDocument,
});

function RootDocument({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en" suppressHydrationWarning>
			<head>
				<HeadContent />
				{/* The static script must run before paint to prevent a theme flash. */}
				<script>{themeScript}</script>
			</head>
			<body>
				<TooltipProvider>
					<GroupProvider>
						<AppShell>{children}</AppShell>
					</GroupProvider>
				</TooltipProvider>
				<Scripts />
			</body>
		</html>
	);
}
