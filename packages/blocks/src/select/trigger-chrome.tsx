/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Children, Fragment, isValidElement } from "react";
import { Icon } from "@makeplane/propel/components/icon";
import { BreadcrumbTrigger, BreadcrumbTriggerIndicator } from "@makeplane/propel/elements/breadcrumb";
import { ComboboxTrigger } from "@makeplane/propel/elements/combobox";
import { IconPill, Pill, PillLabel } from "@makeplane/propel/elements/pill";
import { useBreadcrumbCurrent } from "../breadcrumb/breadcrumb-context";
import { BreadcrumbIcon, BreadcrumbLabel } from "../breadcrumb/breadcrumbs";
import { ChevronDownOutline } from "@makeplane/propel/icons";
import { PROPEL_PILL_SIZE } from "../pill-button/helper";
import type { IconElement } from "../types/icon";
import { cn } from "@plane/utils";
import { SelectContent } from "./select-content";
import type { SelectTriggerSize, SelectVariant } from "./types";
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
 * (prepend + children + chevron), `table-cell` an icon/label row,
 * `icon` just its prepend, and `breadcrumb` its own icon + truncated label + chevron.
 * Pill content is composed by the public Pill elements below.
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
  if (split.variant === "table-cell") {
    return (
      <>
        {prepend && <Icon icon={prepend} size="sm" />}
        {children}
        {append && <Icon icon={append} size="sm" />}
      </>
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

/** Fragments and conditional children must not turn an empty property into a padded text pill. */
function hasTriggerContent(children: ReactNode): boolean {
  return Children.toArray(children).some((child) => {
    if (isValidElement<{ children?: ReactNode }>(child) && child.type === Fragment) {
      return hasTriggerContent(child.props.children);
    }
    return typeof child !== "string" || child.length > 0;
  });
}

type PillTriggerChromeProps = Omit<SelectTriggerChromeProps, "variant" | "label"> & { size: SelectTriggerSize };

function PillTriggerChrome({
  size,
  isActive,
  className,
  style,
  prependIcon,
  appendIcon,
  isEmpty,
  children,
  ...buttonProps
}: PillTriggerChromeProps) {
  const content = hasTriggerContent(children);
  const sharedProps = {
    size: PROPEL_PILL_SIZE[size],
    "data-popup-open": isActive ? "" : undefined,
    ...buttonProps,
  };
  const iconsAndLabel = (
    <>
      {prependIcon && <Icon icon={prependIcon} />}
      {content &&
        (typeof children === "string" || typeof children === "number" ? <PillLabel>{children}</PillLabel> : children)}
      {appendIcon && <Icon icon={appendIcon} />}
    </>
  );
  return content ? (
    <Pill
      {...sharedProps}
      variant="outline"
      placeholder={isEmpty}
      render={(props) => (
        <button
          type="button"
          {...props}
          className={cn(props.className, className)}
          style={{ ...props.style, ...style }}
        />
      )}
    >
      {iconsAndLabel}
    </Pill>
  ) : (
    <IconPill
      {...sharedProps}
      render={(props) => (
        <button
          type="button"
          {...props}
          className={cn(props.className, className)}
          style={{ ...props.style, ...style }}
        />
      )}
    >
      {iconsAndLabel}
    </IconPill>
  );
}

/**
 * The closed-field button for every `SelectVariant`, with no dropdown of its own — the piece
 * `Select.Trigger` and the date blocks share. It renders a real `<button>`, so any base-ui popup
 * part can graft its behavior onto it via `render={<SelectTriggerChrome … />}`.
 *
 * Propel owns field, pill and breadcrumb styling. `width="fit"` removes the field's default
 * 288px floor; CE's full-width layout can then fit narrow property columns. Table cells and bare
 * icons keep their Plane-specific geometry. Existing CE size names and className stay supported.
 */
export function SelectTriggerChrome({
  variant,
  isActive = false,
  className,
  style,
  prependIcon,
  appendIcon,
  label,
  isEmpty,
  children,
  ...buttonProps
}: SelectTriggerChromeProps) {
  const split = splitSelectVariant(variant);
  const isCurrent = useBreadcrumbCurrent();

  if (split.isSelectKind) {
    return (
      <ComboboxTrigger
        variant={split.variant === "select" ? "secondary" : "ghost"}
        size={split.size}
        width="fit"
        render={(props) => (
          <button
            type="button"
            {...props}
            className={cn(props.className, "group w-full", className)}
            style={{ ...props.style, ...style }}
          />
        )}
        data-popup-open={isActive ? "" : undefined}
        data-placeholder={isEmpty ? "" : undefined}
        data-disabled={buttonProps.disabled ? "" : undefined}
        {...buttonProps}
      >
        <TriggerInner split={split} prepend={prependIcon} append={appendIcon} isEmpty={isEmpty}>
          {children}
        </TriggerInner>
      </ComboboxTrigger>
    );
  }

  if (split.variant === "pill") {
    return (
      <PillTriggerChrome
        size={split.size}
        isActive={isActive}
        className={className}
        style={style}
        prependIcon={prependIcon}
        appendIcon={appendIcon}
        isEmpty={isEmpty}
        {...buttonProps}
      >
        {children}
      </PillTriggerChrome>
    );
  }

  if (variant === "breadcrumb") {
    return (
      <BreadcrumbTrigger
        group
        aria-current={isCurrent ? "page" : undefined}
        data-popup-open={isActive ? "" : undefined}
        render={
          <button
            type="button"
            style={style}
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
      className={cn(getTriggerChromeClassName(split, isActive), className)}
      style={style}
      {...buttonProps}
    >
      <TriggerInner split={split} prepend={prependIcon} append={appendIcon} label={label} isEmpty={isEmpty}>
        {children}
      </TriggerInner>
    </button>
  );
}

SelectTriggerChrome.displayName = "blocks.SelectTriggerChrome";
