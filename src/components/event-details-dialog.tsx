import {
	CalendarDays,
	CalendarPlus,
	Clock,
	Download,
	MapPin,
	Tag,
	UserRound,
} from "lucide-react";
import { Button, buttonVariants } from "#/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "#/components/ui/dialog";
import {
	buildGoogleCalendarUrl,
	downloadEventIcs,
	formatEventDateTime,
	formatEventDuration,
	type WorkspaceEvent,
} from "#/lib/events";

interface EventDetailsDialogProps {
	event: WorkspaceEvent | null;
	workspaceName: string;
	timeZone: string;
	onOpenChange: (open: boolean) => void;
}

export function EventDetailsDialog({
	event,
	workspaceName,
	timeZone,
	onOpenChange,
}: EventDetailsDialogProps) {
	return (
		<Dialog open={event !== null} onOpenChange={onOpenChange}>
			{event && (
				<DialogContent>
					<DialogHeader>
						<DialogTitle>{event.title}</DialogTitle>
						<DialogDescription className="grid gap-2 pt-1">
							<span className="flex items-center gap-2">
								<CalendarDays className="size-4 shrink-0" aria-hidden="true" />
								{formatEventDateTime(event.startsAt, timeZone)}
							</span>
							<span className="flex items-center gap-2">
								<Clock className="size-4 shrink-0" aria-hidden="true" />
								{formatEventDuration(event.durationMinutes)}
							</span>
							<span className="flex items-center gap-2">
								<MapPin className="size-4 shrink-0" aria-hidden="true" />
								{event.location}
							</span>
							<span className="flex items-center gap-2">
								<UserRound className="size-4 shrink-0" aria-hidden="true" />
								{event.organizerName}
							</span>
							{event.meetingTypeTitle && (
								<span className="flex items-center gap-2">
									<Tag className="size-4 shrink-0" aria-hidden="true" />
									{event.meetingTypeTitle}
								</span>
							)}
						</DialogDescription>
					</DialogHeader>
					<div className="flex flex-wrap gap-3">
						<a
							href={buildGoogleCalendarUrl(event, workspaceName)}
							target="_blank"
							rel="noreferrer"
							className={buttonVariants()}
						>
							<CalendarPlus aria-hidden="true" />
							Add to Google Calendar
						</a>
						<Button
							type="button"
							variant="outline"
							onClick={() => downloadEventIcs(event, workspaceName)}
						>
							<Download aria-hidden="true" />
							Download .ics
						</Button>
					</div>
					<p className="text-xs text-muted-foreground">
						The .ics file works with Apple Calendar, Outlook, and other calendar
						apps. The event is hosted by {event.organizerName} for{" "}
						{workspaceName}.
					</p>
				</DialogContent>
			)}
		</Dialog>
	);
}
