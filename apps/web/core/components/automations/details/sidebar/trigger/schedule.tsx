/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import { useTranslation } from "@plane/i18n";
import { ChevronDownIcon } from "@plane/propel/icons";
import { CustomMenu, Input } from "@plane/ui";
import { cn } from "@plane/utils";
// local imports
import { TimezoneSelect } from "@/components/common/timezone-select";
import type { TFixedScheduleConfig, TScheduleFrequency } from "./schedule-config";
import { DAYS_LIST } from "@plane/constants";

export type { TFixedScheduleConfig, TScheduleFrequency } from "./schedule-config";

function scheduleWeekdayButtonLabel(dayShort: string): string {
  const normalized = dayShort.toLowerCase();
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

type Props = {
  value: TFixedScheduleConfig;
  onChange: (value: TFixedScheduleConfig) => void;
  /** i18n key from `getFixedScheduleValidationErrorKey` */
  validationErrorKey?: string | null;
};

export const AutomationDetailsSidebarTriggerSchedule = (props: Props) => {
  const { value, onChange, validationErrorKey } = props;
  const { t } = useTranslation();

  const frequencyOptions: { value: TScheduleFrequency; labelKey: string }[] = [
    { value: "daily", labelKey: "automations.trigger.schedule.frequency_daily" },
    { value: "weekly", labelKey: "automations.trigger.schedule.frequency_weekly" },
    { value: "monthly", labelKey: "automations.trigger.schedule.frequency_monthly" },
  ];

  const selectedFrequency = frequencyOptions.find((o) => o.value === value.frequency);

  const setHourText = (n: string) => {
    if (Number.isNaN(n)) return;
    const hour12 = Math.min(12, Math.max(0, Number(n)));
    onChange({ ...value, hour12 });
  };

  const setMinuteText = (n: string) => {
    if (Number.isNaN(n)) return;
    const minute = Math.min(59, Math.max(0, Number(n)));
    onChange({ ...value, minute });
  };

  const menuButtonClass =
    "text-caption-sm-regular w-full px-4 h-7 rounded-md border-[0.5px] border-subtle-1 hover:bg-layer-transparent-hover text-left flex items-center gap-2 cursor-pointer transition-colors";

  return (
    <div className="space-y-4 px-4">
      <div className="space-y-2">
        <p className="text-body-xs-medium text-primary">{t("automations.trigger.schedule.frequency")}</p>
        <CustomMenu
          className="w-full"
          placement="bottom-start"
          maxHeight="lg"
          closeOnSelect
          customButtonClassName="w-full"
          customButton={
            <span
              className={cn(
                "text-caption-sm-regular w-full px-4 h-7 rounded-md border-[0.5px] border-subtle-1 hover:bg-layer-transparent-hover text-left flex items-center gap-2 cursor-pointer transition-colors"
              )}
            >
              <span className="flex grow items-center gap-2">{t(selectedFrequency?.labelKey ?? "")}</span>
              <ChevronDownIcon className="shrink-0 size-3" />
            </span>
          }
        >
          {frequencyOptions.map((option) => (
            <CustomMenu.MenuItem
              key={option.value}
              onClick={() => {
                onChange({ ...value, frequency: option.value });
              }}
            >
              <span className="truncate font-medium">{t(option.labelKey)}</span>
            </CustomMenu.MenuItem>
          ))}
        </CustomMenu>
      </div>

      {value.frequency === "weekly" && (
        <div className="space-y-2">
          <p className="text-body-xs-medium text-primary">{t("automations.trigger.schedule.select_day")}</p>
          <div className="flex flex-wrap gap-1.5">
            {Object.values(DAYS_LIST).map((day) => {
              const selected = value.days.includes(day.shortTitle?.toLowerCase() ?? "");
              return (
                <button
                  key={day.shortTitle}
                  type="button"
                  onClick={() => {
                    if (selected) {
                      onChange({
                        ...value,
                        days: value.days.filter((d) => d !== day.shortTitle.toLowerCase()),
                      });
                    } else {
                      onChange({
                        ...value,
                        days: [...value.days, day.shortTitle.toLowerCase()],
                      });
                    }
                  }}
                  className={cn(
                    "text-caption-sm-regular min-w-9 h-7 px-2 rounded-md border-[0.5px] border-subtle-1 transition-colors",
                    selected ? "bg-layer-1 text-primary" : "hover:bg-layer-transparent-hover text-secondary"
                  )}
                >
                  {scheduleWeekdayButtonLabel(day.shortTitle)}
                </button>
              );
            })}
          </div>
          {value.frequency === "weekly" && validationErrorKey ? (
            <p className="text-caption-sm-regular text-danger-primary">{t(validationErrorKey)}</p>
          ) : null}
        </div>
      )}

      {value.frequency === "monthly" && (
        <div className="space-y-2">
          <p className="text-body-xs-medium text-primary">{t("automations.trigger.schedule.monthly_every")}</p>
          <div
            role="group"
            aria-label={t("automations.trigger.schedule.day_of_month")}
            className="grid grid-cols-7 gap-2"
          >
            {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => {
              const selected = value.dayOfMonth === day;
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => onChange({ ...value, dayOfMonth: day })}
                  aria-label={t("automations.trigger.schedule.monthly_day_aria", { day })}
                  aria-pressed={selected}
                  className={cn(
                    "flex size-9 items-center justify-center rounded-full text-caption-md-medium transition-colors",
                    selected ? "bg-accent-primary text-on-color" : "text-primary hover:bg-layer-transparent-hover"
                  )}
                >
                  {day}
                </button>
              );
            })}
          </div>
          {value.frequency === "monthly" && validationErrorKey ? (
            <p className="text-body-xs-regular text-danger-primary">{t(validationErrorKey)}</p>
          ) : null}
        </div>
      )}

      <div className="space-y-2">
        <p className="text-body-xs-medium text-primary">{t("automations.trigger.schedule.time")}</p>
        <div className="flex gap-2">
          <div className="relative flex-1 min-w-0">
            <Input
              type="number"
              inputMode="numeric"
              value={String(value.hour12)}
              onChange={(e) => setHourText(e.target.value)}
              className="text-caption-sm-regular w-full h-7 rounded-md border-[0.5px] border-subtle-1 pl-3 pr-9"
              aria-label={t("automations.trigger.schedule.hour")}
            />
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-body-xs-regular text-tertiary">
              {t("automations.trigger.schedule.hour_suffix")}
            </span>
          </div>
          <div className="relative flex-1 min-w-0">
            <Input
              type="number"
              inputMode="numeric"
              value={String(value.minute).padStart(2, "0")}
              onChange={(e) => setMinuteText(e.target.value)}
              className="text-caption-sm-regular w-full h-7 rounded-md border-[0.5px] border-subtle-1 pl-3 pr-10"
              aria-label={t("automations.trigger.schedule.minute")}
            />
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-body-xs-regular text-tertiary">
              {t("automations.trigger.schedule.minute_suffix")}
            </span>
          </div>
          <CustomMenu
            className="w-20 shrink-0"
            placement="bottom-end"
            closeOnSelect
            customButton={
              <span className={cn(menuButtonClass, "px-2 w-full")}>
                <span className="flex grow justify-center">{value.period}</span>
                <ChevronDownIcon className="shrink-0 size-3" />
              </span>
            }
          >
            <CustomMenu.MenuItem onClick={() => onChange({ ...value, period: "AM" })}>
              {t("automations.trigger.schedule.am")}
            </CustomMenu.MenuItem>
            <CustomMenu.MenuItem onClick={() => onChange({ ...value, period: "PM" })}>
              {t("automations.trigger.schedule.pm")}
            </CustomMenu.MenuItem>
          </CustomMenu>
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-body-xs-medium text-primary">{t("automations.trigger.schedule.timezone")}</p>
        <TimezoneSelect
          value={value.timezone}
          onChange={(timezone) => onChange({ ...value, timezone })}
          label={t("automations.trigger.schedule.timezone_placeholder")}
          buttonClassName="text-caption-sm-regular w-full h-7 px-4 rounded-md"
          className="w-full"
        />
      </div>
    </div>
  );
};
