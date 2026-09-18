import { z } from "zod";

export const meetingAddressInput = z.object({
	label: z.string().trim().max(80).optional(),
	street: z.string().trim().min(3).max(200),
	locality: z.string().trim().min(1).max(100),
	region: z.string().trim().max(100).optional(),
	postalCode: z.string().trim().max(20).optional(),
	countryCode: z.string().trim().length(2).toUpperCase(),
});

export type MeetingAddressInput = z.infer<typeof meetingAddressInput>;

export interface MeetingAddress extends MeetingAddressInput {
	id: string;
}

export interface StoredMeetingAddress {
	id: string;
	label: string | null;
	street: string;
	locality: string;
	region: string | null;
	postalCode: string | null;
	countryCode: string;
}

export function formatMeetingAddress(address: {
	street: string;
	locality: string;
	region: string | null;
	postalCode: string | null;
	countryCode: string;
}) {
	const cityLine = [
		address.locality,
		address.region,
		address.postalCode,
		address.countryCode,
	]
		.filter(Boolean)
		.join(", ");
	return [address.street, cityLine].filter(Boolean).join(", ");
}
