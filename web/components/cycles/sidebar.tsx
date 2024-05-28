import React, { useCallback, useEffect, useState } from "react";
import isEmpty from "lodash/isEmpty";
import { observer } from "mobx-react";
import { useRouter } from "next/router";
import { Controller, useForm } from "react-hook-form";
// icons
import {
  ArchiveRestoreIcon,
  ChevronDown,
  LinkIcon,
  Trash2,
  UserCircle2,
  AlertCircle,
  ChevronRight,
  CalendarClock,
} from "lucide-react";
import { Disclosure, Transition } from "@headlessui/react";
// types
import { ICycle, IIssueFilterOptions } from "@plane/types";
// ui
import { Avatar, ArchiveIcon, CustomMenu, Loader, LayersIcon, TOAST_TYPE, setToast, TextArea } from "@plane/ui";
// components
import { SidebarProgressStats } from "@/components/core";
import ProgressChart from "@/components/core/sidebar/progress-chart";
import { ArchiveCycleModal, CycleDeleteModal } from "@/components/cycles";
import { DateRangeDropdown } from "@/components/dropdowns";
// constants
import { CYCLE_STATUS } from "@/constants/cycle";
import { CYCLE_UPDATED } from "@/constants/event-tracker";
import { EIssueFilterType, EIssuesStoreType } from "@/constants/issue";
import { EUserWorkspaceRoles } from "@/constants/workspace";
// helpers
import { findHowManyDaysLeft, getDate, renderFormattedPayloadDate } from "@/helpers/date-time.helper";
import { copyUrlToClipboard } from "@/helpers/string.helper";
// hooks
import { useEventTracker, useCycle, useUser, useMember, useIssues } from "@/hooks/store";
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
  const router = useRouter();
  const { workspaceSlug, projectId, peekCycle } = router.query;
  // store hooks
  const { setTrackElement, captureCycleEvent } = useEventTracker();
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

  const {
    issuesFilter: { issueFilters, updateFilters },
  } = useIssues(EIssuesStoreType.CYCLE);

  const handleFiltersUpdate = useCallback(
    (key: keyof IIssueFilterOptions, value: string | string[]) => {
      if (!workspaceSlug || !projectId) return;
      const newValues = issueFilters?.filters?.[key] ?? [];

      if (Array.isArray(value)) {
        // this validation is majorly for the filter start_date, target_date custom
        value.forEach((val) => {
          if (!newValues.includes(val)) newValues.push(val);
          else newValues.splice(newValues.indexOf(val), 1);
        });
      } else {
        if (issueFilters?.filters?.[key]?.includes(value)) newValues.splice(newValues.indexOf(value), 1);
        else newValues.push(value);
      }

      updateFilters(
        workspaceSlug.toString(),
        projectId.toString(),
        EIssueFilterType.FILTERS,
        { [key]: newValues },
        cycleId
      );
    },
    [workspaceSlug, projectId, cycleId, issueFilters, updateFilters]
  );

  const cycleStatus = cycleDetails?.status?.toLocaleLowerCase();
  const isCompleted = cycleStatus === "completed";

  const startDate = getDate(cycleDetails?.start_date);
  const endDate = getDate(cycleDetails?.end_date);

  const isStartValid = startDate && startDate <= new Date();
  const isEndValid = endDate && startDate && endDate >= startDate;

  const progressPercentage = cycleDetails
    ? isCompleted && cycleDetails?.progress_snapshot
      ? Math.round(
          (cycleDetails.progress_snapshot.completed_issues / cycleDetails.progress_snapshot.total_issues) * 100
        )
      : Math.round((cycleDetails.completed_issues / cycleDetails.total_issues) * 100)
    : null;

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

  const issueCount =
    isCompleted && !isEmpty(cycleDetails.progress_snapshot)
      ? cycleDetails.progress_snapshot.total_issues === 0
        ? "0 Issue"
        : `${cycleDetails.progress_snapshot.completed_issues}/${cycleDetails.progress_snapshot.total_issues}`
      : cycleDetails.total_issues === 0
        ? "0 Issue"
        : `${cycleDetails.completed_issues}/${cycleDetails.total_issues}`;

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
              <UserCircle2 className="h-4 w-4" />
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
        </div>

        <div className="flex flex-col">
          <div className="flex w-full flex-col items-center justify-start gap-2 border-t border-custom-border-200 px-1.5 py-5">
            <Disclosure defaultOpen>
              {({ open }) => (
                <div className={`relative  flex  h-full w-full flex-col ${open ? "" : "flex-row"}`}>
                  <Disclosure.Button
                    className="flex w-full items-center justify-between gap-2 p-1.5"
                    disabled={!isStartValid || !isEndValid}
                  >
                    <div className="flex items-center justify-start gap-2 text-sm">
                      <span className="font-medium text-custom-text-200">Progress</span>
                    </div>

                    <div className="flex items-center gap-2.5">
                      {progressPercentage ? (
                        <span className="flex h-5 w-9 items-center justify-center rounded bg-amber-500/20 text-xs font-medium text-amber-500">
                          {progressPercentage ? `${progressPercentage}%` : ""}
                        </span>
                      ) : (
                        ""
                      )}
                      {isStartValid && isEndValid ? (
                        <ChevronDown className={`h-3 w-3 ${open ? "rotate-180 transform" : ""}`} aria-hidden="true" />
                      ) : (
                        <div className="flex items-center gap-1">
                          <AlertCircle height={14} width={14} className="text-custom-text-200" />
                          <span className="text-xs italic text-custom-text-200">
                            {cycleDetails?.start_date && cycleDetails?.end_date
                              ? "This cycle isn't active yet."
                              : "Invalid date. Please enter valid date."}
                          </span>
                        </div>
                      )}
                    </div>
                  </Disclosure.Button>
                  <Transition show={open}>
                    <Disclosure.Panel>
                      <div className="flex flex-col gap-3">
                        {isCompleted && !isEmpty(cycleDetails.progress_snapshot) ? (
                          <>
                            {cycleDetails.progress_snapshot.distribution?.completion_chart &&
                              cycleDetails.start_date &&
                              cycleDetails.end_date && (
                                <div className="h-full w-full pt-4">
                                  <div className="flex  items-start  gap-4 py-2 text-xs">
                                    <div className="flex items-center gap-3 text-custom-text-100">
                                      <div className="flex items-center justify-center gap-1">
                                        <span className="h-2.5 w-2.5 rounded-full bg-[#A9BBD0]" />
                                        <span>Ideal</span>
                                      </div>
                                      <div className="flex items-center justify-center gap-1">
                                        <span className="h-2.5 w-2.5 rounded-full bg-[#4C8FFF]" />
                                        <span>Current</span>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="relative h-40 w-80">
                                    <ProgressChart
                                      distribution={cycleDetails.progress_snapshot.distribution?.completion_chart}
                                      startDate={cycleDetails.start_date}
                                      endDate={cycleDetails.end_date}
                                      totalIssues={cycleDetails.progress_snapshot.total_issues}
                                    />
                                  </div>
                                </div>
                              )}
                          </>
                        ) : (
                          <>
                            {cycleDetails.distribution?.completion_chart &&
                              cycleDetails.start_date &&
                              cycleDetails.end_date && (
                                <div className="h-full w-full pt-4">
                                  <div className="flex  items-start  gap-4 py-2 text-xs">
                                    <div className="flex items-center gap-3 text-custom-text-100">
                                      <div className="flex items-center justify-center gap-1">
                                        <span className="h-2.5 w-2.5 rounded-full bg-[#A9BBD0]" />
                                        <span>Ideal</span>
                                      </div>
                                      <div className="flex items-center justify-center gap-1">
                                        <span className="h-2.5 w-2.5 rounded-full bg-[#4C8FFF]" />
                                        <span>Current</span>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="relative h-40 w-80">
                                    <ProgressChart
                                      distribution={cycleDetails.distribution?.completion_chart}
                                      startDate={cycleDetails.start_date}
                                      endDate={cycleDetails.end_date}
                                      totalIssues={cycleDetails.total_issues}
                                    />
                                  </div>
                                </div>
                              )}
                          </>
                        )}
                        {/* stats */}
                        {isCompleted && !isEmpty(cycleDetails.progress_snapshot) ? (
                          <>
                            {cycleDetails.progress_snapshot.total_issues > 0 &&
                              cycleDetails.progress_snapshot.distribution && (
                                <div className="h-full w-full border-t border-custom-border-200 pt-5">
                                  <SidebarProgressStats
                                    distribution={cycleDetails.progress_snapshot.distribution}
                                    groupedIssues={{
                                      backlog: cycleDetails.progress_snapshot.backlog_issues,
                                      unstarted: cycleDetails.progress_snapshot.unstarted_issues,
                                      started: cycleDetails.progress_snapshot.started_issues,
                                      completed: cycleDetails.progress_snapshot.completed_issues,
                                      cancelled: cycleDetails.progress_snapshot.cancelled_issues,
                                    }}
                                    totalIssues={cycleDetails.progress_snapshot.total_issues}
                                    isPeekView={Boolean(peekCycle)}
                                    isCompleted={isCompleted}
                                    filters={issueFilters}
                                    handleFiltersUpdate={handleFiltersUpdate}
                                  />
                                </div>
                              )}
                          </>
                        ) : (
                          <>
                            {cycleDetails.total_issues > 0 && cycleDetails.distribution && (
                              <div className="h-full w-full border-t border-custom-border-200 pt-5">
                                <SidebarProgressStats
                                  distribution={cycleDetails.distribution}
                                  groupedIssues={{
                                    backlog: cycleDetails.backlog_issues,
                                    unstarted: cycleDetails.unstarted_issues,
                                    started: cycleDetails.started_issues,
                                    completed: cycleDetails.completed_issues,
                                    cancelled: cycleDetails.cancelled_issues,
                                  }}
                                  totalIssues={cycleDetails.total_issues}
                                  isPeekView={Boolean(peekCycle)}
                                  isCompleted={isCompleted}
                                  filters={issueFilters}
                                  handleFiltersUpdate={handleFiltersUpdate}
                                />
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </Disclosure.Panel>
                  </Transition>
                </div>
              )}
            </Disclosure>
          </div>
        </div>
      </>
    </div>
  );
});
