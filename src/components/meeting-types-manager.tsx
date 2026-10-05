import { Pencil, Plus, Trash2, TriangleAlert } from "lucide-react";
import { type FormEvent, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "#/components/ui/alert";
import { Button } from "#/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "#/components/ui/dialog";
import { Input } from "#/components/ui/input";
import { Label } from "#/components/ui/label";
import { Textarea } from "#/components/ui/textarea";
import {
	MEETING_TYPE_ALERT_MAX,
	MEETING_TYPE_DESCRIPTION_MAX,
	MEETING_TYPE_INSTRUCTIONS_MAX,
	MEETING_TYPE_TITLE_MAX,
	type MeetingTypeRecord,
} from "#/lib/meeting-types";

interface MeetingTypeDraft {
	id: string;
	isNew: boolean;
	title: string;
	description: string;
	alert: string;
	instructions: string;
}

function sortMeetingTypes(meetingTypes: MeetingTypeRecord[]) {
	return [...meetingTypes].sort(
		(a, b) => a.sortOrder - b.sortOrder || a.title.localeCompare(b.title),
	);
}

export function MeetingTypesManager({
	slug,
	value,
	onChange,
	canEdit,
	idPrefix,
}: {
	slug: string;
	value: MeetingTypeRecord[];
	onChange: (value: MeetingTypeRecord[]) => void;
	canEdit: boolean;
	idPrefix: string;
}) {
	const [editing, setEditing] = useState<MeetingTypeDraft | null>(null);
	const [pendingDelete, setPendingDelete] = useState<MeetingTypeRecord | null>(
		null,
	);
	const [isSaving, setIsSaving] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const startAdd = () => {
		setError(null);
		setEditing({
			id: crypto.randomUUID(),
			isNew: true,
			title: "",
			description: "",
			alert: "",
			instructions: "",
		});
	};

	const startEdit = (meetingType: MeetingTypeRecord) => {
		setError(null);
		setEditing({
			id: meetingType.id,
			isNew: false,
			title: meetingType.title,
			description: meetingType.description ?? "",
			alert: meetingType.alert ?? "",
			instructions: meetingType.instructions ?? "",
		});
	};

	const closeEditor = () => {
		setEditing(null);
		setError(null);
	};

	const saveEditor = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		if (!editing) return;

		setError(null);

		if (editing.title.trim().length < 2) {
			setError("Give this meeting type a name");
			return;
		}

		setIsSaving(true);

		try {
			const response = await fetch(
				`/api/meeting-types?slug=${encodeURIComponent(slug)}`,
				{
					method: editing.isNew ? "POST" : "PATCH",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						...(editing.isNew ? {} : { id: editing.id }),
						title: editing.title,
						description: editing.description,
						alert: editing.alert,
						instructions: editing.instructions,
					}),
				},
			);
			const result = (await response.json()) as {
				error?: string;
				meetingType?: MeetingTypeRecord;
			};

			if (!response.ok || !result.meetingType) {
				throw new Error(result.error ?? "Could not save the meeting type");
			}

			const next = editing.isNew
				? [...value, result.meetingType]
				: value.map((meetingType) =>
						meetingType.id === result.meetingType?.id
							? (result.meetingType as MeetingTypeRecord)
							: meetingType,
					);
			onChange(sortMeetingTypes(next));
			closeEditor();
		} catch (saveError) {
			setError(
				saveError instanceof Error
					? saveError.message
					: "Could not save the meeting type",
			);
		} finally {
			setIsSaving(false);
		}
	};

	const removeMeetingType = async (meetingType: MeetingTypeRecord) => {
		setIsDeleting(true);
		setError(null);

		try {
			const response = await fetch(
				`/api/meeting-types?slug=${encodeURIComponent(slug)}&id=${encodeURIComponent(meetingType.id)}`,
				{ method: "DELETE" },
			);

			if (!response.ok) {
				const result = (await response.json()) as { error?: string };
				throw new Error(result.error ?? "Could not remove the meeting type");
			}

			onChange(value.filter((type) => type.id !== meetingType.id));
			setPendingDelete(null);
		} catch (deleteError) {
			setError(
				deleteError instanceof Error
					? deleteError.message
					: "Could not remove the meeting type",
			);
		} finally {
			setIsDeleting(false);
		}
	};

	return (
		<div className="grid gap-4">
			{value.length === 0 ? (
				<p className="rounded-xl border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">
					{canEdit
						? "Add a meeting type so organizers know how each kind of gathering is held."
						: "This group has not described any meeting types yet."}
				</p>
			) : (
				<ul className="grid gap-3">
					{value.map((meetingType) => (
						<li
							key={meetingType.id}
							className="grid gap-3 rounded-xl border bg-[var(--surface-strong)] p-4 sm:p-5"
						>
							<div className="flex flex-wrap items-start justify-between gap-3">
								<div className="min-w-0">
									<p className="font-medium">{meetingType.title}</p>
									{meetingType.description && (
										<p className="mt-1 text-sm leading-6 text-muted-foreground">
											{meetingType.description}
										</p>
									)}
								</div>
								{canEdit && (
									<div className="flex shrink-0 items-center gap-1">
										<Button
											type="button"
											variant="ghost"
											size="sm"
											onClick={() => startEdit(meetingType)}
										>
											<Pencil aria-hidden="true" />
											Edit
										</Button>
										<Button
											type="button"
											variant="ghost"
											size="icon"
											onClick={() => {
												setError(null);
												setPendingDelete(meetingType);
											}}
											aria-label={`Remove ${meetingType.title}`}
										>
											<Trash2 aria-hidden="true" />
										</Button>
									</div>
								)}
							</div>
							{meetingType.alert && (
								<Alert>
									<TriangleAlert aria-hidden="true" />
									<AlertTitle>Heads up</AlertTitle>
									<AlertDescription className="whitespace-pre-line">
										{meetingType.alert}
									</AlertDescription>
								</Alert>
							)}
							{meetingType.instructions && (
								<div className="rounded-lg border border-dashed bg-background/60 p-3">
									<p className="mb-1 text-xs font-medium tracking-wide text-muted-foreground uppercase">
										Setup instructions
									</p>
									<p className="text-sm leading-6 whitespace-pre-line">
										{meetingType.instructions}
									</p>
								</div>
							)}
						</li>
					))}
				</ul>
			)}
			{canEdit && (
				<div>
					<Button
						type="button"
						variant="outline"
						size="sm"
						onClick={startAdd}
						className="w-full sm:w-fit"
					>
						<Plus aria-hidden="true" />
						{value.length === 0 ? "Add a meeting type" : "Add another type"}
					</Button>
					<p className="mt-2 text-xs text-muted-foreground">
						Meeting types describe the kinds of gatherings this group offers and
						how to hold each one. They appear when someone adds a new event.
					</p>
				</div>
			)}

			<Dialog
				open={editing !== null}
				onOpenChange={(open) => {
					if (!open) closeEditor();
				}}
			>
				<DialogContent className="max-h-[90dvh] max-w-3xl overflow-y-auto">
					{editing && (
						<>
							<DialogHeader>
								<DialogTitle>
									{editing.isNew ? "Add a meeting type" : "Edit meeting type"}
								</DialogTitle>
								<DialogDescription>
									Name a kind of gathering this group offers, then add anything
									an organizer should know about holding it.
								</DialogDescription>
							</DialogHeader>
							<form className="grid gap-4" onSubmit={saveEditor}>
								<div className="grid gap-2">
									<Label htmlFor={`${idPrefix}-meeting-type-title`}>
										Type name
									</Label>
									<Input
										id={`${idPrefix}-meeting-type-title`}
										value={editing.title}
										onChange={(event) =>
											setEditing({ ...editing, title: event.target.value })
										}
										placeholder="e.g. Weekday morning sitting"
										minLength={2}
										maxLength={MEETING_TYPE_TITLE_MAX}
										required
									/>
								</div>
								<div className="grid gap-2">
									<Label htmlFor={`${idPrefix}-meeting-type-description`}>
										Description
									</Label>
									<Textarea
										id={`${idPrefix}-meeting-type-description`}
										value={editing.description}
										onChange={(event) =>
											setEditing({
												...editing,
												description: event.target.value,
											})
										}
										rows={3}
										maxLength={MEETING_TYPE_DESCRIPTION_MAX}
										placeholder="What this gathering is, and who it is for."
									/>
								</div>
								<div className="grid gap-2">
									<Label htmlFor={`${idPrefix}-meeting-type-alert`}>
										Alert
									</Label>
									<Textarea
										id={`${idPrefix}-meeting-type-alert`}
										value={editing.alert}
										onChange={(event) =>
											setEditing({ ...editing, alert: event.target.value })
										}
										rows={2}
										maxLength={MEETING_TYPE_ALERT_MAX}
										placeholder="Anything an organizer must not miss."
									/>
									<p className="text-xs text-muted-foreground">
										Optional. Shown apart from the rest so it stands out.
									</p>
								</div>
								<div className="grid gap-2">
									<Label htmlFor={`${idPrefix}-meeting-type-instructions`}>
										Setup instructions
									</Label>
									<Textarea
										id={`${idPrefix}-meeting-type-instructions`}
										value={editing.instructions}
										onChange={(event) =>
											setEditing({
												...editing,
												instructions: event.target.value,
											})
										}
										rows={18}
										className="min-h-[22rem] w-full"
										maxLength={MEETING_TYPE_INSTRUCTIONS_MAX}
										placeholder="Walk through how to set up and hold this gathering. Write as much as you need."
									/>
								</div>
								{error && (
									<Alert variant="destructive">
										<AlertDescription>{error}</AlertDescription>
									</Alert>
								)}
								<DialogFooter>
									<Button
										type="button"
										variant="outline"
										onClick={closeEditor}
										disabled={isSaving}
									>
										Cancel
									</Button>
									<Button type="submit" disabled={isSaving}>
										{isSaving
											? "Saving..."
											: editing.isNew
												? "Add meeting type"
												: "Save meeting type"}
									</Button>
								</DialogFooter>
							</form>
						</>
					)}
				</DialogContent>
			</Dialog>

			<Dialog
				open={pendingDelete !== null}
				onOpenChange={(open) => {
					if (!open && !isDeleting) setPendingDelete(null);
				}}
			>
				<DialogContent className="max-w-md">
					{pendingDelete && (
						<>
							<DialogHeader>
								<DialogTitle>Remove this meeting type?</DialogTitle>
								<DialogDescription>
									{pendingDelete.title} will be removed from this group. Events
									already created keep their own details.
								</DialogDescription>
							</DialogHeader>
							{error && (
								<Alert variant="destructive">
									<AlertDescription>{error}</AlertDescription>
								</Alert>
							)}
							<DialogFooter>
								<Button
									type="button"
									variant="outline"
									onClick={() => setPendingDelete(null)}
									disabled={isDeleting}
								>
									Cancel
								</Button>
								<Button
									type="button"
									variant="destructive"
									onClick={() => void removeMeetingType(pendingDelete)}
									disabled={isDeleting}
								>
									<Trash2 aria-hidden="true" />
									{isDeleting ? "Removing..." : "Remove"}
								</Button>
							</DialogFooter>
						</>
					)}
				</DialogContent>
			</Dialog>
		</div>
	);
}
