/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useCallback, useRef } from "react";
import { observer } from "mobx-react";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { IWorkSchedule } from "@plane/types";
import { cn } from "@plane/utils";
import { useBusinessCalendar } from "@/hooks/store";

// Index matches backend week_pattern boolean array: Mon=0 … Sun=6
const WEEKDAY_LABELS: { label: string; full: string }[] = [
  { label: "Mon", full: "Monday" },
  { label: "Tue", full: "Tuesday" },
  { label: "Wed", full: "Wednesday" },
  { label: "Thu", full: "Thursday" },
  { label: "Fri", full: "Friday" },
  { label: "Sat", full: "Saturday" },
  { label: "Sun", full: "Sunday" },
];

type Props = { schedule: IWorkSchedule };

export const WorkweekToggle = observer(function WorkweekToggle({ schedule }: Props) {
  const { updateSchedule } = useBusinessCalendar();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleToggle = useCallback(
    (index: number, enabled: boolean) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);

      // Build a new boolean[7] array with the toggled index
      const next = [...schedule.week_pattern] as boolean[];
      next[index] = enabled;

      debounceRef.current = setTimeout(() => {
        void updateSchedule(schedule.id, { week_pattern: next }).catch(() => {
          setToast({ type: TOAST_TYPE.ERROR, title: "Failed to update schedule" });
        });
      }, 300);
    },
    [schedule, updateSchedule]
  );

  return (
    <div className="space-y-3">
      <p className="text-body-sm-regular text-secondary">Toggle working days. Changes auto-save after 300ms.</p>
      <div className="flex w-full gap-2">
        {WEEKDAY_LABELS.map(({ label, full }, index) => {
          const isActive = Boolean(schedule.week_pattern[index]);
          return (
            <button
              key={index}
              type="button"
              aria-label={full}
              aria-pressed={isActive}
              onClick={() => handleToggle(index, !isActive)}
              className={cn(
                "flex-1 px-3 py-2 rounded-md border text-body-sm-medium text-center transition-colors cursor-pointer select-none",
                isActive
                  ? "bg-accent-primary text-on-color border-accent-strong hover:bg-accent-strong"
                  : "bg-surface-2 text-tertiary line-through border-subtle hover:bg-accent-subtle"
              )}
            >
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
});
