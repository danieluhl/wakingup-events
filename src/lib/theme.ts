import { useSyncExternalStore } from "react";

export type Theme = "light" | "dark" | "system";

export const THEME_STORAGE_KEY = "theme";

function getStoredTheme(): Theme {
	if (typeof window === "undefined") return "system";
	const value = window.localStorage.getItem(THEME_STORAGE_KEY);
	if (value === "light" || value === "dark" || value === "system") {
		return value;
	}
	return "system";
}

function getSystemTheme(): "light" | "dark" {
	if (typeof window === "undefined") return "light";
	return window.matchMedia("(prefers-color-scheme: dark)").matches
		? "dark"
		: "light";
}

function applyTheme(theme: Theme) {
	if (typeof document === "undefined") return;
	const resolved = theme === "system" ? getSystemTheme() : theme;
	document.documentElement.classList.toggle("dark", resolved === "dark");
}

if (typeof window !== "undefined") {
	window
		.matchMedia("(prefers-color-scheme: dark)")
		.addEventListener("change", () => applyTheme(getStoredTheme()));
}

const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
	listeners.add(listener);
	return () => {
		listeners.delete(listener);
	};
}

function notify() {
	for (const listener of listeners) listener();
}

function getServerSnapshot(): Theme {
	return "system";
}

export function setTheme(theme: Theme) {
	if (typeof window === "undefined") return;
	window.localStorage.setItem(THEME_STORAGE_KEY, theme);
	applyTheme(theme);
	notify();
}

export function useTheme() {
	return useSyncExternalStore(subscribe, getStoredTheme, getServerSnapshot);
}
