/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// shadcn/ui Button (base-vega), mapped to Plane tokens. See ./README.md.
import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cva } from "class-variance-authority";
import type { VariantProps } from "class-variance-authority";
import { cn } from "@plane/utils";

const buttonVariants = cva(
  "inline-flex shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-md border border-transparent text-body-xs-medium whitespace-nowrap transition-colors outline-none select-none focus-visible:ring-2 focus-visible:ring-accent-strong disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-accent-primary text-on-color hover:bg-accent-primary-hover active:bg-accent-primary-active",
        outline: "border-subtle bg-surface-1 text-primary hover:bg-layer-1-hover aria-expanded:bg-layer-1-active",
        secondary: "bg-layer-2 text-primary hover:bg-layer-2-hover aria-expanded:bg-layer-2-active",
        ghost:
          "text-secondary hover:bg-layer-transparent-hover hover:text-primary aria-expanded:bg-layer-transparent-active aria-expanded:text-primary",
        destructive: "bg-danger-subtle text-danger-primary hover:bg-danger-subtle-hover",
      },
      size: {
        default: "h-8 px-2.5",
        sm: "h-7 px-2",
        lg: "h-9 px-3",
        icon: "size-8",
        "icon-sm": "size-7",
        "icon-lg": "size-12 [&_svg:not([class*='size-'])]:size-5",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

type ButtonProps = ButtonPrimitive.Props & VariantProps<typeof buttonVariants>;

function Button({ className, variant = "default", size = "default", ...props }: ButtonProps) {
  return <ButtonPrimitive data-slot="button" className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}

export { Button, buttonVariants };
export type { ButtonProps };
