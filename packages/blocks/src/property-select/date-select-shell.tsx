/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { ReactNode } from "react";
import { useTranslation } from "@plane/i18n";
import { Button } from "@makeplane/propel/components/button";
import { Popover, PopoverBody, PopoverContent, PopoverTrigger } from "@makeplane/propel/components/popover";
import type { PopoverContentProps } from "@makeplane/propel/components/popover";
import { Tooltip } from "@makeplane/propel/components/tooltip";
import type { IconElement } from "../types/icon";
import { cn } from "@plane/utils";
import type { SelectVariant } from "../select/types";
import { SelectTriggerChrome } from "../select/trigger-chrome";
import { splitSelectVariant } from "../select/utils";

/** Popover placement axes, taken straight off propel's own `PopoverContent`. */
export type PopoverSide = NonNullable<PopoverContentProps["side"]>;
export type PopoverAlign = NonNullable<PopoverContentProps["align"]>;

/** First day of the week, `date-fns` / react-day-picker numbering. The app wrapper supplies the user's profile value. */
export type WeekStart = 0 | 1 | 2 | 3 | 4 | 5 | 6;

/** Everything both date pickers take, minus their own value/selection shape. */
export type DateSelectCommonProps = {
  /** Trigger chrome — the same `SelectVariant` scale the property selects use. */
  variant: SelectVariant;
  /** Shown on the trigger while nothing is picked. */
  placeholder?: string;
  /** Earliest selectable day (inclusive). */
  minDate?: Date;
  /** Latest selectable day (inclusive). */
  maxDate?: Date;
  disabled?: boolean;
  /** Adds a "Clear" action under the calendar once something is picked. */
  clearable?: boolean;
  /** `date-fns` format token for the trigger label. The app wrapper supplies the user's preference. */
  formatToken?: string;
  /** @see WeekStart */
  weekStartsOn?: WeekStart;
  /** Month shown on open while nothing is picked. Defaults to the current month. */
  defaultMonth?: Date;
  /** Leading icon on the trigger. */
  icon?: IconElement;
  /** Escape hatch merged onto the trigger button after the variant classes. */
  className?: string;
  /** value-agnostic e2e selector — forwarded to the trigger button as data-testid */
  testId?: string;
  /** Applies the active/open chrome. Defaults to the popover's own open state. */
  isActive?: boolean;
  /** Opt-in hover tooltip on the trigger: heading + the formatted selection. */
  showTooltip?: boolean;
  /** Tooltip heading — the property name. The caller supplies the already-translated string. */
  tooltipHeading?: string;
  /** Tooltip content shown when nothing is picked. Defaults to the placeholder. */
  tooltipEmptyContent?: string;
  /** Copy for the footer clear action. The caller supplies the already-translated string. */
  clearLabel?: string;
  /** Fired when the popover closes. */
  onClose?: () => void;
  /**
   * Tab order of the trigger button. For forms that sequence focus explicitly (the work item and
   * intake create modals order every control through `ETabIndices`).
   */
  tabIndex?: number;
  /** Opens the calendar on mount. Uncontrolled after that. */
  defaultOpen?: boolean;
  /** Which side of the trigger the calendar opens toward. @default "bottom" */
  side?: PopoverSide;
  /** Alignment of the calendar relative to the trigger along `side`. @default "start" */
  align?: PopoverAlign;
  /**
   * Overrides the tooltip's value line, which otherwise shows the formatted selection — for a
   * trigger that summarises what the tooltip should spell out (e.g. a cycle's full date range).
   * Only read when `showTooltip` is set.
   */
  tooltipContent?: string;
};

type DateSelectShellProps = DateSelectCommonProps & {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  /** Formatted trigger text, or the placeholder when nothing is picked. */
  label: string;
  isEmpty: boolean;
  /** Full selection text for the tooltip — usually the same as `label`. */
  tooltipContent: string;
  /** Whether the footer clear action is offered. */
  canClear: boolean;
  onClear: () => void;
  /** The calendar. */
  children: ReactNode;
};

/**
 * The trigger + popover shell both date pickers share: a `SelectVariant` trigger (the same chrome
 * `Select.Trigger` wears), a popover holding the calendar, and an optional ghost "Clear" footer.
 */
export function DateSelectShell(props: DateSelectShellProps) {
  const {
    variant,
    disabled = false,
    icon,
    className,
    testId,
    isActive,
    showTooltip = false,
    tooltipHeading,
    tooltipEmptyContent,
    placeholder,
    clearLabel,
    tabIndex,
    side = "bottom",
    align = "start",
    isOpen,
    onOpenChange,
    label,
    isEmpty,
    tooltipContent,
    canClear,
    onClear,
    children,
  } = props;
  // translation
  const { t } = useTranslation();
  // derived values
  const split = splitSelectVariant(variant);
  const active = isActive ?? isOpen;

  const trigger = (
    <PopoverTrigger
      disabled={disabled}
      data-testid={testId}
      render={
        <SelectTriggerChrome
          variant={variant}
          isActive={active}
          className={className}
          prependIcon={icon}
          label={label}
          isEmpty={isEmpty}
          tabIndex={tabIndex}
        >
          <span className="min-w-0 grow truncate text-left">{label}</span>
        </SelectTriggerChrome>
      }
    />
  );

  return (
    <Popover open={isOpen} onOpenChange={onOpenChange}>
      {showTooltip ? (
        // Propel's Tooltip takes one `label` string, so the property-name heading is folded into it.
        <Tooltip
          label={
            tooltipHeading
              ? `${tooltipHeading}: ${tooltipContent || (tooltipEmptyContent ?? placeholder ?? "")}`
              : tooltipContent || (tooltipEmptyContent ?? placeholder ?? "")
          }
          layout="stacked"
        >
          <span className={cn("flex h-full max-w-full min-w-0 items-center", split.isSelectKind && "w-full")}>
            {trigger}
          </span>
        </Tooltip>
      ) : (
        trigger
      )}
      <PopoverContent variant="rich" side={side} align={align}>
        <PopoverBody tabIndex={0}>{children}</PopoverBody>
        {canClear ? (
          <div className="flex justify-end border-t border-subtle pt-2">
            <Button
              variant="ghost"
              size="xs"
              stretch="auto"
              label={clearLabel ?? t("common.clear")}
              onClick={onClear}
            />
          </div>
        ) : null}
      </PopoverContent>
    </Popover>
  );
}

DateSelectShell.displayName = "blocks.DateSelectShell";
