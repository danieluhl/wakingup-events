import { CircleMinus, Plus } from "lucide-react";
import { Button } from "#/components/ui/button";
import { Input } from "#/components/ui/input";
import { Label } from "#/components/ui/label";
import type { StoredMeetingAddress } from "#/lib/workspace-addresses";

export interface MeetingAddressDraft {
	id: string;
	label: string;
	street: string;
	locality: string;
	region: string;
	postalCode: string;
	countryCode: string;
}

export function emptyMeetingAddress(
	overrides?: Partial<Omit<MeetingAddressDraft, "id">>,
): MeetingAddressDraft {
	return {
		id: crypto.randomUUID(),
		label: "",
		street: "",
		locality: "",
		region: "",
		postalCode: "",
		countryCode: "",
		...overrides,
	};
}

export function meetingAddressesToDrafts(
	addresses: StoredMeetingAddress[],
): MeetingAddressDraft[] {
	const drafts = addresses.map((address) =>
		emptyMeetingAddress({
			label: address.label ?? "",
			street: address.street,
			locality: address.locality,
			region: address.region ?? "",
			postalCode: address.postalCode ?? "",
			countryCode: address.countryCode,
		}),
	);
	return drafts.length > 0 ? drafts : [emptyMeetingAddress()];
}

type AddressField = Exclude<keyof MeetingAddressDraft, "id">;

const fieldDefinitions: {
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

export function MeetingAddressesEditor({
	value,
	onChange,
	idPrefix,
}: {
	value: MeetingAddressDraft[];
	onChange: (value: MeetingAddressDraft[]) => void;
	idPrefix: string;
}) {
	const updateField = (index: number, field: AddressField, next: string) => {
		onChange(
			value.map((address, position) =>
				position === index ? { ...address, [field]: next } : address,
			),
		);
	};

	const addAddress = () => {
		const previous = value[value.length - 1];
		onChange([
			...value,
			emptyMeetingAddress({
				locality: previous?.locality ?? "",
				region: previous?.region ?? "",
				countryCode: previous?.countryCode ?? "",
			}),
		]);
	};

	const removeAddress = (index: number) => {
		onChange(value.filter((_, position) => position !== index));
	};

	return (
		<div className="grid gap-4">
			{value.map((address, index) => (
				<fieldset
					key={address.id}
					className="grid gap-4 rounded-xl border bg-[var(--surface-strong)] p-4 sm:p-5"
				>
					<div className="flex items-center justify-between gap-3">
						<legend className="float-left text-sm font-medium">
							Meeting address {index + 1}
						</legend>
						<Button
							type="button"
							variant="ghost"
							size="sm"
							className="text-muted-foreground"
							disabled={value.length === 1}
							onClick={() => removeAddress(index)}
							aria-label={`Remove meeting address ${index + 1}`}
						>
							<CircleMinus aria-hidden="true" />
							Remove
						</Button>
					</div>
					{fieldDefinitions.map((field) => (
						<div
							key={field.field}
							className={`grid gap-2 ${field.className ?? ""}`}
						>
							<Label htmlFor={`${idPrefix}-address-${index}-${field.field}`}>
								{field.label}
							</Label>
							<Input
								id={`${idPrefix}-address-${index}-${field.field}`}
								value={address[field.field]}
								onChange={(event) =>
									updateField(
										index,
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
				</fieldset>
			))}
			<div>
				<Button
					type="button"
					variant="outline"
					size="sm"
					onClick={addAddress}
					className="w-full sm:w-fit"
				>
					<Plus aria-hidden="true" />
					Add another meeting address
				</Button>
				<p className="mt-2 text-xs text-muted-foreground">
					Groups meet in at least one place. Add every address where this group
					gathers.
				</p>
			</div>
		</div>
	);
}
