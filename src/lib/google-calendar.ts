import { env } from "#/env";

const TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";
const CALENDAR_API = "https://www.googleapis.com/calendar/v3";

interface CachedAccessToken {
	accessToken: string;
	expiresAt: number;
}

let cachedAccessToken: CachedAccessToken | null = null;

/**
 * The OAuth client identifies the app, not a user, so the same client is reused
 * for sign-in and calendar access. The dedicated `GOOGLE_CALENDAR_*` vars exist
 * only to override it with a separate client if that is ever needed.
 */
function getOAuthClient() {
	return {
		clientId: env.GOOGLE_CALENDAR_CLIENT_ID ?? env.GOOGLE_CLIENT_ID,
		clientSecret: env.GOOGLE_CALENDAR_CLIENT_SECRET ?? env.GOOGLE_CLIENT_SECRET,
	};
}

export function isGoogleCalendarConfigured() {
	const { clientId, clientSecret } = getOAuthClient();
	return Boolean(clientId && clientSecret && env.GOOGLE_CALENDAR_REFRESH_TOKEN);
}

async function getAccessToken() {
	if (
		cachedAccessToken &&
		cachedAccessToken.expiresAt > Date.now() + 60 * 1000
	) {
		return cachedAccessToken.accessToken;
	}

	const { clientId, clientSecret } = getOAuthClient();
	const response = await fetch(TOKEN_ENDPOINT, {
		method: "POST",
		headers: { "content-type": "application/x-www-form-urlencoded" },
		body: new URLSearchParams({
			client_id: clientId ?? "",
			client_secret: clientSecret ?? "",
			refresh_token: env.GOOGLE_CALENDAR_REFRESH_TOKEN ?? "",
			grant_type: "refresh_token",
		}),
	});

	if (!response.ok) {
		throw new Error(
			`Google Calendar token request failed (${response.status}): ${await response.text()}`,
		);
	}

	const data = (await response.json()) as {
		access_token: string;
		expires_in: number;
	};
	cachedAccessToken = {
		accessToken: data.access_token,
		expiresAt: Date.now() + data.expires_in * 1000,
	};
	return cachedAccessToken.accessToken;
}

async function googleCalendarFetch(path: string, init?: RequestInit) {
	const accessToken = await getAccessToken();
	const response = await fetch(`${CALENDAR_API}${path}`, {
		...init,
		headers: {
			"content-type": "application/json",
			...init?.headers,
			authorization: `Bearer ${accessToken}`,
		},
	});

	if (!response.ok) {
		throw new Error(
			`Google Calendar request failed (${response.status}): ${await response.text()}`,
		);
	}

	return response;
}

function zonedDateTime(date: Date, timeZone: string) {
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
	const hour = parts.hour === "24" ? "00" : parts.hour;
	return `${parts.year}-${parts.month}-${parts.day}T${hour}:${parts.minute}:${parts.second}`;
}

export async function createCalendar(name: string, timeZone: string) {
	const response = await googleCalendarFetch("/calendars", {
		method: "POST",
		body: JSON.stringify({ summary: name, timeZone }),
	});
	const data = (await response.json()) as { id: string };
	return data.id;
}

export async function makeCalendarPublic(calendarId: string) {
	await googleCalendarFetch(
		`/calendars/${encodeURIComponent(calendarId)}/acl`,
		{
			method: "POST",
			body: JSON.stringify({
				role: "reader",
				scope: { type: "default" },
			}),
		},
	);
}

export interface CalendarEventInput {
	title: string;
	startsAt: Date;
	durationMinutes: number;
	location: string;
	description?: string;
	timeZone: string;
	sourceUrl?: string;
}

export async function createCalendarEvent(
	calendarId: string,
	input: CalendarEventInput,
) {
	const endsAt = new Date(
		input.startsAt.getTime() + input.durationMinutes * 60 * 1000,
	);
	const response = await googleCalendarFetch(
		`/calendars/${encodeURIComponent(calendarId)}/events`,
		{
			method: "POST",
			body: JSON.stringify({
				summary: input.title,
				location: input.location,
				description: input.description,
				source: input.sourceUrl
					? { title: "Waking Up Events", url: input.sourceUrl }
					: undefined,
				start: {
					dateTime: zonedDateTime(input.startsAt, input.timeZone),
					timeZone: input.timeZone,
				},
				end: {
					dateTime: zonedDateTime(endsAt, input.timeZone),
					timeZone: input.timeZone,
				},
			}),
		},
	);
	const data = (await response.json()) as { id: string };
	return data.id;
}

export interface GoogleCalendarUrls {
	embedUrl: string;
	subscribeUrl: string;
	addUrl: string;
}

export function getGoogleCalendarUrls(
	calendarId: string,
	timeZone?: string,
): GoogleCalendarUrls {
	const encodedId = encodeURIComponent(calendarId);
	return {
		embedUrl: `https://calendar.google.com/calendar/embed?src=${encodedId}${
			timeZone ? `&ctz=${encodeURIComponent(timeZone)}` : ""
		}`,
		subscribeUrl: `https://calendar.google.com/calendar/ical/${calendarId}/public/basic.ics`,
		addUrl: `https://calendar.google.com/calendar/render?cid=${encodedId}`,
	};
}
