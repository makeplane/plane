/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { endOfMonth, endOfWeek, format, startOfMonth, startOfWeek, subDays, subWeeks } from "date-fns";
import { Download } from "lucide-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { getButtonStyling } from "@plane/propel/button";
import { cn } from "@plane/utils";
// components
import { MemberDropdown } from "@/components/dropdowns/member/dropdown";
import { ProjectSelect } from "@/components/analytics/select/project";

export type TDateRangePreset = "this_week" | "last_week" | "this_month" | "last_30_days";

const ISO = (date: Date) => format(date, "yyyy-MM-dd");

export const getPresetRange = (preset: TDateRangePreset): { start: string; end: string } => {
  const today = new Date();
  switch (preset) {
    case "last_week": {
      const lastWeek = subWeeks(today, 1);
      return {
        start: ISO(startOfWeek(lastWeek, { weekStartsOn: 1 })),
        end: ISO(endOfWeek(lastWeek, { weekStartsOn: 1 })),
      };
    }
    case "this_month":
      return { start: ISO(startOfMonth(today)), end: ISO(endOfMonth(today)) };
    case "last_30_days":
      return { start: ISO(subDays(today, 29)), end: ISO(today) };
    case "this_week":
    default:
      return { start: ISO(startOfWeek(today, { weekStartsOn: 1 })), end: ISO(endOfWeek(today, { weekStartsOn: 1 })) };
  }
};

type Props = {
  startDate: string;
  endDate: string;
  onDateChange: (start: string, end: string) => void;
  userIds: string[];
  onUserIdsChange: (val: string[]) => void;
  canViewOthers: boolean;
  onExport: () => void;
  exportDisabled?: boolean;
  workspaceScope?: boolean;
  projectIds?: string[];
  onProjectIdsChange?: (val: string[]) => void;
  availableProjectIds?: string[];
};

export const TimeReportFilters = (props: Props) => {
  const {
    startDate,
    endDate,
    onDateChange,
    userIds,
    onUserIdsChange,
    canViewOthers,
    onExport,
    exportDisabled,
    workspaceScope,
    projectIds,
    onProjectIdsChange,
    availableProjectIds,
  } = props;
  const { t } = useTranslation();

  const presets: { key: TDateRangePreset; label: string }[] = [
    { key: "this_week", label: t("time_reports.filters.preset_this_week") },
    { key: "last_week", label: t("time_reports.filters.preset_last_week") },
    { key: "this_month", label: t("time_reports.filters.preset_this_month") },
    { key: "last_30_days", label: t("time_reports.filters.preset_last_30_days") },
  ];

  return (
    <div className="flex flex-wrap items-center gap-2 pb-4">
      <div className="flex items-center gap-1 rounded-md border border-subtle p-0.5">
        {presets.map((preset) => {
          const range = getPresetRange(preset.key);
          const isActive = range.start === startDate && range.end === endDate;
          return (
            <button
              key={preset.key}
              type="button"
              onClick={() => onDateChange(range.start, range.end)}
              className={cn(
                "rounded px-2.5 py-1 text-12 font-medium transition-colors",
                isActive ? "bg-layer-2 text-primary" : "text-tertiary hover:text-secondary"
              )}
            >
              {preset.label}
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-1.5">
        <input
          type="date"
          value={startDate}
          max={endDate}
          onChange={(e) => onDateChange(e.target.value, endDate)}
          className="rounded-md border border-subtle bg-transparent px-2 py-1 text-12"
        />
        <span className="text-tertiary">–</span>
        <input
          type="date"
          value={endDate}
          min={startDate}
          onChange={(e) => onDateChange(startDate, e.target.value)}
          className="rounded-md border border-subtle bg-transparent px-2 py-1 text-12"
        />
      </div>

      {workspaceScope && onProjectIdsChange && (
        <ProjectSelect
          value={projectIds}
          onChange={(val) => onProjectIdsChange(val ?? [])}
          projectIds={availableProjectIds}
        />
      )}

      {canViewOthers && (
        <MemberDropdown
          multiple
          value={userIds}
          onChange={onUserIdsChange}
          buttonVariant="border-with-text"
          placeholder={t("time_reports.filters.members")}
        />
      )}

      <button
        type="button"
        onClick={onExport}
        disabled={exportDisabled}
        className={cn(getButtonStyling("secondary", "sm"), "ml-auto gap-1.5")}
      >
        <Download className="size-3.5" />
        {t("time_reports.export_csv")}
      </button>
    </div>
  );
};
