/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { format } from "date-fns";
import { Calendar } from "@makeplane/propel/components/calendar";
import type { DateSelectCommonProps } from "./date-select-shell";
import { DateSelectShell } from "./date-select-shell";
import { buildDisabledMatchers, DEFAULT_DATE_FORMAT_TOKEN } from "./date-select.utils";

export type DateSelectProps = DateSelectCommonProps & {
  /** The picked day, or `null` when nothing is set. */
  value: Date | null;
  /** Emits the newly picked day, or `null` when cleared. */
  onChange: (date: Date | null) => void;
};

/**
 * Presentational, data-source-agnostic single-day picker: the `Select` trigger chrome over a propel
 * `Calendar` in a popover. The client owns the value and supplies the user's `weekStartsOn` and
 * `formatToken` — this block owns only the picker.
 */
export function DateSelect(props: DateSelectProps) {
  const {
    value,
    onChange,
    formatToken = DEFAULT_DATE_FORMAT_TOKEN,
    minDate,
    maxDate,
    weekStartsOn,
    defaultMonth,
    placeholder = "",
    clearable = false,
    onClose,
  } = props;
  // states
  const [isOpen, setIsOpen] = useState(props.defaultOpen ?? false);
  // derived values
  const formatted = value ? format(value, formatToken) : "";
  const disabledMatchers = buildDisabledMatchers(minDate, maxDate);

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) onClose?.();
  };

  return (
    <DateSelectShell
      {...props}
      isOpen={isOpen}
      onOpenChange={handleOpenChange}
      label={formatted || placeholder}
      isEmpty={!value}
      tooltipContent={props.tooltipContent ?? formatted}
      canClear={clearable && value !== null}
      onClear={() => {
        onChange(null);
        handleOpenChange(false);
      }}
    >
      <Calendar
        mode="single"
        selected={value ?? undefined}
        defaultMonth={value ?? defaultMonth}
        disabled={disabledMatchers}
        weekStartsOn={weekStartsOn}
        onSelect={(date) => {
          // A repeat click on the selected day deselects it in react-day-picker; treat that as a
          // clear only when the caller allows one, otherwise keep the current value.
          if (!date && !clearable) return;
          onChange(date ?? null);
          handleOpenChange(false);
        }}
      />
    </DateSelectShell>
  );
}

DateSelect.displayName = "blocks.DateSelect";
