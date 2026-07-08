"use client";

import type * as React from "react";
import { Toggle as TogglePrimitive } from "@base-ui/react/toggle";
import { ToggleGroup as ToggleGroupPrimitive } from "@base-ui/react/toggle-group";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "../../lib/utils";

export const toggleVariants = cva(
  "text-base text-foreground hover:bg-accent focus-visible:ring-ring focus-visible:ring-offset-background data-pressed:bg-input/64 data-pressed:text-accent-foreground sm:text-sm relative inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-lg border font-medium whitespace-nowrap transition-shadow outline-none select-none before:pointer-events-none before:absolute before:inset-0 before:rounded-[calc(var(--radius-lg)-1px)] focus-visible:ring-2 focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-64 pointer-coarse:after:absolute pointer-coarse:after:size-full pointer-coarse:after:min-h-11 pointer-coarse:after:min-w-11 [&_svg]:pointer-events-none [&_svg]:-mx-0.5 [&_svg]:shrink-0 [&_svg:not([class*='opacity-'])]:opacity-80 [&_svg:not([class*='size-'])]:size-4.5 sm:[&_svg:not([class*='size-'])]:size-4",
  {
    defaultVariants: {
      size: "default",
      variant: "default",
    },
    variants: {
      size: {
        default: "h-9 min-w-9 px-[calc(--spacing(2)-1px)] sm:h-8 sm:min-w-8",
        lg: "h-10 min-w-10 px-[calc(--spacing(2.5)-1px)] sm:h-9 sm:min-w-9",
        sm: "h-8 min-w-8 px-[calc(--spacing(1.5)-1px)] sm:h-7 sm:min-w-7",
      },
      variant: {
        default: "border-transparent",
        outline:
          "border-input bg-background shadow-xs/5 dark:bg-input/32 dark:hover:bg-input/64 dark:data-pressed:bg-input not-dark:bg-clip-padding not-disabled:not-active:not-data-pressed:before:shadow-[0_1px_--theme(--color-black/4%)] dark:not-disabled:before:shadow-[0_-1px_--theme(--color-white/2%)] dark:not-disabled:not-active:not-data-pressed:before:shadow-[0_-1px_--theme(--color-white/6%)] [:disabled,:active,[data-pressed]]:shadow-none",
      },
    },
  }
);

export function Toggle({
  className,
  variant,
  size,
  ...props
}: TogglePrimitive.Props & VariantProps<typeof toggleVariants>): React.ReactElement {
  return <TogglePrimitive className={cn(toggleVariants({ className, size, variant }))} data-slot="toggle" {...props} />;
}

export const toggleGroupVariants = cva("inline-flex w-fit", {
  defaultVariants: {
    orientation: "horizontal",
    spacing: "default",
  },
  variants: {
    orientation: {
      horizontal: "flex-row",
      vertical: "flex-col",
    },
    spacing: {
      default: "gap-1",
      none: "",
    },
  },
});

export function ToggleGroup<Value extends string>({
  className,
  orientation = "horizontal",
  spacing,
  ...props
}: ToggleGroupPrimitive.Props<Value> & {
  spacing?: VariantProps<typeof toggleGroupVariants>["spacing"];
}): React.ReactElement {
  const resolvedSpacing = spacing ?? "default";

  return (
    <ToggleGroupPrimitive
      className={cn(toggleGroupVariants({ orientation, spacing: resolvedSpacing }), className)}
      data-orientation={orientation}
      data-slot="toggle-group"
      data-spacing={resolvedSpacing}
      orientation={orientation}
      {...props}
    />
  );
}

export function ToggleGroupItem({
  className,
  variant,
  size,
  ...props
}: TogglePrimitive.Props & VariantProps<typeof toggleVariants>): React.ReactElement {
  return (
    <Toggle
      className={cn(
        "in-data-[spacing=none]:rounded-none in-data-[spacing=none]:shadow-none in-data-[orientation=horizontal]:in-data-[spacing=none]:first:rounded-l-lg in-data-[orientation=horizontal]:in-data-[spacing=none]:last:rounded-r-lg in-data-[orientation=vertical]:in-data-[spacing=none]:first:rounded-t-lg in-data-[orientation=vertical]:in-data-[spacing=none]:last:rounded-b-lg",
        className
      )}
      data-slot="toggle-group-item"
      size={size}
      variant={variant}
      {...props}
    />
  );
}

export { ToggleGroupPrimitive, TogglePrimitive };
