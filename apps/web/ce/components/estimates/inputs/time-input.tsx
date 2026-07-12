/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useRef, useState } from "react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { convertHoursMinutesToMinutes, convertMinutesToHoursAndMinutes } from "@plane/utils";

export type TEstimateTimeInputProps = {
  value?: number;
  handleEstimateInputValue: (value: string) => void;
};

type TTimeFields = {
  hours: string;
  minutes: string;
};

// the estimate point value is stored in minutes; empty/zero durations render as empty fields
const getFieldsFromMinutes = (totalMinutes?: number): TTimeFields => {
  if (totalMinutes === undefined || !Number.isFinite(totalMinutes) || totalMinutes <= 0) {
    return { hours: "", minutes: "" };
  }
  const { hours, minutes } = convertMinutesToHoursAndMinutes(totalMinutes);
  return {
    hours: hours > 0 ? String(hours) : "",
    minutes: minutes > 0 ? String(minutes) : "",
  };
};

const sanitizeHours = (raw: string): string => raw.replace(/\D/g, "").slice(0, 4);

const sanitizeMinutes = (raw: string): string => {
  const digits = raw.replace(/\D/g, "").slice(0, 2);
  if (digits === "") return "";
  return String(Math.min(59, Number(digits)));
};

export function EstimateTimeInput(props: TEstimateTimeInputProps) {
  const { value, handleEstimateInputValue } = props;
  // i18n
  const { t } = useTranslation();
  // states (seeded from the incoming minutes value)
  const [hours, setHours] = useState<string>(() => getFieldsFromMinutes(value).hours);
  const [minutes, setMinutes] = useState<string>(() => getFieldsFromMinutes(value).minutes);
  // ref tracking the last value we emitted, so external value changes re-seed the fields
  // (the parent seeds its estimate value asynchronously, e.g. when editing an existing point)
  const lastEmittedValueRef = useRef<number | undefined>(value);

  useEffect(() => {
    if (value === lastEmittedValueRef.current) return;
    const fields = getFieldsFromMinutes(value);
    setHours(fields.hours);
    setMinutes(fields.minutes);
    lastEmittedValueRef.current = value;
  }, [value]);

  const handleFieldChange = (field: keyof TTimeFields, rawValue: string) => {
    const nextHours = field === "hours" ? sanitizeHours(rawValue) : hours;
    const nextMinutes = field === "minutes" ? sanitizeMinutes(rawValue) : minutes;
    setHours(nextHours);
    setMinutes(nextMinutes);

    const totalMinutes = convertHoursMinutesToMinutes(Number(nextHours) || 0, Number(nextMinutes) || 0);
    lastEmittedValueRef.current = totalMinutes > 0 ? totalMinutes : undefined;
    handleEstimateInputValue(totalMinutes > 0 ? String(totalMinutes) : "");
  };

  return (
    <div className="flex w-full items-center gap-1 px-2 text-13">
      <input
        aria-label={t("worklog.hours")}
        value={hours}
        onChange={(e) => handleFieldChange("hours", e.target.value)}
        className="w-10 min-w-0 border-none bg-transparent py-2 text-13 focus:border-0 focus:ring-0 focus:outline-none"
        placeholder="0"
        inputMode="numeric"
        autoFocus
      />
      <span className="text-tertiary select-none">h</span>
      <input
        aria-label={t("worklog.minutes")}
        value={minutes}
        onChange={(e) => handleFieldChange("minutes", e.target.value)}
        className="w-10 min-w-0 border-none bg-transparent py-2 text-13 focus:border-0 focus:ring-0 focus:outline-none"
        placeholder="0"
        inputMode="numeric"
      />
      <span className="text-tertiary select-none">m</span>
    </div>
  );
}
