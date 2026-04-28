/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState, useEffect } from "react";
import { observer } from "mobx-react";
import { ChevronLeft, ChevronRight, Copy } from "lucide-react";
import { Button } from "@plane/propel/button";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { useBusinessCalendar } from "@/hooks/store";
import { HolidaysMonthGrid } from "./holidays-month-grid";
import { DayOverridesTable } from "./day-overrides-table";
import { HolidayFormModal } from "./holiday-form-modal";
import { DayOverrideFormModal } from "./day-override-form-modal";
import { CopyYearModal } from "./copy-year-modal";
import type { IHoliday, IDayOverride } from "@plane/types";

type ModalMode = "holiday" | "override" | null;

type Props = { scheduleId: string };

export const HolidaysYearView = observer(function HolidaysYearView({ scheduleId }: Props) {
  const { fetchHolidays, fetchOverrides, getHolidaysForYear, getOverridesForYear } = useBusinessCalendar();
  const [year, setYear] = useState(new Date().getFullYear());
  const [copyOpen, setCopyOpen] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [editHoliday, setEditHoliday] = useState<IHoliday | null>(null);
  const [editOverride, setEditOverride] = useState<IDayOverride | null>(null);
  const [defaultDate, setDefaultDate] = useState<string>("");

  useEffect(() => {
    fetchHolidays(scheduleId, year).catch(() => setToast({ type: TOAST_TYPE.ERROR, title: "Không thể tải ngày lễ" }));
    fetchOverrides(scheduleId, year).catch(() => setToast({ type: TOAST_TYPE.ERROR, title: "Không thể tải override" }));
  }, [scheduleId, year, fetchHolidays, fetchOverrides]);

  const holidays = getHolidaysForYear(scheduleId, year);
  const overrides = getOverridesForYear(scheduleId, year);

  const handleCellClick = (date: string, state: string) => {
    setDefaultDate(date);
    if (state === "holiday") {
      const h = holidays.find((hol) => hol.date === date) ?? null;
      setEditHoliday(h);
      setModalMode("holiday");
    } else if (state === "override-workday" || state === "override-holiday") {
      const o = overrides.find((ov) => ov.date === date) ?? null;
      setEditOverride(o);
      setModalMode("override");
    } else {
      setEditHoliday(null);
      setEditOverride(null);
      setModalMode("holiday");
    }
  };

  return (
    <div className="space-y-6">
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
              <span className="w-3 h-3 rounded bg-red-500/20 inline-block" />
              Lễ
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-amber-500/20 inline-block" />
              Làm bù
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-yellow-500/20 inline-block" />
              Nghỉ bù
            </span>
          </div>
          <Button variant="secondary" size="sm" onClick={() => setCopyOpen(true)}>
            <Copy className="w-4 h-4" />
            Sao chép năm
          </Button>
        </div>
      </div>

      {/* 12-month grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {Array.from({ length: 12 }).map((_, m) => (
          <HolidaysMonthGrid
            key={m}
            year={year}
            month={m}
            holidays={holidays}
            overrides={overrides}
            onCellClick={handleCellClick}
          />
        ))}
      </div>

      {/* Overrides table */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-body-sm-semibold text-primary">Danh sách override năm {year}</h3>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              setEditOverride(null);
              setDefaultDate("");
              setModalMode("override");
            }}
          >
            + Thêm override
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
