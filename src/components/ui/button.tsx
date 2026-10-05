import { cva, type VariantProps } from "class-variance-authority";
import type * as React from "react";
import { cn } from "#/lib/utils";

// Stillpoint Bloom buttons: quiet pills. `btn` carries a hidden oil-slick ring
// (see styles.css) that shows on keyboard focus; `btn-iris` also reveals it on
// hover for the primary and outline variants.
const buttonVariants = cva(
	"btn inline-flex shrink-0 items-center justify-center gap-2 rounded-full border border-transparent font-medium whitespace-nowrap no-underline select-none outline-none transition-[background-color,border-color,color,transform] focus-visible:outline-none disabled:pointer-events-none disabled:opacity-45 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
	{
		variants: {
			variant: {
				default:
					"btn-iris bg-primary text-primary-foreground hover:bg-(--primary-hover) hover:text-primary-foreground",
				secondary:
					"bg-secondary text-secondary-foreground hover:bg-(--secondary-hover) hover:text-secondary-foreground",
				outline:
					"btn-iris border-input bg-transparent text-foreground hover:bg-secondary hover:text-foreground",
				ghost:
					"bg-transparent text-muted-foreground hover:bg-secondary hover:text-foreground",
				destructive:
					"border-destructive/50 bg-transparent text-destructive hover:bg-destructive/10 hover:text-destructive",
			},
			size: {
				default: "h-10 px-5 text-sm",
				sm: "h-8 px-3.5 text-[0.8125rem]",
				lg: "h-12 px-7 text-[0.9375rem]",
				icon: "size-10",
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
