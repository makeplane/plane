/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useMemo, useState } from "react";
import { observer } from "mobx-react";
import { ChevronLeft, ChevronRight, Copy } from "lucide-react";
import type { IDayOverride, IHoliday } from "@plane/types";
import { Button } from "@plane/propel/button";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { useBusinessCalendar } from "@/hooks/store";
import type { CellState } from "./calendar-cell-helper";
import { computeMonthStats, computeYearStats, getMonthHolidays } from "./calendar-stats-helper";
import { CopyYearModal } from "./copy-year-modal";
import { DayOverrideFormModal } from "./day-override-form-modal";
import { DayOverridesTable } from "./day-overrides-table";
import { HolidayFormModal } from "./holiday-form-modal";
import { HolidaysMonthGrid } from "./holidays-month-grid";
import { YearStatsCard } from "./year-stats-card";

type ModalMode = "holiday" | "override" | null;

type Props = { scheduleId: string };

export const HolidaysYearView = observer(function HolidaysYearView({ scheduleId }: Props) {
  const { schedulesMap, fetchHolidays, fetchOverrides, getHolidaysForYear, getOverridesForYear } =
    useBusinessCalendar();
  const [year, setYear] = useState(new Date().getFullYear());
  const [copyOpen, setCopyOpen] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [editHoliday, setEditHoliday] = useState<IHoliday | null>(null);
  const [editOverride, setEditOverride] = useState<IDayOverride | null>(null);
  const [defaultDate, setDefaultDate] = useState<string>("");

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

  const yearStats = useMemo(
    () => computeYearStats(year, holidays, overrides, weekPattern),
    [year, holidays, overrides, weekPattern]
  );

  if (!schedule) return null;

  const handleCellClick = (date: string, state: CellState) => {
    setDefaultDate(date);
    if (state === "holiday") {
      const h = holidays.find((hol) => hol.date === date) ?? null;
      setEditHoliday(h);
      setModalMode("holiday");
    } else if (state === "override-workday" || state === "override-holiday") {
      const o = overrides.find((ov) => ov.date === date) ?? null;
      setEditOverride(o);
      setModalMode("override");
    } else if (state === "weekend") {
      // Single-click on weekend → add make-up workday (most common case)
      setEditOverride(null);
      setModalMode("override");
    } else {
      // working day → add holiday
      setEditHoliday(null);
      setEditOverride(null);
      setModalMode("holiday");
    }
  };

  return (
    <div className="space-y-6">
      {/* Year stats card */}
      <YearStatsCard year={year} stats={yearStats} />

      {/* Year nav + actions */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={() => setYear((y) => y - 1)}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-h6-semibold text-primary w-16 text-center">{year}</span>
          <Button variant="secondary" size="sm" onClick={() => setYear((y) => y + 1)}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-3 text-caption-sm-regular text-secondary">
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-danger-subtle inline-block" />
              Holiday
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-warning-subtle inline-block border border-dashed border-warning-strong" />
              Make-up workday
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-success-subtle inline-block border border-dashed border-success-strong" />
              Make-up day off
            </span>
          </div>
          <Button variant="secondary" size="sm" onClick={() => setCopyOpen(true)}>
            <Copy className="w-4 h-4" />
            Copy year
          </Button>
        </div>
      </div>

      {/* 12-month grid: fixed 4x3 */}
      <div className="grid grid-cols-4 gap-3">
        {Array.from({ length: 12 }).map((_, m) => {
          const monthStats = computeMonthStats(year, m, holidays, overrides, weekPattern);
          const monthHolidays = getMonthHolidays(year, m, holidays);
          return (
            <HolidaysMonthGrid
              key={m}
              year={year}
              month={m}
              holidays={holidays}
              overrides={overrides}
              weekPattern={weekPattern ?? []}
              monthStats={monthStats}
              monthHolidays={monthHolidays}
              onCellClick={handleCellClick}
            />
          );
        })}
      </div>

      {/* Overrides table */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-body-sm-semibold text-primary">{year} overrides</h3>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              setEditOverride(null);
              setDefaultDate("");
              setModalMode("override");
            }}
          >
            + Add override
          </Button>
        </div>
        <DayOverridesTable scheduleId={scheduleId} overrides={overrides} />
      </div>

      {/* Modals */}
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
      <CopyYearModal scheduleId={scheduleId} open={copyOpen} onClose={() => setCopyOpen(false)} currentYear={year} />
    </div>
  );
});
