/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { observer } from "mobx-react";
import { Pencil } from "lucide-react";
import type { IWorkSchedule } from "@plane/types";
import { cn } from "@plane/utils";
import { useBusinessCalendar } from "@/hooks/store";
import { HolidaysYearView } from "./holidays-year-view";
import { MonthOverview } from "./month-overview";
import { WorkweekEditModal } from "./workweek-edit-modal";

type Tab = "month" | "calendar";

const DAY_INITIALS = ["M", "T", "W", "T", "F", "S", "S"];

const TAB_ITEMS: { key: Tab; label: string }[] = [
  { key: "month", label: "Month" },
  { key: "calendar", label: "Year calendar" },
];

type Props = { scheduleId: string };

export const ScheduleDetail = observer(function ScheduleDetail({ scheduleId }: Props) {
  const { schedulesMap } = useBusinessCalendar();
  const [activeTab, setActiveTab] = useState<Tab>("month");
  const [workweekOpen, setWorkweekOpen] = useState(false);

  const schedule = schedulesMap[scheduleId];

  if (!schedule) {
    return (
      <div className="py-16 text-center text-body-sm-regular text-secondary">
        Schedule not found. Please refresh the page.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-h5-semibold text-primary">{schedule.name}</h1>
            {schedule.is_default && (
              <span className="rounded bg-accent-subtle px-2 py-0.5 text-caption-sm-medium text-accent-primary">
                Default
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2 text-caption-sm-regular text-secondary">
            <span>{schedule.timezone}</span>
            <span>·</span>
            <span>{schedule.country_code}</span>
            <span>·</span>
            <WorkweekChip weekPattern={schedule.week_pattern} onEdit={() => setWorkweekOpen(true)} />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-subtle">
        <div className="flex gap-6">
          {TAB_ITEMS.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => setActiveTab(key)}
              className={`border-b-2 pb-3 text-body-sm-medium transition-colors ${
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
        {activeTab === "month" && <MonthOverview scheduleId={scheduleId} />}
        {activeTab === "calendar" && <HolidaysYearView scheduleId={scheduleId} />}
      </div>

      <WorkweekEditModal open={workweekOpen} onClose={() => setWorkweekOpen(false)} schedule={schedule} />
    </div>
  );
});

type ChipProps = { weekPattern: IWorkSchedule["week_pattern"]; onEdit: () => void };

const WorkweekChip = ({ weekPattern, onEdit }: ChipProps) => (
  <button
    type="button"
    onClick={onEdit}
    title="Edit working week"
    className="inline-flex cursor-pointer items-center gap-1.5 rounded border border-subtle px-2 py-0.5 transition-colors hover:border-strong hover:bg-surface-2"
  >
    <span className="text-caption-sm-regular text-secondary">Working:</span>
    <span className="font-mono flex items-center gap-0.5">
      {DAY_INITIALS.map((d, i) => (
        <span
          key={i}
          className={cn(
            "text-caption-sm-medium tabular-nums",
            weekPattern[i] ? "text-primary" : "text-tertiary line-through"
          )}
        >
          {d}
        </span>
      ))}
    </span>
    <Pencil className="h-3 w-3 text-tertiary" />
  </button>
);
