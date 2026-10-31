/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { Button } from "@makeplane/propel/components/button";
import { CheckboxField } from "@makeplane/propel/components/checkbox-field";
import { InputField } from "@makeplane/propel/components/input-field";
import { setToast } from "@plane/blocks/toast";
import {
  WEEKDAY_NAMES,
  WORK_MODE_LABELS,
  isWorkingMode,
  rowsFromPlan,
  rowsToPlanDays,
  validatePlanRows,
} from "@plane/services";
import type { TWeeklyPlanRow } from "@plane/services";
import type { TWeeklyPlanDay, TWeeklyPlanPayload, TWeeklyPlanResponse } from "@plane/types";
// local imports
import { getErrorMessage } from "./error-message";

type Props = {
  /** The saved plan. */
  plan: TWeeklyPlanDay[] | undefined;
  /** How many weeks ahead a saved plan is written into the calendar. */
  horizonWeeks: number;
  onSave: (payload: TWeeklyPlanPayload) => Promise<TWeeklyPlanResponse>;
};

const MODES: Exclude<keyof typeof WORK_MODE_LABELS, "LEAVE">[] = ["ONSITE", "REMOTE", "OFF"];

/** Edits the recurring weekly plan: for each weekday, a mode and optional hours. */
export function WeeklyPlanEditor(props: Props) {
  const { plan, horizonWeeks, onSave } = props;
  // states
  const [rows, setRows] = useState<TWeeklyPlanRow[]>(() => rowsFromPlan(plan));
  const [isSaving, setIsSaving] = useState(false);

  const problem = validatePlanRows(rows);

  const update = (weekday: number, patch: Partial<TWeeklyPlanRow>) =>
    setRows((current) => current.map((row) => (row.weekday === weekday ? { ...row, ...patch } : row)));

  const handleSave = async () => {
    if (problem) return;
    setIsSaving(true);
    try {
      const { materialized } = await onSave({ days: rowsToPlanDays(rows) });
      const written = (materialized?.created ?? 0) + (materialized?.updated ?? 0);
      setToast({
        type: "success",
        title: "Weekly plan saved",
        message: `${written} ${written === 1 ? "day" : "days"} updated in your calendar.`,
      });
    } catch (error) {
      setToast({ type: "error", title: "Could not save", message: getErrorMessage(error) });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className="flex flex-col gap-4 rounded-lg border border-subtle bg-surface-1 p-4">
      <div>
        <h2 className="text-h6-medium text-primary">My weekly plan</h2>
        <p className="text-caption-sm-regular text-tertiary">
          Choose what you usually do on each weekday. Saving writes it into your calendar for the next {horizonWeeks}{" "}
          {horizonWeeks === 1 ? "week" : "weeks"}. Days you set by hand are not changed, and neither are days in the
          past.
        </p>
      </div>

      <ul className="divide-y divide-subtle">
        {rows.map((row) => (
          <li key={row.weekday} className="flex flex-wrap items-center gap-3 py-3">
            <div className="w-32 shrink-0">
              <CheckboxField
                size="lg"
                label={WEEKDAY_NAMES[row.weekday]}
                checked={row.enabled}
                onCheckedChange={(checked) => update(row.weekday, { enabled: checked === true })}
              />
            </div>
            {row.enabled ? (
              <>
                <div role="group" aria-label={`${WEEKDAY_NAMES[row.weekday]} work mode`} className="flex gap-2">
                  {MODES.map((mode) => (
                    <Button
                      key={mode}
                      type="button"
                      variant={row.mode === mode ? "primary" : "secondary"}
                      size="sm"
                      stretch="auto"
                      label={WORK_MODE_LABELS[mode]}
                      aria-pressed={row.mode === mode}
                      onClick={() => update(row.weekday, { mode })}
                    />
                  ))}
                </div>
                {isWorkingMode(row.mode) ? (
                  <div className="flex items-center gap-2">
                    <InputField
                      type="time"
                      size="lg"
                      orientation="vertical"
                      aria-label={`${WEEKDAY_NAMES[row.weekday]} start time`}
                      value={row.start}
                      onChange={(event) => update(row.weekday, { start: event.target.value })}
                    />
                    <span className="text-tertiary">–</span>
                    <InputField
                      type="time"
                      size="lg"
                      orientation="vertical"
                      aria-label={`${WEEKDAY_NAMES[row.weekday]} end time`}
                      value={row.end}
                      onChange={(event) => update(row.weekday, { end: event.target.value })}
                    />
                  </div>
                ) : null}
              </>
            ) : (
              <span className="text-caption-sm-regular text-tertiary">Not in the plan</span>
            )}
          </li>
        ))}
      </ul>

      {problem ? <p className="text-caption-sm-regular text-danger-primary">{problem}</p> : null}

      <div>
        <Button
          variant="primary"
          size="sm"
          stretch="auto"
          label="Save weekly plan"
          loading={isSaving}
          disabled={!!problem}
          onClick={handleSave}
        />
      </div>
    </section>
  );
}
