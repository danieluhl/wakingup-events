import { z } from "zod";

export const MEETING_TYPE_TITLE_MAX = 120;
export const MEETING_TYPE_DESCRIPTION_MAX = 2000;
export const MEETING_TYPE_ALERT_MAX = 500;
export const MEETING_TYPE_INSTRUCTIONS_MAX = 10000;

export const meetingTypeInput = z.object({
	title: z.string().trim().min(2).max(MEETING_TYPE_TITLE_MAX),
	description: z.string().trim().max(MEETING_TYPE_DESCRIPTION_MAX).optional(),
	alert: z.string().trim().max(MEETING_TYPE_ALERT_MAX).optional(),
	instructions: z.string().trim().max(MEETING_TYPE_INSTRUCTIONS_MAX).optional(),
});

export type MeetingTypeInput = z.infer<typeof meetingTypeInput>;

export const meetingTypeUpdateInput = meetingTypeInput.extend({
	id: z.string().min(1),
});

export type MeetingTypeUpdateInput = z.infer<typeof meetingTypeUpdateInput>;

export interface StoredMeetingTypeRow {
	id: string;
	title: string;
	description: string | null;
	alert: string | null;
	instructions: string | null;
	sortOrder: number;
}

export interface MeetingTypeRecord {
	id: string;
	title: string;
	description: string | null;
	alert: string | null;
	instructions: string | null;
	sortOrder: number;
}

export function meetingTypeToRecord(
	row: StoredMeetingTypeRow,
): MeetingTypeRecord {
	return {
		id: row.id,
		title: row.title,
		description: row.description,
		alert: row.alert,
		instructions: row.instructions,
		sortOrder: row.sortOrder,
	};
}
