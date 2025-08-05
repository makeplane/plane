"use client";

import React, { FC, useEffect } from "react";
import { observer } from "mobx-react";
import { Controller, useForm } from "react-hook-form";
import { ArrowRight, ChevronRight } from "lucide-react";
// Plane Imports
import {
  CYCLE_TRACKER_EVENTS,
  CYCLE_STATUS,
  EUserPermissions,
  EUserPermissionsLevel,
  CYCLE_TRACKER_ELEMENTS,
} from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { ICycle } from "@plane/types";
import { setToast, TOAST_TYPE } from "@plane/ui";
import { getDate, renderFormattedPayloadDate } from "@plane/utils";
// components
import { DateRangeDropdown } from "@/components/dropdowns";
// hooks
import { captureElementAndEvent } from "@/helpers/event-tracker.helper";
import { useCycle, useUserPermissions } from "@/hooks/store";
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

export const CycleSidebarHeader: FC<Props> = observer((props) => {
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

    await updateCycleDetails(workspaceSlug.toString(), projectId.toString(), cycleDetails.id.toString(), data)
      .then(() => {
        captureElementAndEvent({
          element: {
            elementName: CYCLE_TRACKER_ELEMENTS.RIGHT_SIDEBAR,
          },
          event: {
            eventName: CYCLE_TRACKER_EVENTS.update,
            state: "SUCCESS",
            payload: {
              id: cycleDetails.id,
            },
          },
        });
      })

      .catch(() => {
        captureElementAndEvent({
          element: {
            elementName: CYCLE_TRACKER_ELEMENTS.RIGHT_SIDEBAR,
          },
          event: {
            eventName: CYCLE_TRACKER_EVENTS.update,
            state: "ERROR",
            payload: {
              id: cycleDetails.id,
            },
          },
        });
      });
  };

  useEffect(() => {
    if (cycleDetails)
      reset({
        ...cycleDetails,
      });
  }, [cycleDetails, reset]);

  const dateChecker = async (payload: any) => {
    try {
      const res = await cycleService.cycleDateCheck(workspaceSlug as string, projectId as string, payload);
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
      <div className="sticky z-10 top-0 pt-2 flex items-center justify-between bg-custom-sidebar-background-100">
        <div className="flex items-center justify-center size-5">
          <button
            className="flex size-4 items-center justify-center rounded-full bg-custom-border-200"
            onClick={() => handleClose()}
          >
            <ChevronRight className="h-3 w-3 stroke-2 text-white" />
          </button>
        </div>
      </div>
      <div className="flex flex-col gap-2 w-full">
        <div className="flex items-start justify-between gap-3 pt-2">
          <h4 className="w-full break-words text-xl font-semibold text-custom-text-100">{cycleDetails.name}</h4>
          {currentCycle && (
            <span
              className="flex h-6 min-w-20 px-3 items-center justify-center rounded text-center text-xs font-medium"
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
            <div className="flex gap-2 items-center">
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
                        <ArrowRight className="h-3 w-3 flex-shrink-0 my-auto" />
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
                <span className="rounded-md text-xs px-2 cursor-default  py-1 bg-custom-background-80 text-custom-text-300">
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
