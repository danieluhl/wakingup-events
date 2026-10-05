import { z } from "zod";

export const eventInput = z.object({
	title: z.string().trim().min(2).max(120),
	startsAt: z.string().trim().min(1),
	durationMinutes: z.coerce.number().int().min(5).max(1440),
	location: z.string().trim().min(2).max(200),
	organizerUserId: z.string().min(1),
	meetingTypeId: z.string().min(1).nullable().optional(),
});

export type EventInput = z.infer<typeof eventInput>;

export const eventUpdateInput = z.object({
	eventId: z.string().min(1),
	attendanceCount: z.number().int().min(0).max(100000).nullable(),
	notes: z.string().trim().max(2000).nullable(),
});

export type EventUpdateInput = z.infer<typeof eventUpdateInput>;

export interface WorkspaceEvent {
	id: string;
	title: string;
	startsAt: string;
	durationMinutes: number;
	location: string;
	organizerUserId: string;
	organizerName: string;
	meetingTypeId: string | null;
	meetingTypeTitle: string | null;
	attendanceCount: number | null;
	postEventNotes: string | null;
	postEventUpdatedAt: string | null;
}

export function getEventEnd(startsAt: string | Date, durationMinutes: number) {
	const date = typeof startsAt === "string" ? new Date(startsAt) : startsAt;
	return new Date(date.getTime() + durationMinutes * 60 * 1000);
}

export function getZonedDateParts(date: Date, timeZone: string) {
	const parts = Object.fromEntries(
		new Intl.DateTimeFormat("en-US", {
			timeZone,
			hour12: false,
			year: "numeric",
			month: "2-digit",
			day: "2-digit",
		})
			.formatToParts(date)
			.map((part) => [part.type, part.value]),
	);
	return {
		year: Number(parts.year),
		month: Number(parts.month) - 1,
		day: Number(parts.day),
	};
}

export function zonedDateKey(date: Date, timeZone: string) {
	const { year, month, day } = getZonedDateParts(date, timeZone);
	return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function isPastEvent(
	event: Pick<WorkspaceEvent, "startsAt" | "durationMinutes">,
	now: Date = new Date(),
) {
	return (
		getEventEnd(event.startsAt, event.durationMinutes).getTime() < now.getTime()
	);
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

export function formatEventTime(startsAt: string | Date, timeZone: string) {
	const date = typeof startsAt === "string" ? new Date(startsAt) : startsAt;
	return new Intl.DateTimeFormat("en-US", {
		timeZone,
		hour: "numeric",
		minute: "2-digit",
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

function pad(value: number) {
	return String(value).padStart(2, "0");
}

function icsDateTimeUtc(date: Date) {
	return `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(
		date.getUTCDate(),
	)}T${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}${pad(
		date.getUTCSeconds(),
	)}Z`;
}

function escapeIcsText(value: string) {
	return value
		.replace(/\\/g, "\\\\")
		.replace(/;/g, "\\;")
		.replace(/,/g, "\\,")
		.replace(/\r?\n/g, "\\n");
}

function buildEventDescription(event: WorkspaceEvent, workspaceName: string) {
	return `Hosted by ${event.organizerName} for ${workspaceName}.`;
}

export function buildEventIcs(event: WorkspaceEvent, workspaceName: string) {
	const start = new Date(event.startsAt);
	const end = getEventEnd(event.startsAt, event.durationMinutes);
	const lines = [
		"BEGIN:VCALENDAR",
		"VERSION:2.0",
		"PRODID:-//Waking Up Events//EN",
		"CALSCALE:GREGORIAN",
		"METHOD:PUBLISH",
		"BEGIN:VEVENT",
		`UID:${event.id}@wakingup.events`,
		`DTSTAMP:${icsDateTimeUtc(new Date())}`,
		`DTSTART:${icsDateTimeUtc(start)}`,
		`DTEND:${icsDateTimeUtc(end)}`,
		`SUMMARY:${escapeIcsText(event.title)}`,
		`LOCATION:${escapeIcsText(event.location)}`,
		`DESCRIPTION:${escapeIcsText(buildEventDescription(event, workspaceName))}`,
		"END:VEVENT",
		"END:VCALENDAR",
	];
	return `${lines.join("\r\n")}\r\n`;
}

export function buildGoogleCalendarUrl(
	event: WorkspaceEvent,
	workspaceName: string,
) {
	const start = new Date(event.startsAt);
	const end = getEventEnd(event.startsAt, event.durationMinutes);
	const params = new URLSearchParams({
		action: "TEMPLATE",
		text: event.title,
		dates: `${icsDateTimeUtc(start)}/${icsDateTimeUtc(end)}`,
		location: event.location,
		details: buildEventDescription(event, workspaceName),
	});
	return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function downloadEventIcs(event: WorkspaceEvent, workspaceName: string) {
	const blob = new Blob([buildEventIcs(event, workspaceName)], {
		type: "text/calendar;charset=utf-8",
	});
	const url = URL.createObjectURL(blob);
	const link = document.createElement("a");
	const fileName =
		event.title
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, "-")
			.replace(/^-|-$/g, "") || "event";
	link.href = url;
	link.download = `${fileName}.ics`;
	document.body.appendChild(link);
	link.click();
	link.remove();
	URL.revokeObjectURL(url);
}
