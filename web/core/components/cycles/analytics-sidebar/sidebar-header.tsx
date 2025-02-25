"use client";

import React, { FC, useEffect, useState } from "react";
import { observer } from "mobx-react";
import { Controller, useForm } from "react-hook-form";
import {
  ArchiveIcon,
  ArchiveRestoreIcon,
  CalendarCheck2,
  CalendarClock,
  ChevronRight,
  EllipsisIcon,
  LinkIcon,
  Trash2,
} from "lucide-react";
// types
import { CYCLE_STATUS, CYCLE_UPDATED, EUserPermissions, EUserPermissionsLevel } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { ICycle } from "@plane/types";
// ui
import { CustomMenu, setToast, TOAST_TYPE } from "@plane/ui";
// components
import { DateDropdown } from "@/components/dropdowns";
// helpers
import { renderFormattedPayloadDate, getDate } from "@/helpers/date-time.helper";
import { copyUrlToClipboard } from "@/helpers/string.helper";
// hooks
import { useCycle, useEventTracker, useUserPermissions } from "@/hooks/store";
import { useAppRouter } from "@/hooks/use-app-router";
// plane web constants
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
  const { t } = useTranslation();

  // form info
  const { control, reset, getValues } = useForm({
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
          title: t("project_cycles.action.restore.success.title"),
          message: t("project_cycles.action.restore.success.description"),
        });
        router.push(`/${workspaceSlug.toString()}/projects/${projectId.toString()}/archives/cycles`);
      })
      .catch(() =>
        setToast({
          type: TOAST_TYPE.ERROR,
          title: t("project_cycles.action.restore.failed.title"),
          message: t("project_cycles.action.restore.failed.description"),
        })
      );
  };

  const handleCopyText = () => {
    copyUrlToClipboard(`${workspaceSlug}/projects/${projectId}/cycles/${cycleDetails.id}`)
      .then(() => {
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: t("common.link_copied"),
          message: t("common.link_copied_to_clipboard"),
        });
      })
      .catch(() => {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: t("common.errors.default.message"),
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

  const handleDateChange = async (payload: { start_date?: string | null; end_date?: string | null }) => {
    let isDateValid = false;

    if (cycleDetails?.start_date && cycleDetails?.end_date)
      isDateValid = await dateChecker({
        ...payload,
        cycle_id: cycleDetails?.id,
      });
    else isDateValid = await dateChecker(payload);

    if (isDateValid) {
      submitChanges(payload, "date_range");
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
      reset({ ...cycleDetails });
    }
    return isDateValid;
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
                      {t("common.archive")}
                    </div>
                  ) : (
                    <div className="flex items-start gap-2">
                      <ArchiveIcon className="h-3 w-3" />
                      <div className="-mt-1">
                        <p>{t("common.archive")}</p>
                        <p className="text-xs text-custom-text-400">
                          {t("project_cycles.only_completed_cycles_can_be_archived")}
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
                    <span>{t("project_cycles.action.restore.title")}</span>
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
                    <span>{t("delete")}</span>
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
              {t(currentCycle.i18n_title)}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Controller
            name="start_date"
            control={control}
            rules={{ required: "Please select a date" }}
            render={({ field: { value, onChange } }) => (
              <DateDropdown
                value={value ?? null}
                onChange={async (val) => {
                  let isDateValid;
                  const valDate = val ? renderFormattedPayloadDate(val) : null;
                  if (getValues("end_date")) {
                    isDateValid = await handleDateChange({
                      start_date: valDate,
                      end_date: renderFormattedPayloadDate(getValues("end_date")),
                    });
                  } else {
                    isDateValid = await handleDateChange({
                      start_date: valDate,
                      end_date: valDate,
                    });
                  }
                  isDateValid && onChange(renderFormattedPayloadDate(val));
                }}
                placeholder={t("common.order_by.start_date")}
                icon={<CalendarClock className="h-3 w-3 flex-shrink-0" />}
                buttonVariant={value ? "border-with-text" : "border-without-text"}
                buttonContainerClassName={`h-6 w-full flex ${!isEditingAllowed || isArchived || isCompleted ? "cursor-not-allowed" : "cursor-pointer"} items-center gap-1.5 text-custom-text-300 rounded text-xs`}
                optionsClassName="z-10"
                disabled={!isEditingAllowed || isArchived || isCompleted}
                showTooltip
                maxDate={getDate(getValues("end_date"))}
                isClearable={false}
              />
            )}
          />

          <Controller
            name="end_date"
            control={control}
            rules={{ required: "Please select a date" }}
            render={({ field: { value, onChange } }) => (
              <DateDropdown
                value={getDate(value) ?? null}
                onChange={async (val) => {
                  let isDateValid;
                  const valDate = val ? renderFormattedPayloadDate(val) : null;
                  if (getValues("start_date")) {
                    isDateValid = await handleDateChange({
                      end_date: valDate,
                      start_date: renderFormattedPayloadDate(getValues("start_date")),
                    });
                  } else {
                    isDateValid = await handleDateChange({
                      end_date: valDate,
                      start_date: valDate,
                    });
                  }
                  isDateValid && onChange(renderFormattedPayloadDate(val));
                }}
                placeholder={t("common.order_by.due_date")}
                icon={<CalendarCheck2 className="h-3 w-3 flex-shrink-0" />}
                buttonVariant={value ? "border-with-text" : "border-without-text"}
                buttonContainerClassName={`h-6 w-full flex ${!isEditingAllowed || isArchived || isCompleted ? "cursor-not-allowed" : "cursor-pointer"} items-center gap-1.5 text-custom-text-300 rounded text-xs`}
                optionsClassName="z-10"
                disabled={!isEditingAllowed || isArchived || isCompleted}
                showTooltip
                minDate={getDate(getValues("start_date"))}
                isClearable={false}
              />
            )}
          />
        </div>
      </div>
    </>
  );
});
