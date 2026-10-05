import { ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "#/components/ui/button";
import {
	formatEventTime,
	getZonedDateParts,
	type WorkspaceEvent,
	zonedDateKey,
} from "#/lib/events";
import { cn } from "#/lib/utils";

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MAX_VISIBLE_EVENTS = 3;

interface EventCalendarProps {
	events: WorkspaceEvent[];
	timeZone: string;
	onSelectEvent: (event: WorkspaceEvent) => void;
}

interface CalendarCell {
	key: string;
	dayNumber: number;
	isCurrentMonth: boolean;
	isToday: boolean;
	events: WorkspaceEvent[];
}

function buildMonthCells(
	year: number,
	month: number,
	eventsByDay: Map<string, WorkspaceEvent[]>,
	todayKey: string,
) {
	const firstWeekday = new Date(Date.UTC(year, month, 1)).getUTCDay();
	const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
	const totalCells = Math.ceil((firstWeekday + daysInMonth) / 7) * 7;

	const cells: CalendarCell[] = [];
	for (let index = 0; index < totalCells; index += 1) {
		const date = new Date(Date.UTC(year, month, index - firstWeekday + 1));
		const cellYear = date.getUTCFullYear();
		const cellMonth = date.getUTCMonth();
		const dayNumber = date.getUTCDate();
		const key = `${cellYear}-${String(cellMonth + 1).padStart(2, "0")}-${String(
			dayNumber,
		).padStart(2, "0")}`;
		const isCurrentMonth = cellYear === year && cellMonth === month;
		cells.push({
			key,
			dayNumber,
			isCurrentMonth,
			isToday: key === todayKey,
			events: isCurrentMonth ? (eventsByDay.get(key) ?? []) : [],
		});
	}

	return cells;
}

export function EventCalendar({
	events,
	timeZone,
	onSelectEvent,
}: EventCalendarProps) {
	const [view, setView] = useState(() => {
		const parts = getZonedDateParts(new Date(), timeZone);
		return { year: parts.year, month: parts.month };
	});

	const eventsByDay = useMemo(() => {
		const grouped = new Map<string, WorkspaceEvent[]>();
		for (const event of events) {
			const key = zonedDateKey(new Date(event.startsAt), timeZone);
			const existing = grouped.get(key);
			if (existing) {
				existing.push(event);
			} else {
				grouped.set(key, [event]);
			}
		}
		return grouped;
	}, [events, timeZone]);

	const todayKey = zonedDateKey(new Date(), timeZone);
	const cells = buildMonthCells(view.year, view.month, eventsByDay, todayKey);
	const monthLabel = new Intl.DateTimeFormat("en-US", {
		timeZone: "UTC",
		month: "long",
		year: "numeric",
	}).format(new Date(Date.UTC(view.year, view.month, 1)));

	const shiftMonth = (amount: number) => {
		setView((current) => {
			const next = new Date(Date.UTC(current.year, current.month + amount, 1));
			return { year: next.getUTCFullYear(), month: next.getUTCMonth() };
		});
	};

	const goToToday = () => {
		const parts = getZonedDateParts(new Date(), timeZone);
		setView({ year: parts.year, month: parts.month });
	};

	return (
		<div className="grid gap-4">
			<div className="flex flex-wrap items-center justify-between gap-3">
				<p className="text-lg font-semibold" aria-live="polite">
					{monthLabel}
				</p>
				<div className="flex items-center gap-2">
					<Button
						type="button"
						variant="ghost"
						size="icon"
						onClick={() => shiftMonth(-1)}
						aria-label="Previous month"
					>
						<ChevronLeft aria-hidden="true" />
					</Button>
					<Button type="button" variant="outline" size="sm" onClick={goToToday}>
						Today
					</Button>
					<Button
						type="button"
						variant="ghost"
						size="icon"
						onClick={() => shiftMonth(1)}
						aria-label="Next month"
					>
						<ChevronRight aria-hidden="true" />
					</Button>
				</div>
			</div>
			<div className="grid grid-cols-7 border-t border-l">
				{WEEKDAY_LABELS.map((label) => (
					<div
						key={label}
						className="border-r border-b bg-muted/40 px-1 py-2 text-center text-xs font-medium text-muted-foreground"
					>
						{label}
					</div>
				))}
				{cells.map((cell) => (
					<div
						key={cell.key}
						className={cn(
							"min-h-24 border-r border-b p-1.5 align-top sm:min-h-28 sm:p-2",
							!cell.isCurrentMonth && "bg-muted/20",
						)}
					>
						<div className="mb-1 flex justify-end">
							<span
								className={cn(
									"flex size-6 items-center justify-center text-xs text-muted-foreground",
									cell.isToday &&
										"iris-ring rounded-full font-semibold text-foreground",
								)}
							>
								{cell.dayNumber}
							</span>
						</div>
						<div className="grid gap-1">
							{cell.events.slice(0, MAX_VISIBLE_EVENTS).map((event) => (
								<button
									key={event.id}
									type="button"
									onClick={() => onSelectEvent(event)}
									title={event.title}
									className="w-full truncate rounded border border-transparent bg-[color-mix(in_oklab,var(--lagoon)_18%,transparent)] px-1.5 py-1 text-left text-xs leading-4 hover:border-[var(--lagoon)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--lagoon)]"
								>
									<span className="font-medium">
										{formatEventTime(event.startsAt, timeZone)}
									</span>{" "}
									{event.title}
								</button>
							))}
							{cell.events.length > MAX_VISIBLE_EVENTS && (
								<p className="px-1.5 text-xs text-muted-foreground">
									+{cell.events.length - MAX_VISIBLE_EVENTS} more
								</p>
							)}
						</div>
					</div>
				))}
			</div>
			<p className="text-xs text-muted-foreground">
				Times are shown in {timeZone}. Choose an event to add it to your own
				calendar.
			</p>
		</div>
	);
}
