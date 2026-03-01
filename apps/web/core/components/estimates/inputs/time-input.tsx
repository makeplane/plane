/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import { useMemo } from "react";
import { Input } from "@plane/ui";
import { convertMinutesToHoursAndMinutes, convertHoursMinutesToMinutes } from "@plane/utils";

type TEstimateTimeInputProps = {
  value?: number;
  handleEstimateInputValue: (value: string) => void;
};

export function EstimateTimeInput(props: TEstimateTimeInputProps) {
  const { value, handleEstimateInputValue } = props;

  const { hours, minutes } = useMemo(() => convertMinutesToHoursAndMinutes(value || 0), [value]);

  const onChange = (key: "hours" | "minutes", value: number) => {
    const _minutes =
      key === "hours"
        ? convertHoursMinutesToMinutes(value, minutes || 0)
        : convertHoursMinutesToMinutes(hours || 0, value);

    handleEstimateInputValue(_minutes.toString());
  };
  return (
    <>
      <div className="flex items-center w-full">
        {/* hours */}
        <Input
          id="estimate-hours"
          type="number"
          name="hours"
          placeholder="Hours"
          className="w-full border-none outline-none"
          autoFocus
          min={0}
          step="any"
          value={hours || ""}
          onChange={(e) => onChange("hours", parseInt(e.target.value))}
        />
        {/* minutes */}
        <Input
          id="estimate-minutes"
          type="number"
          name="minutes"
          placeholder="Minutes"
          className="w-full border-0 border-l rounded-none"
          min={0}
          value={minutes || ""}
          onChange={(e) => onChange("minutes", parseInt(e.target.value))}
        />
      </div>
    </>
  );
}
