"use client";

import React, { FC, useEffect, useState } from "react";
import { observer } from "mobx-react";
import { Controller, useForm } from "react-hook-form";
import { ArchiveIcon, ArchiveRestoreIcon, ChevronRight, EllipsisIcon, LinkIcon, Trash2 } from "lucide-react";
// types
import { ICycle } from "@plane/types";
// ui
import { CustomMenu, setToast, TOAST_TYPE } from "@plane/ui";
// components
import { DateRangeDropdown } from "@/components/dropdowns";
// constants
import { CYCLE_STATUS } from "@/constants/cycle";
import { CYCLE_UPDATED } from "@/constants/event-tracker";
// helpers
import { renderFormattedPayloadDate, getDate } from "@/helpers/date-time.helper";
import { copyUrlToClipboard } from "@/helpers/string.helper";
// hooks
import { useCycle, useEventTracker, useUserPermissions } from "@/hooks/store";
import { useAppRouter } from "@/hooks/use-app-router";
// plane web constants
import { EUserPermissions, EUserPermissionsLevel } from "@/plane-web/constants/user-permissions";
// services
import { CycleService } from "@/services/cycle.service";
// local components
import { ArchiveCycleModal } from "../archived-cycles";
import { CycleDeleteModal } from "../delete-modal";

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
  // router
  const router = useAppRouter();
  // states
  const [archiveCycleModal, setArchiveCycleModal] = useState(false);
  const [cycleDeleteModal, setCycleDeleteModal] = useState(false);
  // hooks
  const { allowPermissions } = useUserPermissions();
  const { updateCycleDetails, restoreCycle } = useCycle();
  const { setTrackElement, captureCycleEvent } = useEventTracker();

  // form info
  const { control, reset } = useForm({
    defaultValues,
  });

  const cycleStatus = cycleDetails?.status?.toLocaleLowerCase();
  const isCompleted = cycleStatus === "completed";

  const currentCycle = CYCLE_STATUS.find((status) => status.value === cycleStatus);

  const handleRestoreCycle = async () => {
    if (!workspaceSlug || !projectId) return;

    await restoreCycle(workspaceSlug.toString(), projectId.toString(), cycleDetails.id)
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

  const handleCopyText = () => {
    copyUrlToClipboard(`${workspaceSlug}/projects/${projectId}/cycles/${cycleDetails.id}`)
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

  const submitChanges = (data: Partial<ICycle>, changedProperty: string) => {
    if (!workspaceSlug || !projectId || !cycleDetails.id) return;

    updateCycleDetails(workspaceSlug.toString(), projectId.toString(), cycleDetails.id.toString(), data)
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

    if (cycleDetails?.start_date && cycleDetails.end_date)
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

  const isEditingAllowed = allowPermissions(
    [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
    EUserPermissionsLevel.PROJECT
  );

  return (
    <>
      {cycleDetails && workspaceSlug && projectId && (
        <>
          <ArchiveCycleModal
            workspaceSlug={workspaceSlug.toString()}
            projectId={projectId.toString()}
            cycleId={cycleDetails.id}
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
      <div className="sticky z-10 top-0 pt-2 flex items-center justify-between bg-custom-sidebar-background-100">
        <div className="flex items-center justify-center size-5">
          <button
            className="flex size-4 items-center justify-center rounded-full bg-custom-border-200"
            onClick={() => handleClose()}
          >
            <ChevronRight className="h-3 w-3 stroke-2 text-white" />
          </button>
        </div>
        <div className="flex items-center gap-3">
          {!isArchived && (
            <button onClick={handleCopyText} className="size-4">
              <LinkIcon className="size-3.5 text-custom-text-300" />
            </button>
          )}
          {isEditingAllowed && (
            <CustomMenu
              placement="bottom-end"
              customButtonClassName="size-4"
              customButton={<EllipsisIcon className="size-3.5 text-custom-text-300" />}
            >
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
                          Only completed cycles <br /> can be archived.
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
              {currentCycle.title}
            </span>
          )}
        </div>

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
                  buttonVariant="transparent-with-text"
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
                  disabled={!isEditingAllowed || isArchived || isCompleted}
                />
              )}
            />
          )}
        />
      </div>
    </>
  );
});
