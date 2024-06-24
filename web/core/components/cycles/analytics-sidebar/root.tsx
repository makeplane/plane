"use client";

import React, { useEffect, useState } from "react";
import isEmpty from "lodash/isEmpty";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
// icons
import { ArchiveRestoreIcon, LinkIcon, Trash2, ChevronRight, CalendarClock, SquareUser } from "lucide-react";
// types
import { ICycle } from "@plane/types";
// ui
import { Avatar, ArchiveIcon, CustomMenu, Loader, LayersIcon, TOAST_TYPE, setToast, TextArea } from "@plane/ui";
// components
import { ArchiveCycleModal, CycleDeleteModal, CycleAnalyticsProgress } from "@/components/cycles";
import { DateRangeDropdown } from "@/components/dropdowns";
// constants
import { CYCLE_STATUS } from "@/constants/cycle";
import { CYCLE_UPDATED } from "@/constants/event-tracker";
import { EUserWorkspaceRoles } from "@/constants/workspace";
// helpers
import { findHowManyDaysLeft, getDate, renderFormattedPayloadDate } from "@/helpers/date-time.helper";
import { copyUrlToClipboard } from "@/helpers/string.helper";
// hooks
import { useEventTracker, useCycle, useUser, useMember, useProjectEstimates } from "@/hooks/store";
import { useAppRouter } from "@/hooks/use-app-router";
// plane web constants
import { EEstimateSystem } from "@/plane-web/constants/estimates";
// services
import { CycleService } from "@/services/cycle.service";

type Props = {
  cycleId: string;
  handleClose: () => void;
  isArchived?: boolean;
};

const defaultValues: Partial<ICycle> = {
  start_date: null,
  end_date: null,
};

// services
const cycleService = new CycleService();

// TODO: refactor the whole component
export const CycleDetailsSidebar: React.FC<Props> = observer((props) => {
  const { cycleId, handleClose, isArchived } = props;
  // states
  const [archiveCycleModal, setArchiveCycleModal] = useState(false);
  const [cycleDeleteModal, setCycleDeleteModal] = useState(false);
  // router
  const router = useAppRouter();
  const { workspaceSlug, projectId } = useParams();
  // store hooks
  const { setTrackElement, captureCycleEvent } = useEventTracker();
  const { areEstimateEnabledByProjectId, currentActiveEstimateId, estimateById } = useProjectEstimates();
  const {
    membership: { currentProjectRole },
  } = useUser();
  const { getCycleById, updateCycleDetails, restoreCycle } = useCycle();
  const { getUserDetails } = useMember();
  // derived values
  const cycleDetails = getCycleById(cycleId);
  const cycleOwnerDetails = cycleDetails ? getUserDetails(cycleDetails.owned_by_id) : undefined;
  // form info
  const { control, reset } = useForm({
    defaultValues,
  });

  const submitChanges = (data: Partial<ICycle>, changedProperty: string) => {
    if (!workspaceSlug || !projectId || !cycleId) return;

    updateCycleDetails(workspaceSlug.toString(), projectId.toString(), cycleId.toString(), data)
      .then((res) => {
        captureCycleEvent({
          eventName: CYCLE_UPDATED,
          payload: {
            ...res,
            changed_properties: [changedProperty],
            element: "Right side-peek",
            state: "SUCCESS",
          },
        });
      })

      .catch(() => {
        captureCycleEvent({
          eventName: CYCLE_UPDATED,
          payload: {
            ...data,
            element: "Right side-peek",
            state: "FAILED",
          },
        });
      });
  };

  const handleCopyText = () => {
    copyUrlToClipboard(`${workspaceSlug}/projects/${projectId}/cycles/${cycleId}`)
      .then(() => {
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: "Link Copied!",
          message: "Cycle link copied to clipboard.",
        });
      })
      .catch(() => {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Some error occurred",
        });
      });
  };

  const handleRestoreCycle = async () => {
    if (!workspaceSlug || !projectId) return;

    await restoreCycle(workspaceSlug.toString(), projectId.toString(), cycleId)
      .then(() => {
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: "Restore success",
          message: "Your cycle can be found in project cycles.",
        });
        router.push(`/${workspaceSlug.toString()}/projects/${projectId.toString()}/archives/cycles`);
      })
      .catch(() =>
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Error!",
          message: "Cycle could not be restored. Please try again.",
        })
      );
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
    if (!startDate || !endDate) return;

    let isDateValid = false;

    const payload = {
      start_date: renderFormattedPayloadDate(startDate),
      end_date: renderFormattedPayloadDate(endDate),
    };

    if (cycleDetails && cycleDetails.start_date && cycleDetails.end_date)
      isDateValid = await dateChecker({
        ...payload,
        cycle_id: cycleDetails.id,
      });
    else isDateValid = await dateChecker(payload);

    if (isDateValid) {
      submitChanges(payload, "date_range");
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: "Success!",
        message: "Cycle updated successfully.",
      });
    } else {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error!",
        message:
          "You already have a cycle on the given dates, if you want to create a draft cycle, you can do that by removing both the dates.",
      });
      reset({ ...cycleDetails });
    }
  };

  const cycleStatus = cycleDetails?.status?.toLocaleLowerCase();
  const isCompleted = cycleStatus === "completed";

  if (!cycleDetails)
    return (
      <Loader className="px-5">
        <div className="space-y-2">
          <Loader.Item height="15px" width="50%" />
          <Loader.Item height="15px" width="30%" />
        </div>
        <div className="mt-8 space-y-3">
          <Loader.Item height="30px" />
          <Loader.Item height="30px" />
          <Loader.Item height="30px" />
        </div>
      </Loader>
    );

  const currentCycle = CYCLE_STATUS.find((status) => status.value === cycleStatus);

  const areEstimateEnabled = projectId && areEstimateEnabledByProjectId(projectId.toString());
  const estimateType = areEstimateEnabled && currentActiveEstimateId && estimateById(currentActiveEstimateId);
  // NOTE: validate if the cycle is snapshot and the estimate system is points
  const isEstimatePointValid = isEmpty(cycleDetails?.progress_snapshot || {})
    ? estimateType && estimateType?.type == EEstimateSystem.POINTS
      ? true
      : false
    : isEmpty(cycleDetails?.progress_snapshot?.estimate_distribution || {})
      ? false
      : true;

  const issueCount =
    isCompleted && !isEmpty(cycleDetails.progress_snapshot)
      ? cycleDetails.progress_snapshot.total_issues === 0
        ? "0 Issue"
        : `${cycleDetails.progress_snapshot.completed_issues}/${cycleDetails.progress_snapshot.total_issues}`
      : cycleDetails.total_issues === 0
        ? "0 Issue"
        : `${cycleDetails.completed_issues}/${cycleDetails.total_issues}`;

  const issueEstimatePointCount =
    isCompleted && !isEmpty(cycleDetails.progress_snapshot)
      ? cycleDetails.progress_snapshot.total_issues === 0
        ? "0 Issue"
        : `${cycleDetails.progress_snapshot.completed_estimate_points}/${cycleDetails.progress_snapshot.total_estimate_points}`
      : cycleDetails.total_issues === 0
        ? "0 Issue"
        : `${cycleDetails.completed_estimate_points}/${cycleDetails.total_estimate_points}`;

  const daysLeft = findHowManyDaysLeft(cycleDetails.end_date);

  const isEditingAllowed = !!currentProjectRole && currentProjectRole >= EUserWorkspaceRoles.MEMBER;

  return (
    <div className="relative">
      {cycleDetails && workspaceSlug && projectId && (
        <>
          <ArchiveCycleModal
            workspaceSlug={workspaceSlug.toString()}
            projectId={projectId.toString()}
            cycleId={cycleId}
            isOpen={archiveCycleModal}
            handleClose={() => setArchiveCycleModal(false)}
          />
          <CycleDeleteModal
            cycle={cycleDetails}
            isOpen={cycleDeleteModal}
            handleClose={() => setCycleDeleteModal(false)}
            workspaceSlug={workspaceSlug.toString()}
            projectId={projectId.toString()}
          />
        </>
      )}

      <>
        <div className="sticky z-10 top-0 flex items-center justify-between bg-custom-sidebar-background-100 py-5">
          <div>
            <button
              className="flex h-5 w-5 items-center justify-center rounded-full bg-custom-border-300"
              onClick={() => handleClose()}
            >
              <ChevronRight className="h-3 w-3 stroke-2 text-white" />
            </button>
          </div>
          <div className="flex items-center gap-3.5">
            {!isArchived && (
              <button onClick={handleCopyText}>
                <LinkIcon className="h-3 w-3 text-custom-text-300" />
              </button>
            )}
            {isEditingAllowed && (
              <CustomMenu placement="bottom-end" ellipsis>
                {!isArchived && (
                  <CustomMenu.MenuItem onClick={() => setArchiveCycleModal(true)} disabled={!isCompleted}>
                    {isCompleted ? (
                      <div className="flex items-center gap-2">
                        <ArchiveIcon className="h-3 w-3" />
                        Archive cycle
                      </div>
                    ) : (
                      <div className="flex items-start gap-2">
                        <ArchiveIcon className="h-3 w-3" />
                        <div className="-mt-1">
                          <p>Archive cycle</p>
                          <p className="text-xs text-custom-text-400">
                            Only completed cycle <br /> can be archived.
                          </p>
                        </div>
                      </div>
                    )}
                  </CustomMenu.MenuItem>
                )}
                {isArchived && (
                  <CustomMenu.MenuItem onClick={handleRestoreCycle}>
                    <span className="flex items-center justify-start gap-2">
                      <ArchiveRestoreIcon className="h-3 w-3" />
                      <span>Restore cycle</span>
                    </span>
                  </CustomMenu.MenuItem>
                )}
                {!isCompleted && (
                  <CustomMenu.MenuItem
                    onClick={() => {
                      setTrackElement("CYCLE_PAGE_SIDEBAR");
                      setCycleDeleteModal(true);
                    }}
                  >
                    <span className="flex items-center justify-start gap-2">
                      <Trash2 className="h-3 w-3" />
                      <span>Delete cycle</span>
                    </span>
                  </CustomMenu.MenuItem>
                )}
              </CustomMenu>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-3 pt-2">
          <div className="flex items-center gap-5">
            {currentCycle && (
              <span
                className="flex h-6 w-20 items-center justify-center rounded-sm text-center text-xs"
                style={{
                  color: currentCycle.color,
                  backgroundColor: `${currentCycle.color}20`,
                }}
              >
                {currentCycle.value === "current" && daysLeft !== undefined
                  ? `${daysLeft} ${currentCycle.label}`
                  : `${currentCycle.label}`}
              </span>
            )}
          </div>
          <h4 className="w-full break-words text-xl font-semibold text-custom-text-100">{cycleDetails.name}</h4>
        </div>

        {cycleDetails.description && (
          <TextArea
            className="outline-none ring-none w-full max-h-max bg-transparent !p-0 !m-0 !border-0 resize-none text-sm leading-5 text-custom-text-200"
            value={cycleDetails.description}
            disabled
          />
        )}

        <div className="flex flex-col gap-5 pb-6 pt-2.5">
          <div className="flex items-center justify-start gap-1">
            <div className="flex w-2/5 items-center justify-start gap-2 text-custom-text-300">
              <CalendarClock className="h-4 w-4" />
              <span className="text-base">Date range</span>
            </div>
            <div className="h-7 w-3/5">
              <Controller
                control={control}
                name="start_date"
                render={({ field: { value: startDateValue, onChange: onChangeStartDate } }) => (
                  <Controller
                    control={control}
                    name="end_date"
                    render={({ field: { value: endDateValue, onChange: onChangeEndDate } }) => (
                      <DateRangeDropdown
                        className="h-7"
                        buttonContainerClassName="w-full"
                        buttonVariant="background-with-text"
                        minDate={new Date()}
                        value={{
                          from: getDate(startDateValue),
                          to: getDate(endDateValue),
                        }}
                        onSelect={(val) => {
                          onChangeStartDate(val?.from ? renderFormattedPayloadDate(val.from) : null);
                          onChangeEndDate(val?.to ? renderFormattedPayloadDate(val.to) : null);
                          handleDateChange(val?.from, val?.to);
                        }}
                        placeholder={{
                          from: "Start date",
                          to: "End date",
                        }}
                        required={cycleDetails.status !== "draft"}
                        disabled={!isEditingAllowed || isArchived}
                      />
                    )}
                  />
                )}
              />
            </div>
          </div>

          <div className="flex items-center justify-start gap-1">
            <div className="flex w-2/5 items-center justify-start gap-2 text-custom-text-300">
              <SquareUser className="h-4 w-4" />
              <span className="text-base">Lead</span>
            </div>
            <div className="flex w-3/5 items-center rounded-sm">
              <div className="flex items-center gap-2.5">
                <Avatar name={cycleOwnerDetails?.display_name} src={cycleOwnerDetails?.avatar} />
                <span className="text-sm text-custom-text-200">{cycleOwnerDetails?.display_name}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-start gap-1">
            <div className="flex w-2/5 items-center justify-start gap-2 text-custom-text-300">
              <LayersIcon className="h-4 w-4" />
              <span className="text-base">Issues</span>
            </div>
            <div className="flex w-3/5 items-center">
              <span className="px-1.5 text-sm text-custom-text-300">{issueCount}</span>
            </div>
          </div>

          {/**
           * NOTE: Render this section when estimate points of he projects is enabled and the estimate system is points
           */}
          {isEstimatePointValid && (
            <div className="flex items-center justify-start gap-1">
              <div className="flex w-2/5 items-center justify-start gap-2 text-custom-text-300">
                <LayersIcon className="h-4 w-4" />
                <span className="text-base">Points</span>
              </div>
              <div className="flex w-3/5 items-center">
                <span className="px-1.5 text-sm text-custom-text-300">{issueEstimatePointCount}</span>
              </div>
            </div>
          )}
        </div>

        {workspaceSlug && projectId && cycleDetails?.id && (
          <CycleAnalyticsProgress
            workspaceSlug={workspaceSlug.toString()}
            projectId={projectId.toString()}
            cycleId={cycleDetails?.id}
          />
        )}
      </>
    </div>
  );
});
