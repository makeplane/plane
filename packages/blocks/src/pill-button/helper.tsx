/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { VariantProps } from "class-variance-authority";
import { cva } from "class-variance-authority";

const pillButtonVariants = cva(
  "group inline-flex items-center justify-start rounded-md border border-subtle-1 bg-layer-2 text-secondary transition-colors outline-none hover:border-strong hover:bg-layer-2-hover active:border-strong active:bg-layer-2-active disabled:pointer-events-none disabled:cursor-not-allowed disabled:border-subtle-1 disabled:bg-layer-transparent disabled:text-disabled",
  {
    variants: {
      size: {
        sm: "h-5 gap-1 px-1.5 py-1 text-caption-md-regular",
        md: "h-6 gap-1 px-1.5 py-1 text-body-xs-regular",
        lg: "h-7 gap-1 px-2 py-1 text-body-sm-regular",
      },
      isActive: {
        true: "border-strong bg-layer-2-active text-primary",
        false: "",
      },
    },
    defaultVariants: { size: "sm", isActive: false },
  }
);

export type PillButtonSize = NonNullable<VariantProps<typeof pillButtonVariants>["size"]>;

// Primary helper — returns the full CVA className for a pill-button trigger.
export function getPillButtonClassName(size: PillButtonSize, isActive?: boolean, className?: string): string {
  return pillButtonVariants({ size, isActive: isActive ?? false, className });
}

// Size / icon helpers — used by blocks/select/utils.ts and anywhere that needs

const pillButtonSizeClassNames: Record<PillButtonSize, string> = {
  sm: "gap-1 px-1.5 py-1 text-caption-md-regular",
  md: "gap-1 px-1.5 py-1 text-body-xs-regular",
  lg: "gap-1 px-2 py-1 text-body-sm-regular",
};

export function getPillButtonSizeClassName(size: PillButtonSize): string {
  return pillButtonSizeClassNames[size];
}

const pillButtonIconClassNames: Record<PillButtonSize, string> = {
  sm: "size-3.5 shrink-0",
  md: "size-3.5 shrink-0",
  lg: "size-4 shrink-0",
};

export function getPillButtonIconClassName(size: PillButtonSize): string {
  return pillButtonIconClassNames[size];
}

const pillButtonIconSizes: Record<PillButtonSize, number> = {
  sm: 14,
  md: 14,
  lg: 16,
};

export function getPillButtonIconSize(size: PillButtonSize): number {
  return pillButtonIconSizes[size];
}

const pillIconPaddings: Record<PillButtonSize, string> = {
  sm: "p-1",
  md: "p-1",
  lg: "p-1.5",
};

export function getPillIconPadding(size: PillButtonSize): string {
  return pillIconPaddings[size];
}
