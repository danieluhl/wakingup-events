import { Check, Monitor, Moon, Sun } from "lucide-react";
import { Button } from "#/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuTrigger,
} from "#/components/ui/dropdown-menu";
import { setTheme, type Theme, useTheme } from "#/lib/theme";

const options: { value: Theme; label: string; icon: typeof Sun }[] = [
	{ value: "light", label: "Light", icon: Sun },
	{ value: "dark", label: "Dark", icon: Moon },
	{ value: "system", label: "System", icon: Monitor },
];

export function ThemeSelector() {
	const theme = useTheme();
	const current =
		options.find((option) => option.value === theme) ?? options[2];
	const CurrentIcon = current.icon;

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button
					type="button"
					variant="ghost"
					size="icon"
					className="button-flat border-transparent dark:border-transparent"
					aria-label={`Theme: ${current.label.toLowerCase()}`}
				>
					<CurrentIcon className="size-4" aria-hidden="true" />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end">
				<DropdownMenuLabel>Theme</DropdownMenuLabel>
				{options.map(({ value, label, icon: Icon }) => (
					<DropdownMenuItem key={value} onClick={() => setTheme(value)}>
						<Icon className="size-4" aria-hidden="true" />
						{label}
						{theme === value && (
							<Check className="ml-auto size-4" aria-hidden="true" />
						)}
					</DropdownMenuItem>
				))}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
