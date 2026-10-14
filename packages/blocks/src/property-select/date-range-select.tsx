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

/** Both ends of the picked range. Either end may be unset. */
export type DateRangeValue = {
  from: Date | null;
  to: Date | null;
};

export type DateRangeSelectProps = DateSelectCommonProps & {
  value: DateRangeValue;
  /**
   * Emits the completed range — both ends at once, on the second click. The first click only opens
   * the range (it is held internally and shown in the calendar, but not emitted), so a caller never
   * has to persist a half-picked range. A one-day range comes through as `from === to`. Clearing
   * emits `{ from: null, to: null }`.
   */
  onChange: (range: DateRangeValue) => void;
  /**
   * Collapses the trigger label to the shared parts of the two dates — "Jun 10 - 24, 2025" for a
   * range inside one month, "Jan 24 - Feb 02, 2025" inside one year — instead of repeating the
   * whole date twice. Honoured for the four `formatToken` values Plane ships (`MMM dd, yyyy`,
   * `dd/MM/yyyy`, `MM/dd/yyyy`, `yyyy/MM/dd` — see `MERGE_TOKENS`); any other token keeps the whole
   * label on both ends. Ignored when {@link formatLabel} is given. @default false
   */
  mergeDates?: boolean;
  /**
   * Full control of the trigger label. Receives the committed range and both ends already formatted
   * with `formatToken`; return the string the trigger should show. Wins over {@link mergeDates}.
   */
  formatLabel?: (range: DateRangeValue, formatted: { from: string; to: string }) => string;
};

/** The tokens each end is formatted with, for one of the two merge cases. */
type MergeTokenPair = { from: string; to: string };

/**
 * How the merged label is built, per date format Plane ships (`TDateAttributeDisplayOptions` in
 * `packages/types/src/work-item-types/work-item-property-configurations.ts`). The parts the two
 * dates share are printed once, at whichever end of the token they sit:
 *
 * | `formatToken`  | same year, other month  | same month            |
 * | -------------- | ----------------------- | --------------------- |
 * | `MMM dd, yyyy` | `Jan 24 - Feb 02, 2025` | `Jun 10 - 24, 2025`   |
 * | `dd/MM/yyyy`   | `24/01 - 02/02/2025`    | `10 - 24/06/2025`     |
 * | `MM/dd/yyyy`   | `01/24 - 02/02/2025`    | `06/10 - 24/2025`     |
 * | `yyyy/MM/dd`   | `2025/01/24 - 02/02`    | `2025/06/10 - 24`     |
 *
 * Hand-written per token rather than derived by trimming segments off the caller's own token:
 * a regex that strips `y+` or `M+` with its separator leaves dangling and doubled slashes in every
 * token but the first ("dd/MM/yyyy" became "10/06/ - 24//2025"). An unlisted token keeps the whole
 * label on both ends.
 */
const MERGE_TOKENS: Record<string, { sameYear: MergeTokenPair; sameMonth: MergeTokenPair }> = {
  "MMM dd, yyyy": { sameYear: { from: "MMM dd", to: "MMM dd, yyyy" }, sameMonth: { from: "MMM dd", to: "dd, yyyy" } },
  "dd/MM/yyyy": { sameYear: { from: "dd/MM", to: "dd/MM/yyyy" }, sameMonth: { from: "dd", to: "dd/MM/yyyy" } },
  "MM/dd/yyyy": { sameYear: { from: "MM/dd", to: "MM/dd/yyyy" }, sameMonth: { from: "MM/dd", to: "dd/yyyy" } },
  "yyyy/MM/dd": { sameYear: { from: "yyyy/MM/dd", to: "MM/dd" }, sameMonth: { from: "yyyy/MM/dd", to: "dd" } },
};

/**
 * The merged label: drop from one end whatever the other repeats. Two days in one month give
 * "Jun 10 - 24, 2025"; two months in one year give "Jan 24 - Feb 02, 2025"; anything wider — or any
 * `formatToken` outside {@link MERGE_TOKENS} — stays whole.
 */
function mergeRangeLabel(range: DateRangeValue, from: string, to: string, formatToken: string): string {
  const joined = from && to ? `${from} - ${to}` : from || to;
  if (!range.from || !range.to || !from || !to) return joined;
  if (range.from.getFullYear() !== range.to.getFullYear()) return joined;
  const tokens = MERGE_TOKENS[formatToken];
  if (!tokens) return joined;
  const pair = range.from.getMonth() === range.to.getMonth() ? tokens.sameMonth : tokens.sameYear;
  return `${format(range.from, pair.from)} - ${format(range.to, pair.to)}`;
}

/**
 * Presentational, data-source-agnostic range picker: the `Select` trigger chrome over a propel
 * `Calendar` in range mode. Propel's `Calendar` drops react-day-picker's `numberOfMonths` (its
 * styled contract covers one month), so the panel shows a single month and the user pages through
 * it — the two-month side-by-side layout needs the upstream prop before it can come back.
 */
export function DateRangeSelect(props: DateRangeSelectProps) {
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
  // react-day-picker answers the FIRST click of a range with `{ from: day, to: day }`, which is
  // indistinguishable from a finished one-day range. The half-picked range is held here — shown in
  // the calendar, withheld from `onChange` — until the second click completes it, so a caller never
  // sees a range it did not ask for.
  const [draft, setDraft] = useState<DateRangeValue | null>(null);
  // derived values
  const from = value.from ? format(value.from, formatToken) : "";
  const to = value.to ? format(value.to, formatToken) : "";
  const joined = from && to ? `${from} - ${to}` : from || to;
  const formatted = props.formatLabel
    ? props.formatLabel(value, { from, to })
    : props.mergeDates
      ? mergeRangeLabel(value, from, to, formatToken)
      : joined;
  const isEmpty = !value.from && !value.to;
  const disabledMatchers = buildDisabledMatchers(minDate, maxDate);
  // The calendar shows the in-progress pick; the trigger keeps showing the committed value.
  const shown = draft ?? value;

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    setDraft(null);
    if (!open) onClose?.();
  };

  return (
    <DateSelectShell
      {...props}
      isOpen={isOpen}
      onOpenChange={handleOpenChange}
      label={formatted || placeholder}
      isEmpty={isEmpty}
      tooltipContent={props.tooltipContent ?? joined}
      canClear={clearable && !isEmpty}
      onClear={() => {
        onChange({ from: null, to: null });
        handleOpenChange(false);
      }}
    >
      <Calendar
        mode="range"
        selected={shown.from ? { from: shown.from, to: shown.to ?? undefined } : undefined}
        defaultMonth={value.from ?? defaultMonth}
        disabled={disabledMatchers}
        weekStartsOn={weekStartsOn}
        onSelect={(range) => {
          const next = { from: range?.from ?? null, to: range?.to ?? null };
          // Deselecting the open end restarts the range without emitting.
          if (!next.from) {
            setDraft(null);
            return;
          }
          if (draft) {
            // Second click: the range is complete, so commit it and close (which clears the draft).
            onChange(next);
            handleOpenChange(false);
            return;
          }
          // First click: react-day-picker's `to === from` is not a finished range, it is the open
          // end waiting for the next click.
          setDraft({ from: next.from, to: null });
        }}
      />
    </DateSelectShell>
  );
}

DateRangeSelect.displayName = "blocks.DateRangeSelect";
