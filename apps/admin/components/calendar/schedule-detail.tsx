/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { observer } from "mobx-react";
import { useNavigate } from "react-router";
import { ArrowLeft, Trash2 } from "lucide-react";
import { Button } from "@plane/propel/button";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { useBusinessCalendar } from "@/hooks/store";
import { WorkweekToggle } from "./workweek-toggle";
import { HolidaysYearView } from "./holidays-year-view";

type Tab = "workweek" | "calendar";

type Props = { scheduleId: string };

export const ScheduleDetail = observer(function ScheduleDetail({ scheduleId }: Props) {
  const { schedulesMap, deleteSchedule } = useBusinessCalendar();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>("workweek");
  const [isDeleting, setIsDeleting] = useState(false);

  const schedule = schedulesMap[scheduleId];

  if (!schedule) {
    return (
      <div className="py-16 text-center text-body-sm-regular text-secondary">
        Không tìm thấy lịch làm việc.{" "}
        <button className="text-accent-primary underline" onClick={() => void navigate("/calendar/")}>
          Quay lại danh sách
        </button>
      </div>
    );
  }

  const handleDelete = async () => {
    if (!confirm(`Xoá lịch "${schedule.name}"? Hành động này không thể hoàn tác.`)) return;
    setIsDeleting(true);
    try {
      await deleteSchedule(scheduleId);
      setToast({ type: TOAST_TYPE.SUCCESS, title: "Đã xoá lịch làm việc" });
      void navigate("/calendar/");
    } catch {
      setToast({ type: TOAST_TYPE.ERROR, title: "Không thể xoá lịch làm việc" });
      setIsDeleting(false);
    }
  };

  const TAB_ITEMS: { key: Tab; label: string }[] = [
    { key: "workweek", label: "Tuần làm việc" },
    { key: "calendar", label: "Lịch năm" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => void navigate("/calendar/")}
            className="text-secondary hover:text-primary transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-h5-semibold text-primary">{schedule.name}</h1>
              {schedule.is_default && (
                <span className="px-2 py-0.5 rounded text-caption-sm-medium bg-accent-subtle text-accent-primary">
                  Mặc định
                </span>
              )}
            </div>
            <p className="text-caption-sm-regular text-secondary mt-0.5">
              {schedule.timezone} · {schedule.country_code}
            </p>
          </div>
        </div>
        <Button variant="secondary" size="sm" onClick={() => void handleDelete()} disabled={isDeleting}>
          <Trash2 className="w-4 h-4 text-danger-primary" />
          {isDeleting ? "Đang xoá..." : "Xoá"}
        </Button>
      </div>

      {/* Tabs */}
      <div className="border-b border-subtle">
        <div className="flex gap-6">
          {TAB_ITEMS.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => setActiveTab(key)}
              className={`pb-3 text-body-sm-medium border-b-2 transition-colors ${
                activeTab === key
                  ? "border-accent-primary text-accent-primary"
                  : "border-transparent text-secondary hover:text-primary"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div>
        {activeTab === "workweek" && <WorkweekToggle schedule={schedule} />}
        {activeTab === "calendar" && <HolidaysYearView scheduleId={scheduleId} />}
      </div>
    </div>
  );
});
