/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { CalendarDays, ChevronDown } from "lucide-react";
// plane imports
import { TIME_DATE_PRESETS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import type { TTimeDatePreset } from "@plane/types";
import { CustomMenu } from "@plane/ui";
import { cn, getDateFromISODate, getISODate, renderFormattedDate } from "@plane/utils";
// components
import { DateRangeDropdown } from "@/components/dropdowns/date-range";
// hooks
import type {
  TTimeTrackingFilterPatch,
  TTimeTrackingFilterState,
} from "@/hooks/time-tracking/use-time-tracking-filters";

type Props = {
  filters: TTimeTrackingFilterState;
  /** the resolved range, shown in the button */
  resolvedRange: { from?: string; to?: string };
  setFilters: (patch: TTimeTrackingFilterPatch) => void;
  today: string;
};

/** Date presets plus a custom range (plan Appendix B). */
export function TimeTrackingDateFilter({ filters, resolvedRange, setFilters, today }: Props) {
  const { t } = useTranslation();
  const presetLabel = (preset: TTimeDatePreset) =>
    t(TIME_DATE_PRESETS.find((option) => option.key === preset)?.i18n_label ?? "time-tracking.presets.custom");
  const rangeLabel =
    resolvedRange.from && resolvedRange.to
      ? `${renderFormattedDate(resolvedRange.from, "MMM d")} – ${renderFormattedDate(resolvedRange.to, "MMM d, yyyy")}`
      : "";

  return (
    <div className="flex items-center gap-1">
      <CustomMenu
        customButton={
          <span className="flex h-7 items-center gap-1.5 rounded-md border-[0.5px] border-subtle-1 bg-layer-2 px-2 text-13 whitespace-nowrap text-primary hover:bg-layer-2-hover">
            <CalendarDays className="size-3.5 text-tertiary" />
            <span>{presetLabel(filters.date_preset)}</span>
            {filters.date_preset !== "custom" && filters.date_preset !== "all_time" && rangeLabel && (
              <span className="hidden text-tertiary lg:inline">· {rangeLabel}</span>
            )}
            <ChevronDown className="size-3 text-tertiary" />
          </span>
        }
        placement="bottom-start"
        closeOnSelect
      >
        {TIME_DATE_PRESETS.map((preset) => (
          <CustomMenu.MenuItem
            key={preset.key}
            onClick={() =>
              setFilters(
                preset.key === "custom"
                  ? {
                      date_preset: "custom",
                      date_from: resolvedRange.from ?? today,
                      date_to: resolvedRange.to ?? today,
                    }
                  : { date_preset: preset.key }
              )
            }
            className={cn({ "font-medium text-primary": filters.date_preset === preset.key })}
          >
            {t(preset.i18n_label)}
          </CustomMenu.MenuItem>
        ))}
      </CustomMenu>
      {filters.date_preset === "custom" && (
        <DateRangeDropdown
          value={{
            from: filters.date_from ? getDateFromISODate(filters.date_from) : undefined,
            to: filters.date_to ? getDateFromISODate(filters.date_to) : undefined,
          }}
          onSelect={(range) =>
            setFilters({
              date_preset: "custom",
              date_from: range?.from ? getISODate(range.from) : null,
              date_to: range?.to ? getISODate(range.to) : null,
            })
          }
          buttonVariant="border-with-text"
          buttonClassName="h-7"
          mergeDates
        />
      )}
    </div>
  );
}
