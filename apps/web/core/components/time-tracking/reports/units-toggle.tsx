/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useCallback, useState } from "react";
import { useTranslation } from "@plane/i18n";
import { cn } from "@plane/utils";
import type { TTimeUnits } from "./report-helpers";

const STORAGE_KEY = "time-tracking-report-units";

const readUnits = (): TTimeUnits => {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "decimal" ? "decimal" : "clock";
  } catch {
    return "clock";
  }
};

/** h:mm or decimal hours, remembered per browser. */
export const useTimeUnits = () => {
  const [units, setUnitsState] = useState<TTimeUnits>(readUnits);
  const setUnits = useCallback((value: TTimeUnits) => {
    setUnitsState(value);
    try {
      window.localStorage.setItem(STORAGE_KEY, value);
    } catch {
      // storage unavailable (private mode): keep it for this session only
    }
  }, []);
  return { units, setUnits };
};

export function TimeUnitsToggle({ units, onChange }: { units: TTimeUnits; onChange: (units: TTimeUnits) => void }) {
  const { t } = useTranslation();
  return (
    <div
      className="flex rounded-md border-[0.5px] border-subtle-1 p-0.5 text-13"
      role="group"
      aria-label={t("time-tracking.reports.units")}
    >
      {(["clock", "decimal"] as TTimeUnits[]).map((value) => (
        <button
          key={value}
          type="button"
          aria-pressed={units === value}
          onClick={() => onChange(value)}
          className={cn("rounded px-2 py-0.5 text-secondary", {
            "bg-layer-2 text-primary shadow-raised-100": units === value,
          })}
        >
          {value === "clock" ? t("time-tracking.reports.units_clock") : t("time-tracking.reports.units_decimal")}
        </button>
      ))}
    </div>
  );
}
