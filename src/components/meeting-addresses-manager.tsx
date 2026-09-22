import { MapPin, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import {
	MeetingAddressMapPicker,
	type PickedAddress,
} from "#/components/meeting-address-map-picker";
import {
	emptyMeetingAddress,
	type MeetingAddressDraft,
} from "#/components/meeting-addresses-editor";
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
import { formatMeetingAddress } from "#/lib/workspace-addresses";

type AddressField = Exclude<keyof MeetingAddressDraft, "id">;

const addressFields: {
	field: AddressField;
	label: string;
	placeholder: string;
	required?: boolean;
	maxLength: number;
	className?: string;
}[] = [
	{
		field: "label",
		label: "Location name",
		placeholder: "e.g. Cedar Street Hall",
		maxLength: 80,
	},
	{
		field: "street",
		label: "Street address",
		placeholder: "123 Cedar Street",
		required: true,
		maxLength: 200,
	},
	{
		field: "locality",
		label: "Meeting city",
		placeholder: "Somerville",
		required: true,
		maxLength: 100,
	},
	{
		field: "region",
		label: "Meeting region",
		placeholder: "Massachusetts",
		maxLength: 100,
	},
	{
		field: "postalCode",
		label: "Postal code",
		placeholder: "02143",
		maxLength: 20,
	},
	{
		field: "countryCode",
		label: "Address country",
		placeholder: "US",
		required: true,
		maxLength: 2,
		className: "max-w-24",
	},
];

interface EditingAddress {
	index: number;
	isNew: boolean;
	draft: MeetingAddressDraft;
}

export function MeetingAddressesManager({
	value,
	onChange,
	idPrefix,
}: {
	value: MeetingAddressDraft[];
	onChange: (value: MeetingAddressDraft[]) => void;
	idPrefix: string;
}) {
	const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
	const [editing, setEditing] = useState<EditingAddress | null>(null);
	const [isPickerOpen, setIsPickerOpen] = useState(false);

	const startAdd = () => {
		const previous = value[value.length - 1];
		setEditing({
			index: value.length,
			isNew: true,
			draft: emptyMeetingAddress({
				locality: previous?.locality ?? "",
				region: previous?.region ?? "",
				countryCode: previous?.countryCode ?? "",
			}),
		});
	};

	const startEdit = (index: number) => {
		setEditing({ index, isNew: false, draft: { ...value[index] } });
	};

	const closeEditor = () => {
		setEditing(null);
		setIsPickerOpen(false);
	};

	const updateDraft = (field: AddressField, next: string) => {
		setEditing((current) =>
			current
				? { ...current, draft: { ...current.draft, [field]: next } }
				: current,
		);
	};

	const applyPickedAddress = (picked: PickedAddress) => {
		setEditing((current) =>
			current
				? {
						...current,
						draft: {
							...current.draft,
							street: picked.street,
							locality: picked.locality,
							region: picked.region,
							postalCode: picked.postalCode,
							countryCode: picked.countryCode,
						},
					}
				: current,
		);
	};

	const saveEditor = () => {
		if (!editing) return;
		const next = [...value];
		next[editing.index] = editing.draft;
		onChange(next);
		closeEditor();
	};

	const removeAt = (index: number) => {
		onChange(value.filter((_, position) => position !== index));
	};

	return (
		<div className="grid gap-4">
			{value.length === 0 ? (
				<p className="rounded-xl border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">
					Add the first place this group meets to get started.
				</p>
			) : (
				<ul className="grid gap-3">
					{value.map((address, index) => (
						<li
							key={address.id}
							className="flex flex-wrap items-start justify-between gap-4 rounded-xl border bg-[var(--surface-strong)] p-4 sm:p-5"
						>
							<div className="flex min-w-0 items-start gap-3">
								<MapPin
									className="mt-0.5 size-4 shrink-0 text-muted-foreground"
									aria-hidden="true"
								/>
								<div className="min-w-0">
									<p className="font-medium">
										{address.label || `Meeting address ${index + 1}`}
									</p>
									<p className="text-sm text-muted-foreground">
										{formatMeetingAddress(address)}
									</p>
								</div>
							</div>
							<div className="flex shrink-0 items-center gap-1">
								<Button
									type="button"
									variant="ghost"
									size="sm"
									onClick={() => startEdit(index)}
								>
									<Pencil aria-hidden="true" />
									Edit
								</Button>
								<Button
									type="button"
									variant="ghost"
									size="icon"
									disabled={value.length === 1}
									onClick={() => removeAt(index)}
									aria-label={`Remove meeting address ${index + 1}`}
								>
									<Trash2 aria-hidden="true" />
								</Button>
							</div>
						</li>
					))}
				</ul>
			)}
			<div>
				<Button
					type="button"
					variant="outline"
					size="sm"
					onClick={startAdd}
					className="w-full sm:w-fit"
				>
					<Plus aria-hidden="true" />
					{value.length === 0
						? "Add a meeting address"
						: "Add another meeting address"}
				</Button>
				<p className="mt-2 text-xs text-muted-foreground">
					Groups meet in at least one place. Add every address where this group
					gathers. If this group only meets virtually, add an address for the
					city the group is based out of.
				</p>
			</div>
			<Dialog
				open={editing !== null}
				onOpenChange={(open) => {
					if (!open) closeEditor();
				}}
			>
				<DialogContent className="max-w-xl">
					{editing && (
						<>
							<DialogHeader>
								<DialogTitle>
									{editing.isNew
										? "Add a meeting location"
										: "Edit meeting location"}
								</DialogTitle>
								<DialogDescription>
									Share the details of this place, from the street address to
									the country, so people can find their way there.
								</DialogDescription>
							</DialogHeader>
							<form
								className="grid gap-4"
								onSubmit={(event) => {
									event.preventDefault();
									event.stopPropagation();
									saveEditor();
								}}
							>
								{apiKey && (
									<Button
										type="button"
										variant="outline"
										size="sm"
										className="w-fit"
										onClick={() => setIsPickerOpen(true)}
									>
										<MapPin aria-hidden="true" />
										Find on map
									</Button>
								)}
								{addressFields.map((field) => (
									<div
										key={field.field}
										className={`grid gap-2 ${field.className ?? ""}`}
									>
										<Label
											htmlFor={`${idPrefix}-address-${editing.index}-${field.field}`}
										>
											{field.label}
										</Label>
										<Input
											id={`${idPrefix}-address-${editing.index}-${field.field}`}
											value={editing.draft[field.field]}
											onChange={(event) =>
												updateDraft(
													field.field,
													field.field === "countryCode"
														? event.target.value.toUpperCase()
														: event.target.value,
												)
											}
											placeholder={field.placeholder}
											maxLength={field.maxLength}
											required={field.required}
										/>
									</div>
								))}
								<DialogFooter>
									<Button type="button" variant="outline" onClick={closeEditor}>
										Cancel
									</Button>
									<Button type="submit">
										{editing.isNew ? "Add location" : "Save location"}
									</Button>
								</DialogFooter>
							</form>
						</>
					)}
				</DialogContent>
			</Dialog>
			{apiKey && editing && (
				<MeetingAddressMapPicker
					apiKey={apiKey}
					open={isPickerOpen}
					onOpenChange={setIsPickerOpen}
					onConfirm={(picked) => {
						applyPickedAddress(picked);
						setIsPickerOpen(false);
					}}
				/>
			)}
		</div>
	);
}
