"use client";

import * as React from "react";
import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "../../lib/utils";

export const badgeVariants = cva(
  "focus-visible:ring-ring focus-visible:ring-offset-background relative inline-flex shrink-0 items-center justify-center gap-1 rounded-sm border border-transparent font-medium whitespace-nowrap transition-shadow outline-none focus-visible:ring-2 focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-64 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='opacity-'])]:opacity-80 [&_svg:not([class*='size-'])]:size-3.5 sm:[&_svg:not([class*='size-'])]:size-3 [button&,a&]:cursor-pointer [button&,a&]:pointer-coarse:after:absolute [button&,a&]:pointer-coarse:after:size-full [button&,a&]:pointer-coarse:after:min-h-11 [button&,a&]:pointer-coarse:after:min-w-11",
  {
    defaultVariants: {
      size: "default",
      variant: "default",
    },
    variants: {
      size: {
        default: "text-sm sm:text-xs h-5.5 min-w-5.5 px-[calc(--spacing(1)-1px)] sm:h-4.5 sm:min-w-4.5",
        lg: "text-base sm:text-sm h-6.5 min-w-6.5 px-[calc(--spacing(1.5)-1px)] sm:h-5.5 sm:min-w-5.5",
        sm: "text-xs h-5 min-w-5 rounded-[.25rem] px-[calc(--spacing(1)-1px)] sm:h-4 sm:min-w-4 sm:text-[.625rem]",
      },
      variant: {
        default: "bg-primary text-primary-foreground [button&,a&]:hover:bg-primary/90",
        destructive: "bg-destructive [button&,a&]:hover:bg-destructive/90 text-white",
        error: "bg-destructive/8 text-destructive-foreground dark:bg-destructive/16",
        info: "bg-info/8 text-info-foreground dark:bg-info/16",
        outline:
          "border-input bg-background text-foreground dark:bg-input/32 [button&,a&]:hover:bg-accent/50 dark:[button&,a&]:hover:bg-input/48",
        secondary: "bg-secondary text-secondary-foreground [button&,a&]:hover:bg-secondary/90",
        success: "bg-success/8 text-success-foreground dark:bg-success/16",
        warning: "bg-warning/8 text-warning-foreground dark:bg-warning/16",
      },
    },
  }
);

export interface BadgeProps extends useRender.ComponentProps<"span"> {
  variant?: VariantProps<typeof badgeVariants>["variant"];
  size?: VariantProps<typeof badgeVariants>["size"];
  asChild?: boolean;
}

export function Badge({
  className,
  variant,
  size,
  render,
  asChild = false,
  children,
  ...props
}: BadgeProps): React.ReactElement {
  const renderValue =
    render ??
    (asChild && React.isValidElement(children) ? (children as React.ReactElement<Record<string, unknown>>) : undefined);
  const defaultProps = {
    children: asChild && React.isValidElement(children) ? undefined : children,
    className: cn(badgeVariants({ className, size, variant })),
    "data-slot": "badge",
  };

  return useRender({
    defaultTagName: "span",
    props: mergeProps<"span">(defaultProps, props),
    render: renderValue,
  });
}
