/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { Icon as PropelIcon } from "@makeplane/propel/components/icon";
import type { ReactNode } from "react";
import { useLayoutEffect } from "react";
import { useTranslation } from "@plane/i18n";
import { Combobox as BaseCombobox } from "@base-ui/react/combobox";
import { IconButton } from "@makeplane/propel/components/icon-button";
import { Tooltip } from "@makeplane/propel/components/tooltip";
import { CloseOutline } from "@makeplane/propel/icons";
import { cn } from "@plane/utils";
import { useSelectContext } from "./context";
import { useSelectEngine } from "./engine-context";
import { SelectTriggerChrome } from "./trigger-chrome";
import type { SelectTriggerProps } from "./types";
import { splitSelectVariant } from "./utils";

/**
 * `search-input`'s chips frame. Plane-owned rather than propel's `ComboboxChips`, which hard-codes
 * `min-w-72` (288px) with no width axis — see the Ruling 28 note in `trigger-chrome.tsx`.
 */
const CHIPS_FRAME_CLASSNAME =
  "flex min-h-8 flex-wrap items-center gap-1 rounded-md border border-subtle bg-layer-2 px-2 py-1";

const CHIP_CLASSNAME =
  "flex h-6 min-w-0 max-w-37.5 shrink-0 items-center gap-1 rounded-md bg-layer-3 px-2 py-1 text-body-xs-regular text-secondary outline-none hover:bg-layer-3-hover focus-visible:ring-2 focus-visible:ring-accent-strong [&_svg]:size-3.5";

export function SelectTrigger<T>(props: SelectTriggerProps<T>) {
  const {
    disabled,
    variant,
    isActive,
    className,
    prependIcon,
    appendIcon,
    label,
    children,
    tooltip,
    tabIndex,
    id,
    ...rest
  } = props;
  // `tooltip` is a boolean shorthand or an override object; the object form carries the copy.
  const tooltipOverride = typeof tooltip === "object" ? tooltip : undefined;
  // `data-*` passthrough: tour anchors and test ids belong on the element the user actually
  // interacts with, whichever form the variant renders it in.
  const dataAttributes: Record<string, string | number | boolean | undefined> = {};
  for (const [key, value] of Object.entries(rest)) {
    if (key.startsWith("data-")) dataAttributes[key] = value;
  }
  const ctx = useSelectContext();
  // Every host publishes this — `SelectRoot`, and the hand-rolled `SelectContext.Provider` in
  // `release-select`. `null` would mean a `SelectContext` without a base-ui Root behind it, which
  // has no dropdown to open: the trigger then stays in the resting (unmounted) form below.
  const engine = useSelectEngine();
  // translation
  const { t } = useTranslation();
  const selected = ctx.selected as T[];
  // Caller-supplied `isActive` (e.g. a focused table cell) wins; otherwise reflect the dropdown's own open state.
  const active = isActive ?? ctx.isOpen;
  // The root's `disabled` reaches a mounted trigger through base-ui, but not the resting button.
  const isDisabled = disabled || engine?.disabled || false;

  const split = splitSelectVariant(variant);

  // The chips field is a base-ui part and throws outside a Root, so this variant has no resting
  // form. Mounting before paint spares every caller `lazyMount={false}`.
  const needsMountedEngine = split.variant === "search-input" && engine !== null && !engine.mounted;
  const mountEngine = engine?.mount;
  useLayoutEffect(() => {
    if (needsMountedEngine) mountEngine?.();
  }, [needsMountedEngine, mountEngine]);

  if (split.variant === "search-input") {
    if (engine && !engine.mounted) return null;
    const renderChip = ctx.renderChip;
    return (
      // The field IS the filter input here, so the query is the root's controlled `inputValue`.
      <BaseCombobox.Chips
        className={cn(CHIPS_FRAME_CLASSNAME, isDisabled && "cursor-not-allowed opacity-60", className)}
        data-disabled={isDisabled ? "" : undefined}
        {...dataAttributes}
      >
        <BaseCombobox.Value>
          {(selection: string | string[] | null) => {
            // Base UI hands this render prop the root's `value` as-is: an array of ids for a
            // multi-select, the id itself (or `null`) for a single one. Normalising keeps the chips
            // field usable on a single-select root, which otherwise crashed on `.map`.
            const values = Array.isArray(selection) ? selection : selection ? [selection] : [];
            return (
              <>
                {values.map((value) => {
                  const match = selected.find((option) => ctx.getOptionValue(option) === value);
                  const chipLabel = match ? ctx.getOptionLabel(match) : value;
                  return (
                    <BaseCombobox.Chip key={value} aria-label={chipLabel} className={CHIP_CLASSNAME}>
                      {match && renderChip ? renderChip(match) : chipLabel}
                      {/* Base UI only disables chip removal off the root store, so a trigger-level
                          `disabled` has to reach the control itself — otherwise chips stay removable
                          from a field that renders disabled. */}
                      <BaseCombobox.ChipRemove
                        disabled={isDisabled}
                        render={
                          <IconButton
                            variant="ghost"
                            size="xs"
                            disabled={isDisabled}
                            aria-label={`${t("common.remove")} ${chipLabel}`}
                            icon={<PropelIcon icon={<CloseOutline aria-hidden="true" />} />}
                          />
                        }
                      />
                    </BaseCombobox.Chip>
                  );
                })}
                {/* `id` goes on the field, not on the chips frame around it: the frame is a div,
                    and a `<label htmlFor>` pointing at a div focuses nothing. `data-*` stay on the
                    frame, which is the box a tour anchor wants to point at. */}
                <BaseCombobox.Input
                  id={id}
                  disabled={isDisabled}
                  tabIndex={tabIndex}
                  // The field IS the search input on this variant, so `onSearchSubmit`'s Enter
                  // handling belongs here rather than on the popup's `ComboboxSearch`.
                  onKeyDown={ctx.search?.onKeyDown}
                  placeholder={ctx.search?.placeholder}
                  className="h-6 min-w-[10ch] flex-1 bg-transparent text-body-xs-regular outline-none placeholder:text-placeholder"
                />
              </>
            );
          }}
        </BaseCombobox.Value>
      </BaseCombobox.Chips>
    );
  }

  const prepend = typeof prependIcon === "function" ? prependIcon(selected) : prependIcon;
  const append = typeof appendIcon === "function" ? appendIcon(selected) : appendIcon;
  const resolvedLabel = typeof label === "function" ? label(selected) : label;
  const resolvedChildren = typeof children === "function" ? children(selected) : children;

  // `combobox` is not a name-from-content role, so once base-ui mounts, the trigger stops being
  // named by the value it renders. Naming it explicitly — property first, then the selection —
  // gives both states the same announcement instead of "Option 150" before mount and "State" after.
  // These pickers have no visible label element to point `aria-labelledby` at.
  const selectionText = ctx.selected
    .map((option) => ctx.getOptionLabel(option))
    .filter(Boolean)
    .join(", ");
  const propertyName = tooltipOverride?.heading ?? ctx.placeholder;
  const accessibleName = [propertyName, selectionText].filter(Boolean).join(", ") || undefined;

  const chrome = (
    <SelectTriggerChrome
      variant={variant}
      isActive={active}
      className={className}
      prependIcon={prepend}
      appendIcon={append}
      label={resolvedLabel}
      isEmpty={selected.length === 0}
      tabIndex={tabIndex}
      id={id}
      aria-label={accessibleName}
      {...dataAttributes}
    >
      {resolvedChildren}
    </SelectTriggerChrome>
  );

  let button: ReactNode;
  if (!engine?.mounted) {
    // `lazyMount` resting state: no base-ui Root yet, so this is a plain button that mounts it.
    // It announces the popup it will open (`aria-haspopup` + collapsed `aria-expanded`) but stays a
    // button rather than a `combobox`: with no listbox mounted there is no `aria-controls` target,
    // and base-ui takes over the full combobox semantics the moment it activates.
    button = (
      <SelectTriggerChrome
        variant={variant}
        isActive={active}
        className={className}
        prependIcon={prepend}
        appendIcon={append}
        label={resolvedLabel}
        isEmpty={selected.length === 0}
        disabled={isDisabled}
        data-disabled={isDisabled ? "" : undefined}
        tabIndex={tabIndex}
        id={id}
        onClick={engine?.activate}
        aria-label={accessibleName}
        aria-haspopup="listbox"
        aria-expanded={false}
        {...dataAttributes}
      >
        {resolvedChildren}
      </SelectTriggerChrome>
    );
  } else {
    button = <BaseCombobox.Trigger disabled={disabled} render={chrome} />;
  }

  if (!tooltip) return <>{button}</>;
  // Reflect the full selected value (comma-joined) even when the trigger summarises it (e.g. "3 members").
  // Empty selection falls back to the caller's empty label, then the placeholder. The trigger can't be the
  // tooltip trigger directly (base-ui would fight over the same element's props), so wrap it in a <span>.
  // Propel's Tooltip takes one `label` string, so the property-name heading is folded into it.
  const selectedLabels = ctx.selected.map((option) => ctx.getOptionLabel(option)).filter(Boolean);
  const content =
    selectedLabels.length > 0 ? selectedLabels.join(", ") : (tooltipOverride?.emptyContent ?? ctx.placeholder ?? "");
  return (
    <Tooltip label={tooltipOverride?.heading ? `${tooltipOverride.heading}: ${content}` : content} layout="stacked">
      <span className={cn("flex h-full max-w-full min-w-0 items-center", split.isSelectKind && "w-full")}>
        {button}
      </span>
    </Tooltip>
  );
}

SelectTrigger.displayName = "blocks.SelectTrigger";
