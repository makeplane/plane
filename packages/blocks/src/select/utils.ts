/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { cva } from "class-variance-authority";
import { getPillButtonClassName } from "../pill-button";
import { cn } from "@plane/utils";
import type { SelectChromeSize, SelectTriggerSize, SelectTriggerVariant } from "./types";

const VARIANTS: SelectTriggerVariant[] = [
  "table-cell",
  "pill",
  "select",
  "select-ghost",
  "breadcrumb",
  "icon",
  "search-input",
];
const CHROME_SIZES: SelectChromeSize[] = ["md", "lg", "xl", "2xl"];
const TRIGGER_SIZES: SelectTriggerSize[] = ["sm", "md", "lg"];
// Short-form variants (no size suffix) always resolve to "md".
const SHORT_FORM_VARIANTS = ["table-cell", "breadcrumb", "search-input"] as const;

function isOneOf<T extends string>(list: readonly T[], value: string): value is T {
  return (list as readonly string[]).includes(value);
}

// `outline-none` drops the UA focus ring, so the keyboard indicator has to be drawn back: an
// icon-only trigger has no text or border of its own to show focus with, and the chrome is shared
// by every `icon-*` call site.
const ICON_TRIGGER_CLASSNAME =
  "inline-flex items-center justify-center rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-accent-strong disabled:cursor-not-allowed";

/** Box size for `icon-*` triggers — the button owns the footprint; prepend fills it. */
const ICON_TRIGGER_SIZE_CLASSNAME: Record<SelectTriggerSize, string> = {
  sm: "size-5",
  md: "size-6",
  lg: "size-7",
};

export type SplitSelectVariantResult =
  | { isSelectKind: true; variant: "select" | "select-ghost"; size: SelectChromeSize }
  | {
      isSelectKind: false;
      variant: "table-cell" | "pill" | "breadcrumb" | "icon" | "search-input";
      size: SelectTriggerSize;
    };

// Splits a value into its SelectTriggerVariant and size parts — `select` / `select-ghost` resolve to a
// SelectChromeSize, every other variant to a SelectTriggerSize.
export function splitSelectVariant(value: string): SplitSelectVariantResult {
  if (isOneOf(SHORT_FORM_VARIANTS, value)) {
    return { isSelectKind: false, variant: value, size: "md" };
  }

  const index = value.lastIndexOf("-");

  if (index === -1) return { isSelectKind: false, variant: "pill", size: "sm" };

  const variantPart = value.slice(0, index);
  const size = value.slice(index + 1);

  if (!isOneOf(VARIANTS, variantPart)) return { isSelectKind: false, variant: "pill", size: "sm" };

  if (variantPart === "select" || variantPart === "select-ghost") {
    if (!isOneOf(CHROME_SIZES, size)) return { isSelectKind: false, variant: "pill", size: "sm" };
    return { isSelectKind: true, variant: variantPart, size };
  }

  if (!isOneOf(TRIGGER_SIZES, size)) return { isSelectKind: false, variant: "pill", size: "sm" };

  return {
    isSelectKind: false,
    variant: variantPart,
    size,
  };
}

// Move the selected options to the top (in selection order), de-duped against the rest of the list.
// When a selected option is already in `list` its richer loaded object is reused; selected options
// missing from `list` (e.g. not yet paged in, in infinite mode) are still surfaced at the top.
export function pinSelected<T>(list: T[], selected: T[], getKey: (o: T) => string): T[] {
  if (selected.length === 0) return list;
  const byKey = new Map(list.map((item) => [getKey(item), item]));
  const selectedKeys = new Set(selected.map(getKey));
  const top = selected.map((sel) => byKey.get(getKey(sel)) ?? sel);
  const rest = list.filter((item) => !selectedKeys.has(getKey(item)));
  return [...top, ...rest];
}

// Append only the rows whose key isn't already loaded (paging can overlap or re-send a cursor row).
export function appendUnique<T>(prev: T[], next: T[], getKey: (o: T) => string): T[] {
  const keys = new Set(prev.map(getKey));
  const fresh = next.filter((n) => !keys.has(getKey(n)));
  return fresh.length ? [...prev, ...fresh] : prev;
}

export const triggerVariants = cva(
  "group flex h-full max-w-full items-center gap-1 rounded-sm px-2 py-1 text-body-sm-regular text-secondary transition-colors outline-none disabled:cursor-not-allowed disabled:text-disabled",
  {
    variants: {
      variant: {
        "table-cell":
          "w-full justify-start rounded-none px-page-x text-caption-md-regular leading-4 group-[.selected-issue-row]:bg-accent-primary/5 hover:bg-layer-transparent-hover group-[.selected-issue-row]:hover:bg-accent-primary/10",
      },
      isActive: { true: "", false: "" },
    },
    compoundVariants: [
      {
        variant: "table-cell",
        isActive: true,
        className: "bg-layer-transparent-active",
      },
    ],
    defaultVariants: { variant: "table-cell", isActive: false },
  }
);

// `select` / `select-ghost` chrome — a full-width row trigger, wearing propel's
// `comboboxTriggerVariants` (`elements/combobox/variants.ts`) look: `select` is propel's bordered
// `neutral` field surface, `select-ghost` its borderless `ghost`. Spelled out rather than imported
// because propel's `./elements/*` entry exposes each element's `index` — the components and their
// types — and not the cva behind them. Three deliberate deltas:
//
//   - propel's `min-w-72` floor is dropped (Ruling 28): these triggers sit in narrow columns,
//   - the open look keys off the `isActive` prop rather than `data-popup-open`, since this button
//     is only sometimes a base-ui part, and disabled keys off `:disabled` rather than
//     `data-disabled`, since it is a real `<button disabled>`,
//   - `data-invalid` is kept: `Field.Root` still propagates it when a Select sits in a field.
//
// The size steps are propel's own scale, so a step means the same thing on both: height, text size
// and `--node-size` glyphs, with only the frame geometry (gap, radius, inset) added.
export const selectTriggerVariants = cva(
  cn(
    "group/control group flex w-full items-center text-start text-primary outline-none",
    "transition-[color,background-color,border-color,box-shadow]"
  ),
  {
    variants: {
      variant: {
        select: cn(
          "border-sm border-subtle-1 bg-layer-2 data-invalid:border-danger-strong",
          "hover:border-strong hover:bg-layer-2-hover",
          "focus-visible:border-accent-strong focus-visible:ring-2 focus-visible:ring-accent-strong/20",
          "data-invalid:focus-visible:border-danger-strong data-invalid:focus-visible:ring-danger-strong/20",
          "disabled:cursor-not-allowed disabled:border-subtle-1 disabled:bg-layer-2 disabled:text-disabled",
          "disabled:ring-0 disabled:hover:border-subtle-1 disabled:hover:bg-layer-2"
        ),
        "select-ghost": cn(
          "border border-transparent bg-layer-transparent hover:bg-layer-transparent-hover",
          "focus-visible:bg-layer-transparent-active",
          "disabled:cursor-not-allowed disabled:border-transparent disabled:bg-transparent",
          "disabled:text-disabled disabled:hover:bg-transparent"
        ),
      },
      size: {
        md: cn(
          "min-h-(--control-height-md) text-body-xs-regular [--node-size:var(--control-glyph-md)]",
          "gap-(--control-gap-md) rounded-(--control-radius-md) px-(--field-inset-md)"
        ),
        lg: cn(
          "min-h-(--control-height-lg) text-body-sm-regular [--node-size:var(--control-glyph-lg)]",
          "gap-(--control-gap-lg) rounded-(--control-radius-lg) px-(--field-inset-lg)"
        ),
        xl: cn(
          "min-h-(--control-height-xl) text-body-sm-regular [--node-size:var(--control-glyph-xl)]",
          "gap-(--control-gap-xl) rounded-(--control-radius-xl) px-(--field-inset-xl)"
        ),
        "2xl": cn(
          "min-h-(--control-height-2xl) text-body-md-regular [--node-size:var(--control-glyph-2xl)]",
          "gap-(--control-gap-2xl) rounded-(--control-radius-2xl) px-(--field-inset-2xl)"
        ),
      },
      isActive: { true: "", false: "" },
    },
    compoundVariants: [
      {
        variant: "select",
        isActive: true,
        className: "border-accent-strong ring-2 ring-accent-strong/20 data-invalid:ring-danger-strong/20",
      },
      { variant: "select-ghost", isActive: true, className: "bg-layer-transparent-active" },
    ],
    defaultVariants: { variant: "select-ghost", size: "lg", isActive: false },
  }
);

// Primary helper — returns the full CVA className for a `select` / `select-ghost` trigger.
export function getSelectClassName(
  variant: "select" | "select-ghost",
  size: SelectChromeSize,
  isActive?: boolean,
  className?: string
): string {
  return selectTriggerVariants({ variant, size, isActive: isActive ?? false, className });
}

/** Resolves trigger button chrome classes for a split variant + active state. */
export function getTriggerChromeClassName(split: SplitSelectVariantResult, isActive: boolean): string {
  if (split.isSelectKind) {
    return getSelectClassName(split.variant, split.size, isActive);
  }

  switch (split.variant) {
    case "icon":
      return cn(ICON_TRIGGER_CLASSNAME, ICON_TRIGGER_SIZE_CLASSNAME[split.size]);
    case "pill":
      return getPillButtonClassName(split.size, isActive);
    case "table-cell":
      return triggerVariants({ variant: split.variant, isActive });
    case "breadcrumb":
    case "search-input":
      // These variants render their own chrome before this helper is called.
      return "";
  }
}
