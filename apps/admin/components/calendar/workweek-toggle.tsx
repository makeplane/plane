/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useCallback, useRef } from "react";
import { observer } from "mobx-react";
import { Switch } from "@plane/propel/switch";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { IWorkSchedule } from "@plane/types";
import { useBusinessCalendar } from "@/hooks/store";

// Index matches backend week_pattern boolean array: Mon=0 … Sun=6
const WEEKDAY_LABELS: { label: string; full: string }[] = [
  { label: "T2", full: "Thứ Hai" },
  { label: "T3", full: "Thứ Ba" },
  { label: "T4", full: "Thứ Tư" },
  { label: "T5", full: "Thứ Năm" },
  { label: "T6", full: "Thứ Sáu" },
  { label: "T7", full: "Thứ Bảy" },
  { label: "CN", full: "Chủ Nhật" },
];

type Props = { schedule: IWorkSchedule };

export const WorkweekToggle = observer(function WorkweekToggle({ schedule }: Props) {
  const { updateSchedule } = useBusinessCalendar();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleToggle = useCallback(
    (index: number, enabled: boolean) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);

      // Build a new boolean[7] array with the toggled index
      const next = [...schedule.week_pattern] as boolean[];
      next[index] = enabled;

      debounceRef.current = setTimeout(() => {
        void updateSchedule(schedule.id, { week_pattern: next }).catch(() => {
          setToast({ type: TOAST_TYPE.ERROR, title: "Không thể cập nhật lịch làm việc" });
        });
      }, 300);
    },
    [schedule, updateSchedule]
  );

  return (
    <div className="space-y-3">
      <p className="text-body-sm-regular text-secondary">
        Bật/tắt các ngày trong tuần. Thay đổi tự động lưu sau 300ms.
      </p>
      <div className="divide-y divide-subtle border border-subtle rounded-lg overflow-hidden">
        {WEEKDAY_LABELS.map(({ label, full }, index) => {
          const isActive = Boolean(schedule.week_pattern[index]);
          return (
            <div
              key={index}
              className="flex items-center justify-between px-4 py-3 bg-surface-1 hover:bg-surface-2 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="w-7 text-center text-body-xs-semibold text-secondary">{label}</span>
                <span className="text-body-sm-regular text-primary">{full}</span>
              </div>
              <Switch value={isActive} onChange={(val) => handleToggle(index, val)} size="md" label={full} />
            </div>
          );
        })}
      </div>
    </div>
  );
});
