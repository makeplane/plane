/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useMemo, useState } from "react";
import { observer } from "mobx-react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { IDayOverride, IHoliday } from "@plane/types";
import { Button } from "@plane/propel/button";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { cn } from "@plane/utils";
import { useBusinessCalendar } from "@/hooks/store";
import type { CellState } from "./calendar-cell-helper";
import { computeMonthStats, getMonthHolidays, getMonthOverrides } from "./calendar-stats-helper";
import { DayOverrideFormModal } from "./day-override-form-modal";
import { HolidayFormModal } from "./holiday-form-modal";
import { MonthGrid } from "./month-grid";
import { MonthLists, MonthSummaryCard } from "./month-summary-lists";

const OVERRIDE_LABEL: Record<IDayOverride["type"], string> = {
  WORKDAY: "Make-up workday",
  HOLIDAY: "Make-up day off",
};

type ModalMode = "holiday" | "override" | null;
type Props = { scheduleId: string };

export const MonthOverview = observer(function MonthOverview({ scheduleId }: Props) {
  const { schedulesMap, fetchHolidays, fetchOverrides, getHolidaysForYear, getOverridesForYear } =
    useBusinessCalendar();
  const [current, setCurrent] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [editHoliday, setEditHoliday] = useState<IHoliday | null>(null);
  const [editOverride, setEditOverride] = useState<IDayOverride | null>(null);
  const [defaultDate, setDefaultDate] = useState<string>("");

  const year = current.getFullYear();
  const month = current.getMonth();

  useEffect(() => {
    fetchHolidays(scheduleId, year).catch(() => setToast({ type: TOAST_TYPE.ERROR, title: "Failed to load holidays" }));
    fetchOverrides(scheduleId, year).catch(() =>
      setToast({ type: TOAST_TYPE.ERROR, title: "Failed to load overrides" })
    );
  }, [scheduleId, year, fetchHolidays, fetchOverrides]);

  const schedule = schedulesMap[scheduleId];
  const holidays = getHolidaysForYear(scheduleId, year);
  const overrides = getOverridesForYear(scheduleId, year);
  const weekPattern = schedule?.week_pattern;

  const monthStats = useMemo(
    () => computeMonthStats(year, month, holidays, overrides, weekPattern),
    [year, month, holidays, overrides, weekPattern]
  );
  const monthHolidays = useMemo(() => getMonthHolidays(year, month, holidays), [year, month, holidays]);
  const monthOverrides = useMemo(() => getMonthOverrides(year, month, overrides), [year, month, overrides]);

  if (!schedule) return null;

  const monthLabel = current.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  const shiftMonth = (delta: number) => setCurrent(new Date(year, month + delta, 1));
  const goToday = () => {
    const d = new Date();
    setCurrent(new Date(d.getFullYear(), d.getMonth(), 1));
  };

  const handleCellClick = (date: string, state: CellState) => {
    setDefaultDate(date);
    if (state === "holiday") {
      setEditHoliday(holidays.find((h) => h.date === date) ?? null);
      setModalMode("holiday");
    } else if (state === "override-workday" || state === "override-holiday") {
      setEditOverride(overrides.find((o) => o.date === date) ?? null);
      setModalMode("override");
    } else if (state === "weekend") {
      setEditOverride(null);
      setModalMode("override");
    } else {
      setEditHoliday(null);
      setEditOverride(null);
      setModalMode("holiday");
    }
  };

  const cellLabel = (state: CellState, dateStr: string): string => {
    if (state === "holiday") return holidays.find((h) => h.date === dateStr)?.name ?? "";
    if (state === "override-workday" || state === "override-holiday") {
      const ov = overrides.find((o) => o.date === dateStr);
      return ov?.reason || (ov ? OVERRIDE_LABEL[ov.type] : "");
    }
    return "";
  };

  return (
    <div className="space-y-6">
      <MonthSummaryCard monthLabel={monthLabel} stats={monthStats} overrideCount={monthOverrides.length} />

      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={() => shiftMonth(-1)}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-h6-semibold text-primary min-w-40 text-center">{monthLabel}</span>
          <Button variant="secondary" size="sm" onClick={() => shiftMonth(1)}>
            <ChevronRight className="w-4 h-4" />
          </Button>
          <Button variant="secondary" size="sm" onClick={goToday}>
            Today
          </Button>
        </div>
        <div className="flex items-center gap-3 text-caption-sm-regular text-secondary">
          <Legend swatch="bg-danger-subtle" label="Holiday" />
          <Legend swatch="bg-warning-subtle border border-dashed border-warning-strong" label="Make-up workday" />
          <Legend swatch="bg-success-subtle border border-dashed border-success-strong" label="Make-up day off" />
        </div>
      </div>

      <MonthGrid
        year={year}
        month={month}
        holidays={holidays}
        overrides={overrides}
        weekPattern={weekPattern}
        cellLabel={cellLabel}
        onCellClick={handleCellClick}
      />

      <MonthLists monthLabel={monthLabel} holidays={monthHolidays} overrides={monthOverrides} />

      <HolidayFormModal
        scheduleId={scheduleId}
        open={modalMode === "holiday"}
        onClose={() => {
          setModalMode(null);
          setEditHoliday(null);
        }}
        editHoliday={editHoliday}
        defaultDate={defaultDate}
      />
      <DayOverrideFormModal
        scheduleId={scheduleId}
        open={modalMode === "override"}
        onClose={() => {
          setModalMode(null);
          setEditOverride(null);
        }}
        editOverride={editOverride}
        defaultDate={defaultDate}
      />
    </div>
  );
});

const Legend = ({ swatch, label }: { swatch: string; label: string }) => (
  <span className="flex items-center gap-1">
    <span className={cn("w-3 h-3 rounded inline-block", swatch)} />
    {label}
  </span>
);
