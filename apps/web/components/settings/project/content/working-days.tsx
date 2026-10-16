/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 *
 * d2m-plane: per-project working calendar (working weekdays + holidays) used by sprint charts.
 */

import { useEffect, useMemo, useState } from "react";
import { observer } from "mobx-react";
// plane imports
import { Button } from "@makeplane/propel/components/button";
import { IconButton } from "@makeplane/propel/components/icon-button";
import { CalendarOutline, CloseOutline } from "@makeplane/propel/icons";
import { DateSelect } from "@plane/blocks/property-select";
import { setPromiseToast } from "@plane/blocks/toast";
import { useTranslation } from "@plane/i18n";
import {
  cn,
  DEFAULT_WORKING_DAYS,
  ISO_WEEKDAYS,
  parseDateKey,
  renderFormattedDate,
  resolveWorkingDays,
  toDateKey,
} from "@plane/utils";
// hooks
import { useProject } from "@/hooks/store/use-project";
import { useUserProfile } from "@/hooks/store/user";

type Props = {
  workspaceSlug: string;
  projectId: string;
  disabled?: boolean;
};

const sameList = <T,>(a: T[], b: T[]) => a.length === b.length && a.every((v, i) => v === b[i]);

export const ProjectWorkingDaysSettings = observer(function ProjectWorkingDaysSettings(props: Props) {
  const { workspaceSlug, projectId, disabled = false } = props;
  // plane hooks
  const { t } = useTranslation();
  // store hooks
  const { getProjectById, updateProject } = useProject();
  const { data: userProfile } = useUserProfile();
  // derived values
  const project = getProjectById(projectId);
  const savedWorkingDays = useMemo(() => resolveWorkingDays(project?.working_days), [project?.working_days]);
  const savedHolidays = useMemo(() => [...(project?.holidays ?? [])].sort(), [project?.holidays]);
  // states
  const [workingDays, setWorkingDays] = useState<number[]>(savedWorkingDays);
  const [holidays, setHolidays] = useState<string[]>(savedHolidays);
  const [isSaving, setIsSaving] = useState(false);

  // keep local state in sync when the project loads or is updated elsewhere
  useEffect(() => setWorkingDays(savedWorkingDays), [savedWorkingDays]);
  useEffect(() => setHolidays(savedHolidays), [savedHolidays]);

  const isDirty = !sameList(workingDays, savedWorkingDays) || !sameList(holidays, savedHolidays);
  const hasNoWorkingDay = workingDays.length === 0;

  const toggleDay = (day: number) =>
    setWorkingDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort((a, b) => a - b)
    );

  const addHoliday = (date: Date | null) => {
    if (!date) return;
    const key = toDateKey(date);
    setHolidays((prev) => (prev.includes(key) ? prev : [...prev, key].sort()));
  };

  const removeHoliday = (key: string) => setHolidays((prev) => prev.filter((d) => d !== key));

  const handleSave = async () => {
    if (!workspaceSlug || !projectId || hasNoWorkingDay) return;
    setIsSaving(true);
    const promise = updateProject(workspaceSlug, projectId, { working_days: workingDays, holidays });
    setPromiseToast(promise, {
      loading: t("project_settings.cycles.working_days.toast.loading"),
      success: {
        title: t("success"),
        message: () => t("project_settings.cycles.working_days.toast.success"),
      },
      error: {
        title: t("error"),
        message: () => t("project_settings.cycles.working_days.toast.error"),
      },
    });
    try {
      await promise;
    } catch {
      // toast already reports the error
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex w-full flex-col gap-5 rounded-lg border border-subtle bg-layer-2 px-4 py-4">
      {/* working weekdays */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-1.5">
          <h4 className="text-body-sm-medium text-primary">{t("project_settings.cycles.working_days.heading")}</h4>
          <p className="text-caption-md-regular text-tertiary">
            {t("project_settings.cycles.working_days.description")}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2" role="group">
          {ISO_WEEKDAYS.map((day) => {
            const isSelected = workingDays.includes(day);
            return (
              <button
                key={day}
                type="button"
                disabled={disabled}
                aria-pressed={isSelected}
                onClick={() => toggleDay(day)}
                className={cn(
                  "h-8 min-w-12 rounded-md border px-3 text-13 font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60",
                  isSelected
                    ? "border-accent-strong bg-accent-primary text-on-color"
                    : "border-subtle bg-surface-1 text-secondary hover:bg-layer-1"
                )}
              >
                {t(`project_settings.cycles.working_days.weekdays.${day}`)}
              </button>
            );
          })}
          <button
            type="button"
            disabled={disabled || sameList(workingDays, DEFAULT_WORKING_DAYS)}
            onClick={() => setWorkingDays([...DEFAULT_WORKING_DAYS])}
            className="ml-1 text-13 font-medium text-accent-primary hover:underline disabled:cursor-not-allowed disabled:opacity-50 disabled:no-underline"
          >
            {t("project_settings.cycles.working_days.reset")}
          </button>
        </div>
        {hasNoWorkingDay && (
          <p className="text-caption-md-regular text-danger-primary">
            {t("project_settings.cycles.working_days.min_one")}
          </p>
        )}
      </div>

      {/* holidays */}
      <div className="flex flex-col gap-3 border-t border-subtle pt-4">
        <div className="flex flex-col gap-1.5">
          <h4 className="text-body-sm-medium text-primary">
            {t("project_settings.cycles.working_days.holidays.heading")}
          </h4>
          <p className="text-caption-md-regular text-tertiary">
            {t("project_settings.cycles.working_days.holidays.description")}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {holidays.length === 0 ? (
            <span className="text-caption-md-regular text-placeholder">
              {t("project_settings.cycles.working_days.holidays.empty")}
            </span>
          ) : (
            holidays.map((key) => (
              <span
                key={key}
                className="flex items-center gap-1 rounded-md border border-subtle bg-surface-1 py-0.5 pr-0.5 pl-2 text-13 text-secondary"
              >
                {renderFormattedDate(parseDateKey(key) ?? key)}
                <IconButton
                  variant="ghost"
                  size="xs"
                  icon={<CloseOutline />}
                  aria-label={t("project_settings.cycles.working_days.holidays.remove")}
                  disabled={disabled}
                  onClick={() => removeHoliday(key)}
                />
              </span>
            ))
          )}
        </div>
        <div>
          <DateSelect
            variant="pill-md"
            className="h-7"
            value={null}
            onChange={addHoliday}
            icon={<CalendarOutline />}
            placeholder={t("project_settings.cycles.working_days.holidays.add")}
            weekStartsOn={userProfile?.start_of_the_week}
            disabled={disabled}
          />
        </div>
      </div>

      <div className="flex justify-end">
        <Button
          variant="primary"
          size="md"
          stretch="auto"
          label={t("project_settings.cycles.working_days.save")}
          loading={isSaving}
          disabled={disabled || !isDirty || hasNoWorkingDay}
          onClick={() => void handleSave()}
        />
      </div>
    </div>
  );
});
