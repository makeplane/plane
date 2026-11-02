/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useRef, useState } from "react";
import { Dialog } from "@headlessui/react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { X } from "lucide-react";
import { EUserPermissions, EUserPermissionsLevel } from "@plane/constants";
import { Button } from "@plane/propel/button";
import { setToast, TOAST_TYPE } from "@plane/propel/toast";
import { EModalPosition, EModalWidth, ModalCore } from "@plane/ui";
import { useUserPermissions } from "@/hooks/store/user";
import { useTimeLineChartStore } from "@/hooks/use-timeline-chart";
import { setPullEarlier, setScheduleMode, useSchedulePrefs } from "./schedule-prefs";
import { scheduleService } from "./schedule-service";
import { useWorkspaceCalendar } from "./use-workspace-calendar";

const inputClass = "rounded border border-subtle bg-layer-transparent px-2 py-1 text-13";
const weekdayLabels = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

export const ScheduleSettingsModal = observer(function ScheduleSettingsModal({ onClose }: { onClose: () => void }) {
  const { workspaceSlug } = useParams();
  const slug = typeof workspaceSlug === "string" ? workspaceSlug : undefined;
  const { settings, supported, reload } = useWorkspaceCalendar(slug);
  const { mode, pullEarlier } = useSchedulePrefs();
  const { autoSchedule, toggleAutoSchedule, showDependencies, toggleShowDependencies } = useTimeLineChartStore();
  const { allowPermissions } = useUserPermissions();
  const isAdmin = allowPermissions([EUserPermissions.ADMIN], EUserPermissionsLevel.WORKSPACE);
  const [date, setDate] = useState("");
  const [name, setName] = useState("");
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [busy, setBusy] = useState(false);
  const saving = useRef(false);
  const edit = async (action: (workspace: string) => Promise<unknown>) => {
    if (!slug || !isAdmin || saving.current) return;
    saving.current = true;
    setBusy(true);
    try {
      await action(slug);
      await reload();
    } catch {
      setToast({ type: TOAST_TYPE.ERROR, title: "Không thể cập nhật lịch làm việc", message: "Vui lòng thử lại." });
    } finally {
      saving.current = false;
      setBusy(false);
    }
  };

  return (
    <ModalCore isOpen handleClose={onClose} position={EModalPosition.CENTER} width={EModalWidth.XL}>
      <div className="max-h-[85vh] overflow-y-auto px-5 py-4 text-13">
        <div className="flex items-center justify-between gap-2">
          <Dialog.Title as="h3" className="text-18 font-medium">
            Cài đặt lập lịch
          </Dialog.Title>
          <button
            type="button"
            aria-label="Đóng"
            className="rounded p-1 text-tertiary hover:bg-layer-transparent-hover"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <section className="mt-4 space-y-3">
          <h4 className="font-medium">Tuỳ chọn của bạn</h4>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={autoSchedule} onChange={toggleAutoSchedule} /> Tự lùi lịch
          </label>
          {supported && (
            <>
              <label className="flex flex-wrap items-center gap-2">
                Chế độ tính
                <select
                  className={inputClass}
                  value={mode}
                  onChange={(event) => setScheduleMode(event.target.value === "working" ? "working" : "calendar")}
                >
                  <option value="calendar">Ngày lịch</option>
                  <option value="working">Ngày làm việc</option>
                </select>
              </label>
              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={pullEarlier}
                    onChange={(event) => setPullEarlier(event.target.checked)}
                  />{" "}
                  Tự kéo việc sau sớm lại
                </label>
                <p className="mt-1 text-11 text-tertiary">Kéo việc sau về sớm nhất khi việc trước kết thúc sớm hơn.</p>
              </div>
            </>
          )}
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={showDependencies} onChange={toggleShowDependencies} /> Hiện đường phụ thuộc
          </label>
        </section>
        {supported && settings && (
          <section className="mt-5 space-y-3 border-t border-subtle pt-4">
            <h4 className="font-medium">Lịch làm việc của workspace</h4>
            {!isAdmin && (
              <p className="text-11 text-tertiary">Chỉ quản trị viên workspace có thể chỉnh sửa lịch làm việc.</p>
            )}
            <div className="flex flex-wrap gap-3">
              {weekdayLabels.map((label, index) => {
                const weekday = index + 1;
                const checked = settings.working_weekdays.includes(weekday);
                return (
                  <label key={weekday} className="flex items-center gap-1">
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={!isAdmin || busy || (checked && settings.working_weekdays.length === 1)}
                      onChange={() =>
                        void edit((workspace) =>
                          scheduleService.updateSettings(
                            workspace,
                            checked
                              ? settings.working_weekdays.filter((day) => day !== weekday)
                              : [...settings.working_weekdays, weekday]
                          )
                        )
                      }
                    />
                    {label}
                  </label>
                );
              })}
            </div>
            <h5 className="font-medium">Ngày nghỉ</h5>
            {settings.holidays.length === 0 && <p className="text-tertiary">Chưa có ngày nghỉ.</p>}
            <ul className="max-h-48 space-y-2 overflow-y-auto">
              {settings.holidays.map((holiday) => (
                <li key={holiday.id} className="flex items-center gap-2">
                  <span>{holiday.date}</span>
                  <span className="flex-1 break-words">{holiday.name}</span>
                  {isAdmin && (
                    <button
                      type="button"
                      disabled={busy}
                      className="text-danger-primary disabled:opacity-50"
                      aria-label={`Xoá ngày nghỉ ${holiday.date}`}
                      onClick={() => void edit((workspace) => scheduleService.deleteHoliday(workspace, holiday.id))}
                    >
                      Xoá
                    </button>
                  )}
                </li>
              ))}
            </ul>
            {isAdmin && (
              <>
                <form
                  className="flex flex-wrap items-end gap-2"
                  onSubmit={(event) => {
                    event.preventDefault();
                    if (date)
                      void edit(async (workspace) => {
                        await scheduleService.addHoliday(workspace, { date, name });
                        setDate("");
                        setName("");
                      });
                  }}
                >
                  <label className="flex flex-col gap-1">
                    Ngày
                    <input
                      type="date"
                      required
                      className={inputClass}
                      value={date}
                      disabled={busy}
                      onChange={(event) => setDate(event.target.value)}
                    />
                  </label>
                  <label className="flex min-w-0 flex-1 flex-col gap-1">
                    Tên ngày nghỉ
                    <input
                      className={inputClass}
                      value={name}
                      disabled={busy}
                      onChange={(event) => setName(event.target.value)}
                    />
                  </label>
                  <Button type="submit" variant="secondary" disabled={busy || !date}>
                    Thêm ngày nghỉ
                  </Button>
                </form>
                <form
                  className="flex flex-wrap items-center gap-2"
                  onSubmit={(event) => {
                    event.preventDefault();
                    const value = Number(year);
                    if (Number.isInteger(value) && value >= 2000 && value <= 2100)
                      void edit((workspace) => scheduleService.addVietnameseHolidays(workspace, value));
                  }}
                >
                  <Button type="submit" variant="secondary" disabled={busy}>
                    Thêm lễ cố định VN năm
                  </Button>
                  <input
                    aria-label="Năm thêm lễ cố định VN"
                    type="number"
                    min={2000}
                    max={2100}
                    step={1}
                    required
                    className={`${inputClass} w-24`}
                    value={year}
                    disabled={busy}
                    onChange={(event) => setYear(event.target.value)}
                  />
                </form>
              </>
            )}
          </section>
        )}
        <div className="mt-4 flex justify-end">
          <Button variant="secondary" onClick={onClose}>
            Đóng
          </Button>
        </div>
      </div>
    </ModalCore>
  );
});

export function ScheduleSettingsButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        className="flex-shrink-0 rounded-md bg-layer-transparent p-1 px-2 text-11 hover:bg-layer-transparent-hover"
        onClick={() => setOpen(true)}
      >
        Cài đặt lập lịch
      </button>
      {open && <ScheduleSettingsModal onClose={() => setOpen(false)} />}
    </>
  );
}
