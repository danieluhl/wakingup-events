import { createFileRoute, Link } from "@tanstack/react-router";
import {
	AdvancedMarker,
	APIProvider,
	ColorScheme,
	Map as GoogleMap,
	InfoWindow,
	Pin,
	useMap,
} from "@vis.gl/react-google-maps";
import { CircleAlert, LocateFixed, MapPin, Search } from "lucide-react";
import { type FormEvent, useEffect, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "#/components/ui/alert";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "#/components/ui/card";
import { Input } from "#/components/ui/input";
import { Label } from "#/components/ui/label";
import { Separator } from "#/components/ui/separator";
import { Skeleton } from "#/components/ui/skeleton";

interface SearchLocation {
	id: string;
	workspaceId: string;
	name: string;
	slug: string;
	label: string | null;
	latitude: number;
	longitude: number;
	distanceMiles: number;
	address: string;
}

interface SearchOrigin {
	latitude: number;
	longitude: number;
}

const DEFAULT_CENTER = { lat: 39.5, lng: -98.35 };
const MAP_ID = "DEMO_MAP_ID";

export const Route = createFileRoute("/groups/search")({
	component: SearchGroups,
});

function SearchGroups() {
	const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
	const [zip, setZip] = useState("");
	const [origin, setOrigin] = useState<SearchOrigin | null>(null);
	const [locations, setLocations] = useState<SearchLocation[]>([]);
	const [selectedLocationId, setSelectedLocationId] = useState<string | null>(
		null,
	);
	const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">(
		"idle",
	);
	const [error, setError] = useState<string | null>(null);

	const runSearch = async (query: string) => {
		setStatus("loading");
		setError(null);
		setSelectedLocationId(null);

		try {
			const response = await fetch(`/api/groups/search?${query}`);
			const result = (await response.json()) as {
				error?: string;
				origin?: SearchOrigin;
				locations?: SearchLocation[];
			};

			if (!response.ok || !result.origin || !result.locations) {
				throw new Error(result.error ?? "Could not search for groups");
			}

			setOrigin(result.origin);
			setLocations(result.locations);
			setStatus("ready");
		} catch (searchError) {
			setOrigin(null);
			setLocations([]);
			setStatus("error");
			setError(
				searchError instanceof Error
					? searchError.message
					: "Could not search for groups",
			);
		}
	};

	const useMyLocation = () => {
		if (!navigator.geolocation) {
			setStatus("error");
			setError("This browser cannot share your location. Enter a ZIP code.");
			return;
		}

		setStatus("loading");
		setError(null);
		navigator.geolocation.getCurrentPosition(
			(position) => {
				void runSearch(
					`lat=${position.coords.latitude}&lng=${position.coords.longitude}`,
				);
			},
			() => {
				setStatus("error");
				setError(
					"We could not access your location. Enter a ZIP code to search instead.",
				);
			},
		);
	};

	const handleZipSubmit = (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		if (zip.trim().length === 0) return;
		void runSearch(`zip=${encodeURIComponent(zip.trim())}`);
	};

	return (
		<main className="page-wrap min-h-[calc(100dvh-4rem)] py-10 sm:py-16">
			<div className="mx-auto grid max-w-6xl gap-7">
				<header className="grid gap-3">
					<Badge variant="outline" className="island-kicker w-fit">
						<MapPin />
						Nearby gatherings
					</Badge>
					<h1 className="display-title text-4xl font-semibold sm:text-5xl">
						Find a group
					</h1>
					<p className="max-w-2xl leading-7 text-[var(--sea-ink-soft)]">
						Search the area around you for groups to visit and join.
					</p>
				</header>

				<Card className="island-shell rounded-2xl p-0">
					<CardHeader className="border-b px-6 py-6 sm:px-9">
						<CardTitle role="heading" aria-level={2}>
							Where are you looking?
						</CardTitle>
						<CardDescription>
							Share your location or enter a ZIP code to see groups within 50
							miles.
						</CardDescription>
					</CardHeader>
					<CardContent className="px-6 py-6 sm:px-9">
						<div className="flex flex-col gap-5 sm:flex-row sm:items-end">
							<form
								className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-end"
								onSubmit={handleZipSubmit}
							>
								<div className="grid flex-1 gap-2">
									<Label htmlFor="zip">ZIP code</Label>
									<Input
										id="zip"
										value={zip}
										onChange={(event) => setZip(event.target.value)}
										placeholder="02143"
										inputMode="numeric"
										autoComplete="postal-code"
									/>
								</div>
								<Button type="submit" disabled={status === "loading"}>
									<Search aria-hidden="true" />
									Search
								</Button>
							</form>
							<div className="flex items-center gap-3 sm:flex-col sm:items-center">
								<Separator
									orientation="vertical"
									className="hidden h-10 sm:block"
								/>
								<span className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
									or
								</span>
							</div>
							<Button
								type="button"
								variant="outline"
								disabled={status === "loading"}
								onClick={useMyLocation}
							>
								<LocateFixed aria-hidden="true" />
								Use my location
							</Button>
						</div>
					</CardContent>
				</Card>

				{status === "error" && error && (
					<Alert variant="destructive">
						<CircleAlert />
						<AlertTitle>Search unavailable</AlertTitle>
						<AlertDescription>{error}</AlertDescription>
					</Alert>
				)}

				<Card className="island-shell overflow-hidden rounded-2xl p-0">
					<CardContent className="p-0">
						{apiKey ? (
							<APIProvider apiKey={apiKey}>
								<GroupMap
									origin={origin}
									locations={locations}
									selectedLocationId={selectedLocationId}
									onSelectLocation={setSelectedLocationId}
								/>
							</APIProvider>
						) : (
							<div className="grid gap-2 px-6 py-16 text-center">
								<p className="font-medium">Map unavailable</p>
								<p className="text-sm text-muted-foreground">
									Set VITE_GOOGLE_MAPS_API_KEY to display the map. Nearby groups
									are still listed below.
								</p>
							</div>
						)}
					</CardContent>
				</Card>

				{status === "loading" && (
					<Skeleton className="h-40 w-full rounded-2xl" />
				)}

				{status === "ready" && (
					<Card className="island-shell rounded-2xl p-0">
						<CardHeader className="border-b px-6 py-6 sm:px-9">
							<CardTitle role="heading" aria-level={2}>
								Groups nearby
							</CardTitle>
							<CardDescription>
								{locations.length === 0
									? "No group locations within 50 miles yet."
									: `${locations.length} ${
											locations.length === 1 ? "location" : "locations"
										} within 50 miles`}
							</CardDescription>
						</CardHeader>
						{locations.length > 0 && (
							<CardContent className="px-6 py-2 sm:px-9">
								<ul>
									{locations.map((location, index) => (
										<li key={location.id}>
											{index > 0 && <Separator />}
											<div className="grid gap-2 py-5 sm:flex sm:items-center sm:justify-between sm:gap-6">
												<div className="min-w-0">
													<p className="font-semibold">{location.name}</p>
													<p className="mt-1 text-sm text-muted-foreground">
														{location.label ? `${location.label} · ` : ""}
														{location.address}
													</p>
													<p className="mt-1 text-sm text-muted-foreground">
														{location.distanceMiles} miles away
													</p>
												</div>
												<Button
													type="button"
													variant="outline"
													onClick={() => setSelectedLocationId(location.id)}
												>
													<MapPin aria-hidden="true" />
													Show on map
												</Button>
											</div>
										</li>
									))}
								</ul>
							</CardContent>
						)}
					</Card>
				)}
			</div>
		</main>
	);
}

function GroupMap({
	origin,
	locations,
	selectedLocationId,
	onSelectLocation,
}: {
	origin: SearchOrigin | null;
	locations: SearchLocation[];
	selectedLocationId: string | null;
	onSelectLocation: (locationId: string | null) => void;
}) {
	const map = useMap();
	const selectedLocation =
		locations.find((location) => location.id === selectedLocationId) ?? null;

	useEffect(() => {
		if (!map) return;

		if (!origin) {
			map.setCenter(DEFAULT_CENTER);
			map.setZoom(4);
			return;
		}

		if (locations.length === 0) {
			map.setCenter({ lat: origin.latitude, lng: origin.longitude });
			map.setZoom(10);
			return;
		}

		const bounds = new google.maps.LatLngBounds();
		bounds.extend({ lat: origin.latitude, lng: origin.longitude });
		for (const location of locations) {
			bounds.extend({ lat: location.latitude, lng: location.longitude });
		}
		map.fitBounds(bounds, 64);
	}, [map, origin, locations]);

	return (
		<GoogleMap
			mapId={MAP_ID}
			colorScheme={ColorScheme.FOLLOW_SYSTEM}
			defaultCenter={DEFAULT_CENTER}
			defaultZoom={4}
			gestureHandling="greedy"
			style={{ height: "480px", width: "100%" }}
		>
			{origin && (
				<AdvancedMarker
					position={{ lat: origin.latitude, lng: origin.longitude }}
					title="Your search area"
				>
					<Pin
						background="#1f2937"
						borderColor="#ffffff"
						glyphColor="#ffffff"
						scale={0.9}
					/>
				</AdvancedMarker>
			)}
			{locations.map((location) => (
				<AdvancedMarker
					key={location.id}
					position={{ lat: location.latitude, lng: location.longitude }}
					title={location.label ?? location.name}
					onClick={() => onSelectLocation(location.id)}
				>
					<Pin
						background={
							location.id === selectedLocationId ? "#b0702a" : "#5b3e8c"
						}
						borderColor="#ffffff"
						glyphColor="#ffffff"
					/>
				</AdvancedMarker>
			))}
			{selectedLocation && (
				<InfoWindow
					position={{
						lat: selectedLocation.latitude,
						lng: selectedLocation.longitude,
					}}
					onCloseClick={() => onSelectLocation(null)}
				>
					<div className="grid gap-1 text-[#231b26]">
						<p className="font-semibold">{selectedLocation.name}</p>
						<p className="text-sm text-[#6d6172]">{selectedLocation.address}</p>
						<Link
							to="/groups/$slug"
							params={{ slug: selectedLocation.slug }}
							className="text-sm font-semibold text-[#5b3e8c] underline underline-offset-2"
						>
							View group
						</Link>
					</div>
				</InfoWindow>
			)}
		</GoogleMap>
	);
}
