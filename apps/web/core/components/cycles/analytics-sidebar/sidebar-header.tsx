/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect } from "react";
import { observer } from "mobx-react";
import { Controller, useForm } from "react-hook-form";
import { ArrowRight } from "lucide-react";
// Plane Imports
import { CYCLE_STATUS, EUserPermissions, EUserPermissionsLevel } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { ChevronRightIcon } from "@plane/propel/icons";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { ICycle } from "@plane/types";
import { getDate, renderFormattedPayloadDate } from "@plane/utils";
// components
import { DateRangeDropdown } from "@/components/dropdowns/date-range";
// hooks
import { useCycle } from "@/hooks/store/use-cycle";
import { useUserPermissions } from "@/hooks/store/user";
import { useTimeZoneConverter } from "@/hooks/use-timezone-converter";
// services
import { CycleService } from "@/services/cycle.service";

type Props = {
  workspaceSlug: string;
  projectId: string;
  cycleDetails: ICycle;
  handleClose: () => void;
  isArchived?: boolean;
};

const defaultValues: Partial<ICycle> = {
  start_date: null,
  end_date: null,
};

const cycleService = new CycleService();

export const CycleSidebarHeader = observer(function CycleSidebarHeader(props: Props) {
  const { workspaceSlug, projectId, cycleDetails, handleClose, isArchived = false } = props;
  // hooks
  const { allowPermissions } = useUserPermissions();
  const { updateCycleDetails } = useCycle();
  const { t } = useTranslation();
  const { renderFormattedDateInUserTimezone, getProjectUTCOffset } = useTimeZoneConverter(projectId);

  // derived values
  const projectUTCOffset = getProjectUTCOffset();

  // form info
  const { control, reset } = useForm({
    defaultValues,
  });

  const cycleStatus = cycleDetails?.status?.toLocaleLowerCase();
  const isCompleted = cycleStatus === "completed";

  const currentCycle = CYCLE_STATUS.find((status) => status.value === cycleStatus);

  const submitChanges = async (data: Partial<ICycle>) => {
    if (!workspaceSlug || !projectId || !cycleDetails.id) return;
    await updateCycleDetails(workspaceSlug.toString(), projectId.toString(), cycleDetails.id.toString(), data);
  };

  useEffect(() => {
    if (cycleDetails)
      reset({
        ...cycleDetails,
      });
  }, [cycleDetails, reset]);

  const dateChecker = async (payload: any) => {
    try {
      const res = await cycleService.cycleDateCheck(workspaceSlug, projectId, payload);
      return res.status;
    } catch (err) {
      return false;
    }
  };

  const handleDateChange = async (startDate: Date | undefined, endDate: Date | undefined) => {
    let isDateValid = false;

    const payload = {
      start_date: renderFormattedPayloadDate(startDate) || null,
      end_date: renderFormattedPayloadDate(endDate) || null,
    };

    if (payload?.start_date && payload.end_date) {
      isDateValid = await dateChecker({
        ...payload,
        cycle_id: cycleDetails.id,
      });
    } else {
      isDateValid = true;
    }
    if (isDateValid) {
      submitChanges(payload);
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("project_cycles.action.update.success.title"),
        message: t("project_cycles.action.update.success.description"),
      });
    } else {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("project_cycles.action.update.failed.title"),
        message: t("project_cycles.action.update.error.already_exists"),
      });
    }
    return isDateValid;
  };

  const isEditingAllowed = allowPermissions(
    [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
    EUserPermissionsLevel.PROJECT
  );

  return (
    <>
      <div className="sticky top-0 z-10 flex items-center justify-between bg-surface-1 pt-2">
        <div className="flex size-5 items-center justify-center">
          <button
            className="flex size-6 flex-shrink-0 items-center justify-center rounded-full bg-layer-3 hover:bg-layer-3-hover"
            onClick={() => handleClose()}
          >
            <ChevronRightIcon className="size-4 stroke-2 text-secondary" />
          </button>
        </div>
      </div>
      <div className="flex w-full flex-col gap-2">
        <div className="flex items-start justify-between gap-3 pt-2">
          <h4 className="w-full text-18 font-semibold break-words text-primary">{cycleDetails.name}</h4>
          {currentCycle && (
            <span
              className="flex h-6 min-w-20 items-center justify-center truncate rounded-sm px-3 text-center text-11 font-medium whitespace-nowrap"
              style={{
                color: currentCycle.color,
                backgroundColor: `${currentCycle.color}20`,
              }}
            >
              {t(currentCycle.i18n_title)}
            </span>
          )}
        </div>

        <Controller
          control={control}
          name="start_date"
          render={({ field: { value: startDateValue, onChange: onChangeStartDate } }) => (
            <div className="flex items-center gap-2">
              <Controller
                control={control}
                name="end_date"
                render={({ field: { value: endDateValue, onChange: onChangeEndDate } }) => (
                  <DateRangeDropdown
                    className="h-7"
                    buttonVariant="border-with-text"
                    minDate={new Date()}
                    value={{
                      from: getDate(startDateValue),
                      to: getDate(endDateValue),
                    }}
                    onSelect={async (val) => {
                      const isDateValid = await handleDateChange(val?.from, val?.to);
                      if (isDateValid) {
                        onChangeStartDate(val?.from ? renderFormattedPayloadDate(val.from) : null);
                        onChangeEndDate(val?.to ? renderFormattedPayloadDate(val.to) : null);
                      }
                    }}
                    placeholder={{
                      from: t("project_cycles.start_date"),
                      to: t("project_cycles.end_date"),
                    }}
                    customTooltipHeading={t("project_cycles.in_your_timezone")}
                    customTooltipContent={
                      <span className="flex gap-1">
                        {renderFormattedDateInUserTimezone(cycleDetails.start_date ?? "")}
                        <ArrowRight className="my-auto h-3 w-3 flex-shrink-0" />
                        {renderFormattedDateInUserTimezone(cycleDetails.end_date ?? "")}
                      </span>
                    }
                    mergeDates
                    showTooltip={!!cycleDetails.start_date && !!cycleDetails.end_date} // show tooltip only if both start and end date are present
                    required={cycleDetails.status !== "draft"}
                    disabled={!isEditingAllowed || isArchived || isCompleted}
                  />
                )}
              />
              {projectUTCOffset && (
                <span className="cursor-default rounded-md bg-layer-1 px-2 py-1 text-11 text-tertiary">
                  {projectUTCOffset}
                </span>
              )}
            </div>
          )}
        />
      </div>
    </>
  );
});
