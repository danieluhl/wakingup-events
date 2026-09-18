import { z } from "zod";

export const eventInput = z.object({
	title: z.string().trim().min(2).max(120),
	startsAt: z.string().trim().min(1),
	durationMinutes: z.coerce.number().int().min(5).max(1440),
	location: z.string().trim().min(2).max(200),
	organizerUserId: z.string().min(1),
});

export type EventInput = z.infer<typeof eventInput>;

export interface WorkspaceEvent {
	id: string;
	title: string;
	startsAt: string;
	durationMinutes: number;
	location: string;
	organizerUserId: string;
	organizerName: string;
}

export function formatEventDateTime(startsAt: string | Date, timeZone: string) {
	const date = typeof startsAt === "string" ? new Date(startsAt) : startsAt;
	return new Intl.DateTimeFormat("en-US", {
		timeZone,
		weekday: "short",
		month: "short",
		day: "numeric",
		year: "numeric",
		hour: "numeric",
		minute: "2-digit",
		timeZoneName: "short",
	}).format(date);
}

export function formatEventDuration(minutes: number) {
	const hours = Math.floor(minutes / 60);
	const remainder = minutes % 60;
	if (hours === 0) return `${remainder} min`;
	if (remainder === 0) return `${hours} hr`;
	return `${hours} hr ${remainder} min`;
}

function getTimeZoneOffsetMs(date: Date, timeZone: string) {
	const parts = Object.fromEntries(
		new Intl.DateTimeFormat("en-US", {
			timeZone,
			hour12: false,
			year: "numeric",
			month: "2-digit",
			day: "2-digit",
			hour: "2-digit",
			minute: "2-digit",
			second: "2-digit",
		})
			.formatToParts(date)
			.map((part) => [part.type, part.value]),
	);
	const asUtc = Date.UTC(
		Number(parts.year),
		Number(parts.month) - 1,
		Number(parts.day),
		Number(parts.hour === "24" ? "00" : parts.hour),
		Number(parts.minute),
		Number(parts.second),
	);
	return asUtc - Math.floor(date.getTime() / 1000) * 1000;
}

export function zonedDateTimeToUtc(localDateTime: string, timeZone: string) {
	const [datePart, timePart = "00:00"] = localDateTime.split("T");
	const [year, month, day] = datePart.split("-").map(Number);
	const [hour, minute] = timePart.split(":").map(Number);
	if ([year, month, day, hour, minute].some((value) => Number.isNaN(value))) {
		return null;
	}

	const utcGuess = Date.UTC(year, month - 1, day, hour, minute);
	const offset = getTimeZoneOffsetMs(new Date(utcGuess), timeZone);
	return new Date(utcGuess - offset);
}

export function zonedDateTimeInputDefault(timeZone: string) {
	const parts = Object.fromEntries(
		new Intl.DateTimeFormat("en-US", {
			timeZone,
			hour12: false,
			year: "numeric",
			month: "2-digit",
			day: "2-digit",
			hour: "2-digit",
			minute: "2-digit",
		})
			.formatToParts(new Date(Date.now() + 60 * 60 * 1000))
			.map((part) => [part.type, part.value]),
	);
	const hour = Number(parts.hour === "24" ? "00" : parts.hour);
	return `${parts.year}-${parts.month}-${parts.day}T${String(hour).padStart(2, "0")}:00`;
}
