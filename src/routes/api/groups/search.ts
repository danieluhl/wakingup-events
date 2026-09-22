import { env } from "cloudflare:workers";
import { createFileRoute } from "@tanstack/react-router";
import { asc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import { workspaceAddresses, workspaces } from "#/db/schema";
import { auth } from "#/lib/auth";
import {
	type Coordinates,
	distanceMiles,
	geocodeLocationQuery,
	geocodeMeetingAddress,
	isCoordinates,
} from "#/lib/geocoding";
import { formatMeetingAddress } from "#/lib/workspace-addresses";

const SEARCH_RADIUS_MILES = 50;
const MAX_LAZY_GEOCODES = 25;

const searchGroups = async ({ request }: { request: Request }) => {
	const currentSession = await auth.api.getSession({
		headers: request.headers,
	});
	if (!currentSession) {
		return Response.json({ error: "Unauthorized" }, { status: 401 });
	}

	const params = new URL(request.url).searchParams;
	const latitude = Number(params.get("lat"));
	const longitude = Number(params.get("lng"));
	const zip = params.get("zip")?.trim() ?? "";

	let origin: Coordinates | null = null;
	if (
		params.has("lat") &&
		params.has("lng") &&
		isCoordinates({ latitude, longitude })
	) {
		origin = { latitude, longitude };
	} else if (zip.length > 0) {
		if (!env.GOOGLE_MAPS_API_KEY) {
			return Response.json(
				{ error: "Location search is not configured yet" },
				{ status: 503 },
			);
		}
		const outcome = await geocodeLocationQuery(zip);
		if (outcome.status !== "ok") {
			return Response.json(
				{
					error:
						outcome.status === "not_found"
							? "We could not find that ZIP code"
							: "Location search is temporarily unavailable. Please try again.",
				},
				{ status: outcome.status === "not_found" ? 400 : 503 },
			);
		}
		origin = outcome.coordinates;
	}

	if (!origin) {
		return Response.json(
			{
				error:
					"Enter a ZIP code or share your location to search nearby groups",
			},
			{ status: 400 },
		);
	}

	const db = drizzle(env.DB);
	const addressRows = await db
		.select({
			workspaceId: workspaces.id,
			workspaceName: workspaces.name,
			workspaceSlug: workspaces.slug,
			addressId: workspaceAddresses.id,
			label: workspaceAddresses.label,
			street: workspaceAddresses.street,
			addressLocality: workspaceAddresses.locality,
			addressRegion: workspaceAddresses.region,
			postalCode: workspaceAddresses.postalCode,
			addressCountryCode: workspaceAddresses.countryCode,
			latitude: workspaceAddresses.latitude,
			longitude: workspaceAddresses.longitude,
		})
		.from(workspaces)
		.innerJoin(
			workspaceAddresses,
			eq(workspaceAddresses.workspaceId, workspaces.id),
		)
		.where(eq(workspaces.status, "active"))
		.orderBy(asc(workspaces.id), asc(workspaceAddresses.sortOrder));

	const missingCoordinates = addressRows.filter(
		(row) =>
			!isCoordinates({
				latitude: row.latitude ?? Number.NaN,
				longitude: row.longitude ?? Number.NaN,
			}),
	);
	await Promise.all(
		missingCoordinates.slice(0, MAX_LAZY_GEOCODES).map(async (row) => {
			const coordinates = await geocodeMeetingAddress({
				street: row.street,
				locality: row.addressLocality,
				region: row.addressRegion,
				postalCode: row.postalCode,
				countryCode: row.addressCountryCode,
			});
			if (!coordinates) return;

			row.latitude = coordinates.latitude;
			row.longitude = coordinates.longitude;
			await db
				.update(workspaceAddresses)
				.set(coordinates)
				.where(eq(workspaceAddresses.id, row.addressId));
		}),
	);

	const locations = addressRows
		.flatMap((row) => {
			if (
				!isCoordinates({
					latitude: row.latitude ?? Number.NaN,
					longitude: row.longitude ?? Number.NaN,
				})
			) {
				return [];
			}

			const coordinates = {
				latitude: row.latitude as number,
				longitude: row.longitude as number,
			};
			const distance = distanceMiles(origin, coordinates);
			if (distance > SEARCH_RADIUS_MILES) return [];

			return [
				{
					id: row.addressId,
					workspaceId: row.workspaceId,
					name: row.workspaceName,
					slug: row.workspaceSlug,
					label: row.label,
					latitude: coordinates.latitude,
					longitude: coordinates.longitude,
					distanceMiles: Math.round(distance * 10) / 10,
					address: formatMeetingAddress({
						street: row.street,
						locality: row.addressLocality,
						region: row.addressRegion,
						postalCode: row.postalCode,
						countryCode: row.addressCountryCode,
					}),
				},
			];
		})
		.sort((a, b) => a.distanceMiles - b.distanceMiles);

	return Response.json({ origin, locations });
};

export const Route = createFileRoute("/api/groups/search")({
	server: {
		handlers: {
			GET: searchGroups,
		},
	},
});
