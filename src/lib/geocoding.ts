import { env } from "#/env";

export interface Coordinates {
	latitude: number;
	longitude: number;
}

interface GoogleGeocodeResponse {
	status: string;
	error_message?: string;
	results?: {
		geometry?: {
			location?: {
				lat: number;
				lng: number;
			};
		};
	}[];
}

export type GeocodeOutcome =
	| { status: "ok"; coordinates: Coordinates }
	| { status: "not_found" }
	| { status: "unavailable" };

const EARTH_RADIUS_MILES = 3958.7613;

export function isCoordinates(value: { latitude: number; longitude: number }) {
	return (
		Number.isFinite(value.latitude) &&
		Number.isFinite(value.longitude) &&
		Math.abs(value.latitude) <= 90 &&
		Math.abs(value.longitude) <= 180
	);
}

export function distanceMiles(from: Coordinates, to: Coordinates) {
	const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
	const deltaLatitude = toRadians(to.latitude - from.latitude);
	const deltaLongitude = toRadians(to.longitude - from.longitude);
	const fromLatitude = toRadians(from.latitude);
	const toLatitude = toRadians(to.latitude);

	const haversine =
		Math.sin(deltaLatitude / 2) ** 2 +
		Math.cos(fromLatitude) *
			Math.cos(toLatitude) *
			Math.sin(deltaLongitude / 2) ** 2;

	return 2 * EARTH_RADIUS_MILES * Math.asin(Math.sqrt(haversine));
}

async function geocode(query: string): Promise<GeocodeOutcome> {
	const apiKey = env.GOOGLE_MAPS_API_KEY;
	if (!apiKey) return { status: "unavailable" };
	if (query.trim().length === 0) return { status: "not_found" };

	const url = new URL("https://maps.googleapis.com/maps/api/geocode/json");
	url.searchParams.set("address", query);
	url.searchParams.set("key", apiKey);

	try {
		const response = await fetch(url);
		if (!response.ok) return { status: "unavailable" };

		const data = (await response.json()) as GoogleGeocodeResponse;
		if (data.status === "ZERO_RESULTS") return { status: "not_found" };
		if (data.status !== "OK") {
			console.error(
				`Google Geocoding request failed: ${data.status}${
					data.error_message ? ` - ${data.error_message}` : ""
				}`,
			);
			return { status: "unavailable" };
		}

		const location = data.results?.[0]?.geometry?.location;
		if (!location) return { status: "not_found" };

		return {
			status: "ok",
			coordinates: { latitude: location.lat, longitude: location.lng },
		};
	} catch {
		return { status: "unavailable" };
	}
}

export async function geocodeMeetingAddress(address: {
	street: string;
	locality: string;
	region?: string | null;
	postalCode?: string | null;
	countryCode: string;
}): Promise<Coordinates | null> {
	const outcome = await geocode(
		[
			address.street,
			address.locality,
			address.region,
			address.postalCode,
			address.countryCode,
		]
			.filter(Boolean)
			.join(", "),
	);
	return outcome.status === "ok" ? outcome.coordinates : null;
}

export function geocodeLocationQuery(query: string): Promise<GeocodeOutcome> {
	return geocode(query);
}
