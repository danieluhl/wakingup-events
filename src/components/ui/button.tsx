import { cva, type VariantProps } from "class-variance-authority";
import type * as React from "react";
import { cn } from "#/lib/utils";

const buttonVariants = cva(
	"button-block inline-flex shrink-0 items-center justify-center border-2 border-[#241c17] font-extrabold uppercase tracking-[0.08em] text-black no-underline select-none hover:text-black focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#9a825f] focus-visible:ring-offset-2 focus-visible:ring-offset-[#211a16] disabled:pointer-events-none disabled:opacity-50 dark:border-[#241c17]",
	{
		variants: {
			variant: {
				default: "bg-[#6f918b] hover:bg-[#82a19b]",
				secondary: "bg-[#a98262] hover:bg-[#b89474]",
				outline: "bg-[#c3b49b] hover:bg-[#d0c3ad]",
				ghost:
					"button-flat border-transparent bg-transparent text-[#4b4037] hover:border-[#8f806f] hover:bg-[#ded4c5] hover:text-[#241c17] dark:text-[#cbbda9] dark:hover:border-[#786652] dark:hover:bg-[#40342b] dark:hover:text-[#f0e6d8]",
				destructive: "bg-[#b66a55] hover:bg-[#c27b66]",
			},
			size: {
				default: "h-11 px-5 text-sm",
				sm: "h-9 px-4 text-xs",
				lg: "h-13 px-7 text-base",
				icon: "size-11",
			},
		},
		defaultVariants: {
			variant: "default",
			size: "default",
		},
	},
);

function Button({
	className,
	variant,
	size,
	...props
}: React.ComponentProps<"button"> & VariantProps<typeof buttonVariants>) {
	return (
		<button
			data-slot="button"
			className={cn(buttonVariants({ variant, size, className }))}
			{...props}
		/>
	);
}

export { Button, buttonVariants };
