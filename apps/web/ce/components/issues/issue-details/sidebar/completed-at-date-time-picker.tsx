/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useRef, useState } from "react";
import { observer } from "mobx-react";
import { Popover } from "@headlessui/react";
import { CalendarDays } from "lucide-react";
// plane imports
import type { Matcher } from "@plane/propel/calendar";
import { Calendar } from "@plane/propel/calendar";
import { cn, renderFormattedDate, renderFormattedTime } from "@plane/utils";
// hooks
import { useUserProfile } from "@/hooks/store/user";

type Props = {
  value: string | null;
  onChange: (isoString: string) => void;
  disabled?: boolean;
};

function toTimeString(date: Date): string {
  return `${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`;
}

/**
 * Combined date + time picker for completed_at field.
 * Shows a popover with a calendar (date) and time input.
 * Calls onChange with the resulting ISO 8601 string.
 */
export const CompletedAtDateTimePicker = observer(function CompletedAtDateTimePicker({
  value,
  onChange,
  disabled = false,
}: Props) {
  const { data } = useUserProfile();
  const startOfWeek = data?.start_of_the_week;
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  const existing = value ? new Date(value) : null;
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(existing ?? undefined);
  const [timeValue, setTimeValue] = useState<string>(existing ? toTimeString(existing) : "00:00");

  // Sync internal state when value prop changes (e.g. after successful save)
  useEffect(() => {
    const updated = value ? new Date(value) : null;
    setSelectedDate(updated ?? undefined);
    setTimeValue(updated ? toTimeString(updated) : "00:00");
  }, [value]);

  const disabledDays: Matcher[] = [];

  const handleApply = (close: () => void): void => {
    if (!selectedDate) return;
    const parts = timeValue.split(":");
    const hours = parseInt(parts[0] ?? "0", 10);
    const minutes = parseInt(parts[1] ?? "0", 10);
    const combined = new Date(selectedDate);
    combined.setHours(isNaN(hours) ? 0 : hours, isNaN(minutes) ? 0 : minutes, 0, 0);
    onChange(combined.toISOString());
    close();
  };

  const displayValue = value ? `${renderFormattedDate(value)} ${renderFormattedTime(value, "12-hour")}` : "Select date";

  return (
    <Popover className="relative">
      {({ close }: { close: () => void }): React.ReactElement => (
        <>
          <Popover.Button
            ref={triggerRef}
            disabled={disabled}
            className={cn(
              "flex items-center gap-1.5 px-2 h-7.5 rounded text-body-xs-regular w-full text-left",
              disabled ? "cursor-default text-secondary-200" : "cursor-pointer text-secondary-200 hover:bg-surface-2"
            )}
          >
            <CalendarDays className="h-3 w-3 flex-shrink-0" />
            <span>{displayValue}</span>
          </Popover.Button>

          <Popover.Panel className="absolute left-0 z-30 mt-1 bg-surface-1 shadow-raised-200 border border-strong rounded-md overflow-hidden p-3 w-max">
            <Calendar
              className="rounded-md"
              captionLayout="dropdown"
              selected={selectedDate}
              defaultMonth={selectedDate}
              onSelect={(date: Date | undefined): void => {
                setSelectedDate(date);
              }}
              showOutsideDays
              initialFocus
              disabled={disabledDays}
              mode="single"
              fixedWeeks
              weekStartsOn={startOfWeek}
            />
            <div className="mt-2 flex items-center gap-2">
              <label htmlFor="completed-at-time" className="text-body-xs-regular text-secondary-200 shrink-0">
                Time
              </label>
              <input
                id="completed-at-time"
                type="time"
                value={timeValue}
                onChange={(e): void => setTimeValue(e.target.value)}
                className="flex-1 rounded border border-strong bg-surface-1 px-2 py-1 text-body-xs-regular text-primary focus:outline-none"
              />
            </div>
            <div className="mt-3 flex justify-end gap-2">
              <button
                type="button"
                onClick={(): void => close()}
                className="rounded px-2.5 py-1 text-body-xs-regular text-secondary-200 hover:bg-surface-2"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!selectedDate}
                onClick={(): void => handleApply(close)}
                className="rounded bg-accent-primary px-2.5 py-1 text-body-xs-regular text-white disabled:opacity-50"
              >
                Apply
              </button>
            </div>
          </Popover.Panel>
        </>
      )}
    </Popover>
  );
});
