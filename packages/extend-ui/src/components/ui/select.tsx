"use client";

import type * as React from "react";
import { mergeProps } from "@base-ui/react/merge-props";
import { Select as SelectPrimitive } from "@base-ui/react/select";
import { useRender } from "@base-ui/react/use-render";
import { ChevronDown, ChevronUp } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "../../lib/utils";

export const Select: typeof SelectPrimitive.Root = SelectPrimitive.Root;

export const selectTriggerVariants = cva(
  "border-input bg-background text-base text-foreground shadow-xs/5 ring-ring/24 focus-visible:border-ring aria-invalid:border-destructive/36 focus-visible:aria-invalid:border-destructive/64 focus-visible:aria-invalid:ring-destructive/16 sm:text-sm dark:bg-input/32 dark:aria-invalid:ring-destructive/24 relative inline-flex min-h-9 w-full min-w-36 items-center justify-between gap-2 rounded-lg border px-[calc(--spacing(3)-1px)] text-left transition-shadow outline-none select-none not-dark:bg-clip-padding before:pointer-events-none before:absolute before:inset-0 before:rounded-[calc(var(--radius-lg)-1px)] not-data-disabled:not-focus-visible:not-aria-invalid:not-data-pressed:before:shadow-[0_1px_--theme(--color-black/4%)] focus-visible:ring-[3px] data-disabled:pointer-events-none data-disabled:opacity-64 sm:min-h-8 dark:not-data-disabled:not-focus-visible:not-aria-invalid:not-data-pressed:before:shadow-[0_-1px_--theme(--color-white/6%)] pointer-coarse:after:absolute pointer-coarse:after:size-full pointer-coarse:after:min-h-11 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='opacity-'])]:opacity-80 [&_svg:not([class*='size-'])]:size-4.5 sm:[&_svg:not([class*='size-'])]:size-4 [[data-disabled],:focus-visible,[aria-invalid],[data-pressed]]:shadow-none",
  {
    defaultVariants: {
      size: "default",
    },
    variants: {
      size: {
        default: "",
        lg: "min-h-10 sm:min-h-9",
        sm: "min-h-8 gap-1.5 px-[calc(--spacing(2.5)-1px)] sm:min-h-7",
      },
    },
  }
);

export const selectTriggerIconClassName = "-me-1 size-4.5 opacity-80 sm:size-4";

export interface SelectButtonProps extends useRender.ComponentProps<"button"> {
  size?: VariantProps<typeof selectTriggerVariants>["size"];
}

export function SelectButton({ className, size, render, children, ...props }: SelectButtonProps): React.ReactElement {
  const typeValue: React.ButtonHTMLAttributes<HTMLButtonElement>["type"] = render ? undefined : "button";

  const defaultProps = {
    children: (
      <>
        <span className="in-data-placeholder:text-muted-foreground/72 flex-1 truncate">{children}</span>
        <HugeiconsIcon className={selectTriggerIconClassName} icon={ChevronDown} />
      </>
    ),
    className: cn(selectTriggerVariants({ size }), "min-w-0", className),
    "data-slot": "select-button",
    type: typeValue,
  };

  return useRender({
    defaultTagName: "button",
    props: mergeProps<"button">(defaultProps, props),
    render,
  });
}

export function SelectTrigger({
  className,
  size = "default",
  children,
  ...props
}: SelectPrimitive.Trigger.Props & VariantProps<typeof selectTriggerVariants>): React.ReactElement {
  return (
    <SelectPrimitive.Trigger
      className={cn(selectTriggerVariants({ size }), className)}
      data-slot="select-trigger"
      {...props}
    >
      {children}
      <SelectPrimitive.Icon data-slot="select-icon">
        <HugeiconsIcon className={selectTriggerIconClassName} icon={ChevronDown} />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  );
}

export function SelectValue({ className, ...props }: SelectPrimitive.Value.Props): React.ReactElement {
  return (
    <SelectPrimitive.Value
      className={cn("data-placeholder:text-muted-foreground flex-1 truncate", className)}
      data-slot="select-value"
      {...props}
    />
  );
}

export function SelectPopup({
  className,
  children,
  side = "bottom",
  sideOffset = 4,
  align = "start",
  alignOffset = 0,
  alignItemWithTrigger = true,
  anchor,
  portalProps,
  ...props
}: SelectPrimitive.Popup.Props & {
  portalProps?: SelectPrimitive.Portal.Props;
  side?: SelectPrimitive.Positioner.Props["side"];
  sideOffset?: SelectPrimitive.Positioner.Props["sideOffset"];
  align?: SelectPrimitive.Positioner.Props["align"];
  alignOffset?: SelectPrimitive.Positioner.Props["alignOffset"];
  alignItemWithTrigger?: SelectPrimitive.Positioner.Props["alignItemWithTrigger"];
  anchor?: SelectPrimitive.Positioner.Props["anchor"];
}): React.ReactElement {
  return (
    <SelectPrimitive.Portal {...portalProps}>
      <SelectPrimitive.Positioner
        align={align}
        alignItemWithTrigger={alignItemWithTrigger}
        alignOffset={alignOffset}
        anchor={anchor}
        className="z-50 select-none"
        data-slot="select-positioner"
        side={side}
        sideOffset={sideOffset}
      >
        <SelectPrimitive.Popup
          className="text-foreground origin-(--transform-origin) outline-none"
          data-slot="select-popup"
          {...props}
        >
          <SelectPrimitive.ScrollUpArrow
            className="before:from-popover top-0 z-50 flex h-6 w-full cursor-default items-center justify-center before:pointer-events-none before:absolute before:inset-x-px before:top-px before:h-[200%] before:rounded-t-[calc(var(--radius-lg)-1px)] before:bg-linear-to-b before:from-50%"
            data-slot="select-scroll-up-arrow"
          >
            <HugeiconsIcon className="relative size-4.5 sm:size-4" icon={ChevronUp} />
          </SelectPrimitive.ScrollUpArrow>
          <div className="bg-popover shadow-lg/5 relative h-full min-w-(--anchor-width) rounded-lg border not-dark:bg-clip-padding before:pointer-events-none before:absolute before:inset-0 before:rounded-[calc(var(--radius-lg)-1px)] before:shadow-[0_1px_--theme(--color-black/4%)] dark:before:shadow-[0_-1px_--theme(--color-white/6%)]">
            <SelectPrimitive.List
              className={cn("max-h-(--available-height) overflow-y-auto p-1", className)}
              data-slot="select-list"
            >
              {children}
            </SelectPrimitive.List>
          </div>
          <SelectPrimitive.ScrollDownArrow
            className="before:from-popover bottom-0 z-50 flex h-6 w-full cursor-default items-center justify-center before:pointer-events-none before:absolute before:inset-x-px before:bottom-px before:h-[200%] before:rounded-b-[calc(var(--radius-lg)-1px)] before:bg-linear-to-t before:from-50%"
            data-slot="select-scroll-down-arrow"
          >
            <HugeiconsIcon className="relative size-4.5 sm:size-4" icon={ChevronDown} />
          </SelectPrimitive.ScrollDownArrow>
        </SelectPrimitive.Popup>
      </SelectPrimitive.Positioner>
    </SelectPrimitive.Portal>
  );
}

export function SelectItem({ className, children, ...props }: SelectPrimitive.Item.Props): React.ReactElement {
  return (
    <SelectPrimitive.Item
      className={cn(
        "text-base data-highlighted:bg-accent data-highlighted:text-accent-foreground sm:text-sm grid min-h-8 cursor-default grid-cols-[1rem_1fr] items-center gap-2 rounded-sm py-1 ps-2 pe-4 outline-none in-data-[side=none]:min-w-[calc(var(--anchor-width)+1.25rem)] data-disabled:pointer-events-none data-disabled:opacity-64 sm:min-h-7 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4.5 sm:[&_svg:not([class*='size-'])]:size-4",
        className
      )}
      data-slot="select-item"
      {...props}
    >
      <SelectPrimitive.ItemIndicator className="col-start-1">
        <svg
          aria-hidden="true"
          fill="none"
          height="24"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
          width="24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M5.252 12.7 10.2 18.63 18.748 5.37" />
        </svg>
      </SelectPrimitive.ItemIndicator>
      <SelectPrimitive.ItemText className="col-start-2 min-w-0">{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  );
}

export function SelectSeparator({ className, ...props }: SelectPrimitive.Separator.Props): React.ReactElement {
  return (
    <SelectPrimitive.Separator
      className={cn("bg-border mx-2 my-1 h-px", className)}
      data-slot="select-separator"
      {...props}
    />
  );
}

export function SelectGroup(props: SelectPrimitive.Group.Props): React.ReactElement {
  return <SelectPrimitive.Group data-slot="select-group" {...props} />;
}

export function SelectLabel({ className, ...props }: SelectPrimitive.Label.Props): React.ReactElement {
  return (
    <SelectPrimitive.Label
      className={cn(
        "text-base/4.5 text-foreground sm:text-sm/4 inline-flex cursor-default items-center gap-2 font-medium not-in-data-[slot=field]:mb-2",
        className
      )}
      data-slot="select-label"
      {...props}
    />
  );
}

export function SelectGroupLabel(props: SelectPrimitive.GroupLabel.Props): React.ReactElement {
  return (
    <SelectPrimitive.GroupLabel
      className="text-xs text-muted-foreground px-2 py-1.5 font-medium"
      data-slot="select-group-label"
      {...props}
    />
  );
}

export { SelectPrimitive, SelectPopup as SelectContent };
