import {
	AdvancedMarker,
	APIProvider,
	ColorScheme,
	Map as GoogleMap,
	Pin,
	useMap,
	useMapsLibrary,
} from "@vis.gl/react-google-maps";
import { MapPin } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "#/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "#/components/ui/dialog";
import { Skeleton } from "#/components/ui/skeleton";

export interface PickedAddress {
	street: string;
	locality: string;
	region: string;
	postalCode: string;
	countryCode: string;
	formattedAddress: string;
	latitude: number;
	longitude: number;
}

const DEFAULT_CENTER = { lat: 39.5, lng: -98.35 };
const DEFAULT_ZOOM = 4;
const SELECTED_ZOOM = 16;
const MAP_ID = "DEMO_MAP_ID";

function readComponent(
	components: google.maps.places.AddressComponent[],
	type: string,
	useShortText = false,
) {
	const match = components.find((component) => component.types.includes(type));
	if (!match) return "";
	const value = useShortText ? match.shortText : match.longText;
	return (value ?? match.longText ?? match.shortText ?? "").trim();
}

function toPickedAddress(
	place: google.maps.places.Place,
): PickedAddress | null {
	const components = place.addressComponents;
	const location = place.location;
	if (!components || !location) return null;

	const street = [
		readComponent(components, "street_number"),
		readComponent(components, "route"),
	]
		.filter(Boolean)
		.join(" ");

	const locality =
		readComponent(components, "locality") ||
		readComponent(components, "postal_town") ||
		readComponent(components, "sublocality") ||
		readComponent(components, "sublocality_level_1") ||
		readComponent(components, "administrative_area_level_2");

	return {
		street,
		locality,
		region: readComponent(components, "administrative_area_level_1"),
		postalCode: readComponent(components, "postal_code"),
		countryCode: readComponent(components, "country", true).toUpperCase(),
		formattedAddress: place.formattedAddress ?? "",
		latitude: location.lat(),
		longitude: location.lng(),
	};
}

function PickerMap({ picked }: { picked: PickedAddress | null }) {
	const map = useMap();

	useEffect(() => {
		if (!map || !picked) return;
		map.setCenter({ lat: picked.latitude, lng: picked.longitude });
		map.setZoom(SELECTED_ZOOM);
	}, [map, picked]);

	return (
		<GoogleMap
			mapId={MAP_ID}
			colorScheme={ColorScheme.FOLLOW_SYSTEM}
			defaultCenter={DEFAULT_CENTER}
			defaultZoom={DEFAULT_ZOOM}
			gestureHandling="greedy"
			style={{ height: "320px", width: "100%" }}
		>
			{picked && (
				<AdvancedMarker
					position={{ lat: picked.latitude, lng: picked.longitude }}
				>
					<Pin
						background="#5b3e8c"
						borderColor="#ffffff"
						glyphColor="#ffffff"
					/>
				</AdvancedMarker>
			)}
		</GoogleMap>
	);
}

function MapPicker({
	onConfirm,
	onCancel,
}: {
	onConfirm: (picked: PickedAddress) => void;
	onCancel: () => void;
}) {
	const places = useMapsLibrary("places");
	const searchRef = useRef<HTMLDivElement>(null);
	const [picked, setPicked] = useState<PickedAddress | null>(null);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const container = searchRef.current;
		if (!places || !container) return;

		const element = new places.PlaceAutocompleteElement({
			placeholder: "Search for the meeting location",
		});
		element.style.width = "100%";

		const handleSelect = async (
			event: google.maps.places.PlacePredictionSelectEvent,
		) => {
			setError(null);
			try {
				const place = event.placePrediction.toPlace();
				await place.fetchFields({
					fields: ["addressComponents", "formattedAddress", "location"],
				});
				const next = toPickedAddress(place);
				if (!next) {
					setError("That place does not include a usable address.");
					return;
				}
				setPicked(next);
			} catch {
				setError("Could not load that place. Try another result.");
			}
		};

		const handleError = () => {
			setError("Address search is unavailable right now.");
		};

		element.addEventListener("gmp-select", handleSelect);
		element.addEventListener("gmp-error", handleError);
		container.replaceChildren(element);

		return () => {
			element.removeEventListener("gmp-select", handleSelect);
			element.removeEventListener("gmp-error", handleError);
			element.remove();
		};
	}, [places]);

	return (
		<>
			<div className="grid gap-3">
				{places ? (
					<div ref={searchRef} />
				) : (
					<Skeleton className="h-11 w-full rounded-md" />
				)}
				{error && <p className="text-destructive text-sm">{error}</p>}
				<div className="overflow-hidden rounded-lg border">
					<PickerMap picked={picked} />
				</div>
				{picked && (
					<div className="grid gap-1 rounded-lg border bg-[var(--surface-strong)] p-3 text-sm">
						<p className="font-medium">{picked.formattedAddress}</p>
						<p className="text-muted-foreground">
							{[
								picked.street,
								picked.locality,
								picked.region,
								picked.postalCode,
								picked.countryCode,
							]
								.filter(Boolean)
								.join(", ")}
						</p>
					</div>
				)}
			</div>
			<DialogFooter>
				<Button type="button" variant="outline" onClick={onCancel}>
					Cancel
				</Button>
				<Button
					type="button"
					disabled={!picked}
					onClick={() => picked && onConfirm(picked)}
				>
					<MapPin aria-hidden="true" />
					Use this address
				</Button>
			</DialogFooter>
		</>
	);
}

export function MeetingAddressMapPicker({
	apiKey,
	open,
	onOpenChange,
	onConfirm,
}: {
	apiKey: string;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onConfirm: (picked: PickedAddress) => void;
}) {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent
				className="max-w-2xl"
				onOpenAutoFocus={(event) => event.preventDefault()}
			>
				<DialogHeader>
					<DialogTitle>Find the meeting location</DialogTitle>
					<DialogDescription>
						Search for a place, then confirm to fill in the address fields.
					</DialogDescription>
				</DialogHeader>
				{open && (
					<APIProvider apiKey={apiKey}>
						<MapPicker
							onConfirm={onConfirm}
							onCancel={() => onOpenChange(false)}
						/>
					</APIProvider>
				)}
			</DialogContent>
		</Dialog>
	);
}
