/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useMemo, useState } from "react";
import { observer } from "mobx-react";
import useSWR from "swr";
// plane imports
import { EUserPermissions, EUserPermissionsLevel } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { IWorkingHours, TWorkingHoursDayKey } from "@plane/types";
import { CustomSearchSelect, ToggleSwitch } from "@plane/ui";
// hooks
import { useUserPermissions } from "@/hooks/store/user";
import { useWorkspace } from "@/hooks/store/use-workspace";
// services
import { WorkspaceService } from "@/services/workspace.service";

const workspaceService = new WorkspaceService();

const WEEKDAYS: TWorkingHoursDayKey[] = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

const DEFAULT_WORKING_HOURS: IWorkingHours = {
  enabled: false,
  global_hours: { start: "09:00", end: "18:00" },
  days: WEEKDAYS.reduce(
    (acc, day) => {
      acc[day] = { enabled: day !== "saturday" && day !== "sunday", hours_mode: "global" };
      return acc;
    },
    {} as IWorkingHours["days"]
  ),
  holiday_calendar: { country_code: null, subdivision_code: null },
};

const cloneConfig = (value: IWorkingHours | undefined): IWorkingHours =>
  value ? JSON.parse(JSON.stringify(value)) : JSON.parse(JSON.stringify(DEFAULT_WORKING_HOURS));

// Always-24h time field. Native <input type="time"> renders in the browser's
// locale (12h with AM/PM under en-US), which we don't want, so this is a plain
// text field normalized to "HH:MM" on blur.
function Time24Input({
  value,
  onChange,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}) {
  const [text, setText] = useState(value);
  useEffect(() => setText(value), [value]);

  const commit = (raw: string) => {
    const digits = raw.replace(/\D/g, "").slice(0, 4);
    if (digits.length < 3) {
      setText(value);
      return;
    }
    const hoursPart = digits.length === 3 ? digits.slice(0, 1) : digits.slice(0, 2);
    const minutesPart = digits.length === 3 ? digits.slice(1) : digits.slice(2);
    const hours = String(Math.min(23, Number(hoursPart))).padStart(2, "0");
    const minutes = String(Math.min(59, Number(minutesPart))).padStart(2, "0");
    const normalized = `${hours}:${minutes}`;
    setText(normalized);
    onChange(normalized);
  };

  return (
    <input
      type="text"
      inputMode="numeric"
      placeholder="HH:MM"
      maxLength={5}
      className={className}
      value={text}
      onChange={(e) => setText(e.target.value)}
      onBlur={(e) => commit(e.target.value)}
    />
  );
}

export const WorkspaceWorkingHours = observer(function WorkspaceWorkingHours() {
  const { t } = useTranslation();
  const { currentWorkspace, updateWorkspace } = useWorkspace();
  const { allowPermissions } = useUserPermissions();

  const isAdmin = allowPermissions([EUserPermissions.ADMIN], EUserPermissionsLevel.WORKSPACE);

  const [config, setConfig] = useState<IWorkingHours>(() => cloneConfig(currentWorkspace?.working_hours));
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: countryData } = useSWR(
    currentWorkspace ? `HOLIDAY_COUNTRIES_${currentWorkspace.slug}` : null,
    currentWorkspace ? () => workspaceService.getHolidayCountries(currentWorkspace.slug) : null
  );

  const countryOptions = useMemo(
    () =>
      (countryData?.countries ?? []).map((c) => ({
        value: c.code,
        query: c.code,
        content: c.code,
      })),
    [countryData]
  );

  const subdivisionOptions = useMemo(() => {
    const country = (countryData?.countries ?? []).find((c) => c.code === config.holiday_calendar.country_code);
    return (country?.subdivisions ?? []).map((s) => ({ value: s, query: s, content: s }));
  }, [countryData, config.holiday_calendar.country_code]);

  if (!currentWorkspace) return null;
  if (!isAdmin)
    return <div className="text-sm text-secondary">{t("workspace_settings.settings.working_hours.admin_only")}</div>;

  const patchDay = (day: TWorkingHoursDayKey, patch: Partial<IWorkingHours["days"][TWorkingHoursDayKey]>) =>
    setConfig((prev) => ({ ...prev, days: { ...prev.days, [day]: { ...prev.days[day], ...patch } } }));

  const handleSave = async () => {
    setIsSubmitting(true);
    try {
      await updateWorkspace(currentWorkspace.slug, { working_hours: config });
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("common.success"),
        message: t("workspace_settings.settings.working_hours.saved"),
      });
    } catch (error: unknown) {
      const message =
        (error as { working_hours?: string[] })?.working_hours?.join(" ") ??
        (error as { error?: string })?.error ??
        t("workspace_settings.settings.working_hours.save_failed");
      setToast({ type: TOAST_TYPE.ERROR, title: t("common.error"), message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex w-full flex-col gap-6">
      <div>
        <h3 className="text-xl font-medium">{t("workspace_settings.settings.working_hours.title")}</h3>
        <p className="text-sm text-secondary">{t("workspace_settings.settings.working_hours.description")}</p>
      </div>

      {/* Enable toggle */}
      <div className="border-custom-border-200 flex items-center justify-between gap-2 border-b pb-4">
        <div>
          <div className="text-sm font-medium">{t("workspace_settings.settings.working_hours.enable")}</div>
          <div className="text-xs text-secondary">
            {t("workspace_settings.settings.working_hours.timezone_label")}: {currentWorkspace.timezone}
          </div>
        </div>
        <ToggleSwitch value={config.enabled} onChange={(val) => setConfig((prev) => ({ ...prev, enabled: val }))} />
      </div>

      {/* Global hours */}
      <div className="flex items-center gap-3">
        <span className="text-sm w-40 font-medium">{t("workspace_settings.settings.working_hours.global_hours")}</span>
        <Time24Input
          className="border-custom-border-200 text-sm w-20 rounded border bg-transparent px-2 py-1 text-center"
          value={config.global_hours.start}
          onChange={(val) => setConfig((prev) => ({ ...prev, global_hours: { ...prev.global_hours, start: val } }))}
        />
        <span className="text-secondary">–</span>
        <Time24Input
          className="border-custom-border-200 text-sm w-20 rounded border bg-transparent px-2 py-1 text-center"
          value={config.global_hours.end}
          onChange={(val) => setConfig((prev) => ({ ...prev, global_hours: { ...prev.global_hours, end: val } }))}
        />
      </div>

      {/* Per-day rows */}
      <div className="flex flex-col gap-2">
        {WEEKDAYS.map((day) => {
          const dayConfig = config.days[day];
          return (
            <div key={day} className="flex items-center gap-3">
              <div className="flex w-40 items-center gap-2">
                <ToggleSwitch value={dayConfig.enabled} onChange={(val) => patchDay(day, { enabled: val })} />
                <span className="text-sm capitalize">{t(`workspace_settings.settings.working_hours.days.${day}`)}</span>
              </div>
              {dayConfig.enabled && (
                <>
                  <select
                    className="border-custom-border-200 text-sm rounded border bg-transparent px-2 py-1"
                    value={dayConfig.hours_mode}
                    onChange={(e) => patchDay(day, { hours_mode: e.target.value as "global" | "custom" })}
                  >
                    <option value="global">{t("workspace_settings.settings.working_hours.mode_global")}</option>
                    <option value="custom">{t("workspace_settings.settings.working_hours.mode_custom")}</option>
                  </select>
                  {dayConfig.hours_mode === "custom" && (
                    <>
                      <Time24Input
                        className="border-custom-border-200 text-sm w-20 rounded border bg-transparent px-2 py-1 text-center"
                        value={dayConfig.start ?? config.global_hours.start}
                        onChange={(val) => patchDay(day, { start: val })}
                      />
                      <span className="text-secondary">–</span>
                      <Time24Input
                        className="border-custom-border-200 text-sm w-20 rounded border bg-transparent px-2 py-1 text-center"
                        value={dayConfig.end ?? config.global_hours.end}
                        onChange={(val) => patchDay(day, { end: val })}
                      />
                    </>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Holiday calendar */}
      <div className="flex items-center gap-3">
        <span className="text-sm w-40 font-medium">
          {t("workspace_settings.settings.working_hours.holiday_calendar")}
        </span>
        <CustomSearchSelect
          value={config.holiday_calendar.country_code}
          label={config.holiday_calendar.country_code ?? t("workspace_settings.settings.working_hours.select_country")}
          options={countryOptions}
          onChange={(val: string) =>
            setConfig((prev) => ({
              ...prev,
              holiday_calendar: { country_code: val, subdivision_code: null },
            }))
          }
        />
        {subdivisionOptions.length > 0 && (
          <CustomSearchSelect
            value={config.holiday_calendar.subdivision_code}
            label={
              config.holiday_calendar.subdivision_code ?? t("workspace_settings.settings.working_hours.select_region")
            }
            options={subdivisionOptions}
            onChange={(val: string) =>
              setConfig((prev) => ({
                ...prev,
                holiday_calendar: { ...prev.holiday_calendar, subdivision_code: val },
              }))
            }
          />
        )}
      </div>

      <div>
        <Button variant="primary" onClick={handleSave} loading={isSubmitting}>
          {t("common.save_changes")}
        </Button>
      </div>
    </div>
  );
});
