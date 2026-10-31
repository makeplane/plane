/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { Button } from "@makeplane/propel/components/button";
import { CheckboxField } from "@makeplane/propel/components/checkbox-field";
import {
  DialogActions,
  DialogBody,
  DialogHeader,
  DialogHeading,
  DialogMain,
  DialogTitle,
} from "@makeplane/propel/components/dialog";
import { InputField } from "@makeplane/propel/components/input-field";
import { setToast } from "@plane/blocks/toast";
import { ISO_WEEKDAYS, PLAN_NOTICE, WEEKDAY_NAMES, addDays, toDayPayload, validatePlanTimes } from "@plane/services";
import type { TPlanValues } from "@plane/services";
import type { TCalendarBulkPayload, TCalendarBulkResponse } from "@plane/types";
// local imports
import { getErrorMessage } from "./error-message";
import { PlanFields } from "./plan-fields";

type Props = {
  /** First day offered, `YYYY-MM-DD`. */
  initialFrom: string;
  onApply: (payload: TCalendarBulkPayload) => Promise<TCalendarBulkResponse>;
  onClose: () => void;
};

const WORKDAYS = [1, 2, 3, 4, 5];

/** Apply one plan to every chosen weekday between two dates. */
export function ApplyRangeDialog(props: Props) {
  const { initialFrom, onApply, onClose } = props;
  // states
  const [from, setFrom] = useState(initialFrom);
  const [to, setTo] = useState(addDays(initialFrom, 6));
  const [weekdays, setWeekdays] = useState<number[]>(WORKDAYS);
  const [values, setValues] = useState<TPlanValues>({
    mode: "ONSITE",
    start: "09:00",
    end: "17:00",
    leaveType: "ANNUAL",
    description: "",
  });
  const [isSaving, setIsSaving] = useState(false);

  const timesError = validatePlanTimes(values.mode, values.start, values.end);
  const rangeError =
    !from || !to
      ? "Choose a start and an end date."
      : to < from
        ? "The end date must not be before the start date."
        : null;
  const canSubmit = !timesError && !rangeError && weekdays.length > 0;

  const toggleWeekday = (weekday: number) =>
    setWeekdays((current) =>
      ISO_WEEKDAYS.filter((day) => (day === weekday ? !current.includes(day) : current.includes(day)))
    );

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setIsSaving(true);
    try {
      const result = await onApply({ ...toDayPayload(values), start_date: from, end_date: to, weekdays });
      const changed = result.created + result.updated;
      const skipped = result.skipped_dates.length;
      setToast({
        type: skipped > 0 ? "warning" : "success",
        title: `${changed} ${changed === 1 ? "day" : "days"} saved`,
        message: skipped > 0 ? `${skipped} past ${skipped === 1 ? "day was" : "days were"} skipped.` : "",
      });
      onClose();
    } catch (error) {
      setToast({ type: "error", title: "Could not save", message: getErrorMessage(error) });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <DialogMain>
        <DialogHeader>
          <DialogHeading>
            <DialogTitle>Fill several days with one plan</DialogTitle>
          </DialogHeading>
        </DialogHeader>
        <DialogBody tabIndex={0}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <InputField
                type="date"
                size="lg"
                orientation="vertical"
                label="From"
                value={from}
                onChange={(event) => setFrom(event.target.value)}
              />
              <InputField
                type="date"
                size="lg"
                orientation="vertical"
                label="To"
                value={to}
                onChange={(event) => setTo(event.target.value)}
                error={rangeError ?? undefined}
              />
            </div>
            <fieldset className="flex flex-wrap gap-x-4 gap-y-2">
              <legend className="mb-1 text-body-xs-medium text-secondary">Apply on</legend>
              {ISO_WEEKDAYS.map((weekday) => (
                <CheckboxField
                  key={weekday}
                  size="lg"
                  label={WEEKDAY_NAMES[weekday].slice(0, 3)}
                  checked={weekdays.includes(weekday)}
                  onCheckedChange={() => toggleWeekday(weekday)}
                />
              ))}
            </fieldset>
            <PlanFields
              values={values}
              onChange={(patch) => setValues((current) => ({ ...current, ...patch }))}
              disabled={isSaving}
              timesError={timesError}
            />
            <p className="text-caption-sm-regular text-tertiary">
              Days you changed by hand are replaced. Days in the past that you can no longer change are skipped.{" "}
              {PLAN_NOTICE}
            </p>
          </div>
        </DialogBody>
      </DialogMain>
      <DialogActions>
        <Button variant="secondary" size="sm" stretch="auto" label="Cancel" onClick={onClose} />
        <Button
          variant="primary"
          size="sm"
          stretch="auto"
          label="Apply"
          loading={isSaving}
          disabled={!canSubmit}
          onClick={handleSubmit}
        />
      </DialogActions>
    </div>
  );
}
