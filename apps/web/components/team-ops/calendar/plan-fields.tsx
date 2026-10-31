/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { Button } from "@makeplane/propel/components/button";
import { InputField } from "@makeplane/propel/components/input-field";
import { SelectField } from "@makeplane/propel/components/select-field";
import { TextAreaField } from "@makeplane/propel/components/text-area-field";
import { LEAVE_TYPE_LABELS, WORK_MODE_LABELS, isWorkingMode } from "@plane/services";
import type { TPlanValues } from "@plane/services";
import type { TLeaveType, TWorkMode } from "@plane/types";
// local imports
import { WORK_MODES } from "./work-mode";

const LEAVE_OPTIONS = (Object.keys(LEAVE_TYPE_LABELS) as TLeaveType[]).map((value) => ({
  value,
  label: LEAVE_TYPE_LABELS[value],
}));

type Props = {
  values: TPlanValues;
  onChange: (patch: Partial<TPlanValues>) => void;
  disabled?: boolean;
  /** Problem with the times, shown under them. */
  timesError?: string | null;
};

/** The fields that describe a day's plan: mode, hours, leave type and a note. */
export function PlanFields(props: Props) {
  const { values, onChange, disabled = false, timesError } = props;
  const working = isWorkingMode(values.mode);

  return (
    <div className="flex flex-col gap-3">
      <div role="group" aria-label="Work mode" className="grid grid-cols-2 gap-2">
        {WORK_MODES.map((mode: TWorkMode) => (
          <Button
            key={mode}
            type="button"
            variant={values.mode === mode ? "primary" : "secondary"}
            size="sm"
            stretch="full"
            label={WORK_MODE_LABELS[mode]}
            aria-pressed={values.mode === mode}
            disabled={disabled}
            onClick={() => onChange({ mode })}
          />
        ))}
      </div>

      {working ? (
        <div className="grid grid-cols-2 gap-3">
          <InputField
            type="time"
            size="lg"
            orientation="vertical"
            label="Start time"
            value={values.start}
            disabled={disabled}
            onChange={(event) => onChange({ start: event.target.value })}
            error={timesError ?? undefined}
          />
          <InputField
            type="time"
            size="lg"
            orientation="vertical"
            label="End time"
            value={values.end}
            disabled={disabled}
            onChange={(event) => onChange({ end: event.target.value })}
          />
        </div>
      ) : null}

      {values.mode === "LEAVE" ? (
        <SelectField
          size="lg"
          label="Leave type"
          options={LEAVE_OPTIONS}
          value={values.leaveType}
          disabled={disabled}
          onValueChange={(value) => value && onChange({ leaveType: value as TLeaveType })}
        />
      ) : null}

      <TextAreaField
        size="lg"
        resize="none"
        autoResize
        maxRows={6}
        value={values.description}
        disabled={disabled}
        onChange={(event) => onChange({ description: event.target.value })}
        placeholder="Add a note (optional)"
        aria-label="Note"
        maxLength={2000}
      />
    </div>
  );
}
