/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { ButtonHTMLAttributes, ReactNode } from "react";
import { BreadcrumbTrigger, BreadcrumbTriggerIndicator } from "@makeplane/propel/elements/breadcrumb";
import { useBreadcrumbCurrent } from "../breadcrumb/breadcrumb-context";
import { BreadcrumbIcon, BreadcrumbLabel } from "../breadcrumb/breadcrumbs";
import { ChevronDownOutline } from "@makeplane/propel/icons";
import { PillButtonContent } from "../pill-button";
import type { IconElement } from "../types";
import { cn } from "@plane/utils";
import { SelectContent } from "./select-content";
import type { SelectVariant } from "./types";
import { getTriggerChromeClassName, splitSelectVariant } from "./utils";
import type { SplitSelectVariantResult } from "./utils";

type TriggerInnerProps = {
  split: SplitSelectVariantResult;
  prepend?: IconElement;
  /** `null` suppresses the trailing glyph outright — `undefined` leaves the variant's own default. */
  append?: IconElement | null;
  label?: string;
  isEmpty?: boolean;
  children: ReactNode;
};

/**
 * The trigger's contents, identical across every host: the `select` kinds get `SelectContent`
 * (prepend + children + chevron), `pill` / `table-cell` the propel `PillButtonContent` row,
 * `icon` just its prepend, and `breadcrumb` its own icon + truncated label + chevron.
 */
export function TriggerInner({ split, prepend, append, label, isEmpty, children }: TriggerInnerProps) {
  if (!split.isSelectKind && split.variant === "icon") {
    // Prepend-only: button footprint comes from `icon-sm|md|lg` chrome; callers fill it (e.g. size-full badge).
    return <>{prepend}</>;
  }
  if (split.isSelectKind) {
    return (
      <SelectContent
        size={split.size}
        variant={split.variant}
        prependIcon={prepend}
        appendIcon={append}
        isEmpty={isEmpty}
      >
        {children}
      </SelectContent>
    );
  }
  if (split.variant === "pill" || split.variant === "table-cell") {
    return (
      // propel's `PillButtonContent` renders nothing for a missing append, so an explicit `null`
      // (suppress) and `undefined` (nothing to show) collapse to the same thing here.
      <PillButtonContent size={split.size} prependIcon={prepend} appendIcon={append ?? undefined}>
        {children}
      </PillButtonContent>
    );
  }
  return (
    <>
      {prepend && <BreadcrumbIcon>{prepend}</BreadcrumbIcon>}
      <BreadcrumbLabel>{label}</BreadcrumbLabel>
      {/* An explicit null suppresses the dropdown indicator. */}
      {append === null ? null : (
        <BreadcrumbTriggerIndicator>{append ?? <ChevronDownOutline />}</BreadcrumbTriggerIndicator>
      )}
    </>
  );
}

export type SelectTriggerChromeProps = {
  /** The one source of chrome, shared with `Select.Trigger`. */
  variant: SelectVariant;
  /** Applies the open/active chrome. */
  isActive?: boolean;
  /** Escape hatch merged onto the button after the variant classes. */
  className?: string;
  prependIcon?: IconElement;
  /** `null` suppresses the trailing glyph outright — `undefined` leaves the variant's own default. */
  appendIcon?: IconElement | null;
  /** Truncated label text for the `breadcrumb` chrome, which renders it itself. */
  label?: string;
  /** Drives the placeholder text colour of the `select` chrome. */
  isEmpty?: boolean;
  children?: ReactNode;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children" | "className">;

/**
 * The closed-field button for every `SelectVariant`, with no dropdown of its own — the piece
 * `Select.Trigger` and the date blocks share. It renders a real `<button>`, so any base-ui popup
 * part can graft its behavior onto it via `render={<SelectTriggerChrome … />}`.
 *
 * Breadcrumb triggers use Propel breadcrumb chrome; other variants use Plane chrome, including `select` /
 * `select-ghost`, which mirror propel's `comboboxTriggerVariants` look and size scale
 * (`md`/`lg`/`xl`/`2xl`), so a step means the same thing on both. Propel's `elements/combobox`
 * `ComboboxTrigger` itself is still NOT rendered: it hard-codes `min-w-72` (288px) with no width
 * axis, which would floor every `select-*` call site — the work-item sidebar's `select-ghost-md`
 * pickers sit in far narrower columns. Swap it in once propel exposes a width axis (Ruling 28).
 */
export function SelectTriggerChrome({
  variant,
  isActive = false,
  className,
  prependIcon,
  appendIcon,
  label,
  isEmpty,
  children,
  ...buttonProps
}: SelectTriggerChromeProps) {
  const split = splitSelectVariant(variant);
  const isCurrent = useBreadcrumbCurrent();

  if (variant === "breadcrumb") {
    return (
      <BreadcrumbTrigger
        group
        aria-current={isCurrent ? "page" : undefined}
        data-popup-open={isActive ? "" : undefined}
        render={
          <button
            type="button"
            className={cn(
              "outline-none focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent-strong focus-visible:outline-solid",
              className
            )}
          />
        }
        {...buttonProps}
      >
        <TriggerInner split={split} prepend={prependIcon} append={appendIcon} label={label} isEmpty={isEmpty}>
          {children}
        </TriggerInner>
      </BreadcrumbTrigger>
    );
  }

  return (
    <button
      type="button"
      className={cn(
        getTriggerChromeClassName(split, isActive),
        // Select pills share chrome with other pickers; width clamp stays on the Select trigger only.
        !split.isSelectKind && split.variant === "pill" && "max-w-40",
        className
      )}
      {...buttonProps}
    >
      <TriggerInner split={split} prepend={prependIcon} append={appendIcon} label={label} isEmpty={isEmpty}>
        {children}
      </TriggerInner>
    </button>
  );
}

SelectTriggerChrome.displayName = "blocks.SelectTriggerChrome";
