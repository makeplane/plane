import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
import { useForm } from "react-hook-form";
import { Disclosure, Popover, Transition } from "@headlessui/react";
// services
import { CycleService } from "services/cycle.service";
// hooks
import { useApplication, useCycle, useMember, useUser } from "hooks/store";
import useToast from "hooks/use-toast";
// components
import { SidebarProgressStats } from "components/core";
import ProgressChart from "components/core/sidebar/progress-chart";
import { CycleDeleteModal } from "components/cycles/delete-modal";
// ui
import { CustomRangeDatePicker } from "components/ui";
import { Avatar, CustomMenu, Loader, LayersIcon } from "@plane/ui";
// icons
import {
  ChevronDown,
  LinkIcon,
  Trash2,
  UserCircle2,
  AlertCircle,
  ChevronRight,
  CalendarCheck2,
  CalendarClock,
} from "lucide-react";
// helpers
import { copyUrlToClipboard } from "helpers/string.helper";
import {
  findHowManyDaysLeft,
  isDateGreaterThanToday,
  renderFormattedPayloadDate,
  renderFormattedDate,
} from "helpers/date-time.helper";
// types
import { ICycle } from "@plane/types";
// constants
import { EUserWorkspaceRoles } from "constants/workspace";
// fetch-keys
import { CYCLE_STATUS } from "constants/cycle";

type Props = {
  cycleId: string;
  handleClose: () => void;
};

const defaultValues: Partial<ICycle> = {
  start_date: null,
  end_date: null,
};

// services
const cycleService = new CycleService();

// TODO: refactor the whole component
export const CycleDetailsSidebar: React.FC<Props> = observer((props) => {
  const { cycleId, handleClose } = props;
  // states
  const [cycleDeleteModal, setCycleDeleteModal] = useState(false);
  // refs
  const startDateButtonRef = useRef<HTMLButtonElement | null>(null);
  const endDateButtonRef = useRef<HTMLButtonElement | null>(null);
  // router
  const router = useRouter();
  const { workspaceSlug, projectId, peekCycle } = router.query;
  // store hooks
  const {
    eventTracker: { setTrackElement },
  } = useApplication();
  const {
    membership: { currentProjectRole },
  } = useUser();
  const { getCycleById, updateCycleDetails } = useCycle();
  const { getUserDetails } = useMember();

  const cycleDetails = getCycleById(cycleId);
  const cycleOwnerDetails = cycleDetails ? getUserDetails(cycleDetails.owned_by) : undefined;

  const { setToastAlert } = useToast();

  const { setValue, reset, watch } = useForm({
    defaultValues,
  });

  const submitChanges = (data: Partial<ICycle>) => {
    if (!workspaceSlug || !projectId || !cycleId) return;

    updateCycleDetails(workspaceSlug.toString(), projectId.toString(), cycleId.toString(), data);
  };

  const handleCopyText = () => {
    copyUrlToClipboard(`${workspaceSlug}/projects/${projectId}/cycles/${cycleId}`)
      .then(() => {
        setToastAlert({
          type: "success",
          title: "Link Copied!",
          message: "Cycle link copied to clipboard.",
        });
      })
      .catch(() => {
        setToastAlert({
          type: "error",
          title: "Some error occurred",
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

  const handleStartDateChange = async (date: string) => {
    setValue("start_date", date);

    if (!watch("end_date") || watch("end_date") === "") endDateButtonRef.current?.click();

    if (watch("start_date") && watch("end_date") && watch("start_date") !== "" && watch("start_date") !== "") {
      if (!isDateGreaterThanToday(`${watch("end_date")}`)) {
        setToastAlert({
          type: "error",
          title: "Error!",
          message: "Unable to create cycle in past date. Please enter a valid date.",
        });
        reset({ ...cycleDetails });
        return;
      }

      if (cycleDetails?.start_date && cycleDetails?.end_date) {
        const isDateValidForExistingCycle = await dateChecker({
          start_date: `${watch("start_date")}`,
          end_date: `${watch("end_date")}`,
          cycle_id: cycleDetails.id,
        });

        if (isDateValidForExistingCycle) {
          submitChanges({
            start_date: renderFormattedPayloadDate(`${watch("start_date")}`),
            end_date: renderFormattedPayloadDate(`${watch("end_date")}`),
          });
          setToastAlert({
            type: "success",
            title: "Success!",
            message: "Cycle updated successfully.",
          });
        } else {
          setToastAlert({
            type: "error",
            title: "Error!",
            message:
              "You have a cycle already on the given dates, if you want to create your draft cycle you can do that by removing dates",
          });
        }

        reset({ ...cycleDetails });
        return;
      }

      const isDateValid = await dateChecker({
        start_date: `${watch("start_date")}`,
        end_date: `${watch("end_date")}`,
      });

      if (isDateValid) {
        submitChanges({
          start_date: renderFormattedPayloadDate(`${watch("start_date")}`),
          end_date: renderFormattedPayloadDate(`${watch("end_date")}`),
        });
        setToastAlert({
          type: "success",
          title: "Success!",
          message: "Cycle updated successfully.",
        });
      } else {
        setToastAlert({
          type: "error",
          title: "Error!",
          message:
            "You have a cycle already on the given dates, if you want to create your draft cycle you can do that by removing dates",
        });
        reset({ ...cycleDetails });
      }
    }
  };

  const handleEndDateChange = async (date: string) => {
    setValue("end_date", date);

    if (!watch("start_date") || watch("start_date") === "") startDateButtonRef.current?.click();

    if (watch("start_date") && watch("end_date") && watch("start_date") !== "" && watch("start_date") !== "") {
      if (!isDateGreaterThanToday(`${watch("end_date")}`)) {
        setToastAlert({
          type: "error",
          title: "Error!",
          message: "Unable to create cycle in past date. Please enter a valid date.",
        });
        reset({ ...cycleDetails });
        return;
      }

      if (cycleDetails?.start_date && cycleDetails?.end_date) {
        const isDateValidForExistingCycle = await dateChecker({
          start_date: `${watch("start_date")}`,
          end_date: `${watch("end_date")}`,
          cycle_id: cycleDetails.id,
        });

        if (isDateValidForExistingCycle) {
          submitChanges({
            start_date: renderFormattedPayloadDate(`${watch("start_date")}`),
            end_date: renderFormattedPayloadDate(`${watch("end_date")}`),
          });
          setToastAlert({
            type: "success",
            title: "Success!",
            message: "Cycle updated successfully.",
          });
        } else {
          setToastAlert({
            type: "error",
            title: "Error!",
            message:
              "You have a cycle already on the given dates, if you want to create your draft cycle you can do that by removing dates",
          });
        }
        reset({ ...cycleDetails });
        return;
      }

      const isDateValid = await dateChecker({
        start_date: `${watch("start_date")}`,
        end_date: `${watch("end_date")}`,
      });

      if (isDateValid) {
        submitChanges({
          start_date: renderFormattedPayloadDate(`${watch("start_date")}`),
          end_date: renderFormattedPayloadDate(`${watch("end_date")}`),
        });
        setToastAlert({
          type: "success",
          title: "Success!",
          message: "Cycle updated successfully.",
        });
      } else {
        setToastAlert({
          type: "error",
          title: "Error!",
          message:
            "You have a cycle already on the given dates, if you want to create your draft cycle you can do that by removing dates",
        });
        reset({ ...cycleDetails });
      }
    }
  };

  // TODO: refactor this
  // const handleFiltersUpdate = useCallback(
  //   (key: keyof IIssueFilterOptions, value: string | string[]) => {
  //     if (!workspaceSlug || !projectId) return;
  //     const newValues = issueFilters?.filters?.[key] ?? [];

  //     if (Array.isArray(value)) {
  //       value.forEach((val) => {
  //         if (!newValues.includes(val)) newValues.push(val);
  //       });
  //     } else {
  //       if (issueFilters?.filters?.[key]?.includes(value)) newValues.splice(newValues.indexOf(value), 1);
  //       else newValues.push(value);
  //     }

  //     updateFilters(workspaceSlug.toString(), projectId.toString(), EFilterType.FILTERS, { [key]: newValues }, cycleId);
  //   },
  //   [workspaceSlug, projectId, cycleId, issueFilters, updateFilters]
  // );

  const cycleStatus = cycleDetails?.status.toLocaleLowerCase();
  const isCompleted = cycleStatus === "completed";

  const isStartValid = new Date(`${cycleDetails?.start_date}`) <= new Date();
  const isEndValid = new Date(`${cycleDetails?.end_date}`) >= new Date(`${cycleDetails?.start_date}`);

  const progressPercentage = cycleDetails
    ? Math.round((cycleDetails.completed_issues / cycleDetails.total_issues) * 100)
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

  const endDate = new Date(watch("end_date") ?? cycleDetails.end_date ?? "");
  const startDate = new Date(watch("start_date") ?? cycleDetails.start_date ?? "");

  const currentCycle = CYCLE_STATUS.find((status) => status.value === cycleStatus);

  const issueCount =
    cycleDetails.total_issues === 0
      ? "0 Issue"
      : cycleDetails.total_issues === cycleDetails.completed_issues
      ? cycleDetails.total_issues > 1
        ? `${cycleDetails.total_issues}`
        : `${cycleDetails.total_issues}`
      : `${cycleDetails.completed_issues}/${cycleDetails.total_issues}`;

  const isEditingAllowed = !!currentProjectRole && currentProjectRole >= EUserWorkspaceRoles.MEMBER;

  return (
    <>
      {cycleDetails && workspaceSlug && projectId && (
        <CycleDeleteModal
          cycle={cycleDetails}
          isOpen={cycleDeleteModal}
          handleClose={() => setCycleDeleteModal(false)}
          workspaceSlug={workspaceSlug.toString()}
          projectId={projectId.toString()}
        />
      )}

      <>
        <div className="flex w-full items-center justify-between">
          <div>
            <button
              className="flex h-5 w-5 items-center justify-center rounded-full bg-custom-border-300"
              onClick={() => handleClose()}
            >
              <ChevronRight className="h-3 w-3 stroke-2 text-white" />
            </button>
          </div>
          <div className="flex items-center gap-3.5">
            <button onClick={handleCopyText}>
              <LinkIcon className="h-3 w-3 text-custom-text-300" />
            </button>
            {!isCompleted && isEditingAllowed && (
              <CustomMenu placement="bottom-end" ellipsis>
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
                {currentCycle.value === "current"
                  ? `${findHowManyDaysLeft(cycleDetails.end_date ?? new Date())} ${currentCycle.label}`
                  : `${currentCycle.label}`}
              </span>
            )}
          </div>
          <h4 className="w-full break-words text-xl font-semibold text-custom-text-100">{cycleDetails.name}</h4>
        </div>

        {cycleDetails.description && (
          <span className="w-full whitespace-normal break-words py-2.5 text-sm leading-5 text-custom-text-200">
            {cycleDetails.description}
          </span>
        )}

        <div className="flex flex-col gap-5 pb-6 pt-2.5">
          <div className="flex items-center justify-start gap-1">
            <div className="flex w-1/2 items-center justify-start gap-2 text-custom-text-300">
              <CalendarClock className="h-4 w-4" />
              <span className="text-base">Start date</span>
            </div>
            <div className="relative flex w-1/2 items-center rounded-sm">
              <Popover className="flex h-full w-full items-center justify-center rounded-lg">
                {({ close }) => (
                  <>
                    <Popover.Button
                      ref={startDateButtonRef}
                      className={`w-full cursor-pointer rounded-sm text-sm font-medium text-custom-text-300 hover:bg-custom-background-80 ${
                        isEditingAllowed ? "cursor-pointer" : "cursor-not-allowed"
                      }`}
                      disabled={isCompleted || !isEditingAllowed}
                    >
                      <span
                        className={`group flex w-full items-center justify-between gap-2 px-1.5 py-1 text-sm ${
                          watch("start_date") ? "" : "text-custom-text-400"
                        }`}
                      >
                        {renderFormattedDate(startDate) ?? "No date selected"}
                      </span>
                    </Popover.Button>

                    <Transition
                      as={React.Fragment}
                      enter="transition ease-out duration-200"
                      enterFrom="opacity-0 translate-y-1"
                      enterTo="opacity-100 translate-y-0"
                      leave="transition ease-in duration-150"
                      leaveFrom="opacity-100 translate-y-0"
                      leaveTo="opacity-0 translate-y-1"
                    >
                      <Popover.Panel className="absolute right-0 top-10 z-20 transform overflow-hidden">
                        <CustomRangeDatePicker
                          value={watch("start_date") ? watch("start_date") : cycleDetails?.start_date}
                          onChange={(val) => {
                            if (val) {
                              setTrackElement("CYCLE_PAGE_SIDEBAR_START_DATE_BUTTON");
                              handleStartDateChange(val);
                              close();
                            }
                          }}
                          startDate={watch("start_date") ?? watch("end_date") ?? null}
                          endDate={watch("end_date") ?? watch("start_date") ?? null}
                          maxDate={new Date(`${watch("end_date")}`)}
                          selectsStart={watch("end_date") ? true : false}
                        />
                      </Popover.Panel>
                    </Transition>
                  </>
                )}
              </Popover>
            </div>
          </div>

          <div className="flex items-center justify-start gap-1">
            <div className="flex w-1/2 items-center justify-start gap-2 text-custom-text-300">
              <CalendarCheck2 className="h-4 w-4" />
              <span className="text-base">Target date</span>
            </div>
            <div className="relative flex w-1/2 items-center rounded-sm">
              <Popover className="flex h-full w-full items-center justify-center rounded-lg">
                {({ close }) => (
                  <>
                    <Popover.Button
                      ref={endDateButtonRef}
                      className={`w-full cursor-pointer rounded-sm text-sm font-medium text-custom-text-300 hover:bg-custom-background-80 ${
                        isEditingAllowed ? "cursor-pointer" : "cursor-not-allowed"
                      }`}
                      disabled={isCompleted || !isEditingAllowed}
                    >
                      <span
                        className={`group flex w-full items-center justify-between gap-2 px-1.5 py-1 text-sm ${
                          watch("end_date") ? "" : "text-custom-text-400"
                        }`}
                      >
                        {renderFormattedDate(endDate) ?? "No date selected"}
                      </span>
                    </Popover.Button>

                    <Transition
                      as={React.Fragment}
                      enter="transition ease-out duration-200"
                      enterFrom="opacity-0 translate-y-1"
                      enterTo="opacity-100 translate-y-0"
                      leave="transition ease-in duration-150"
                      leaveFrom="opacity-100 translate-y-0"
                      leaveTo="opacity-0 translate-y-1"
                    >
                      <Popover.Panel className="absolute right-0 top-10 z-20 transform overflow-hidden">
                        <CustomRangeDatePicker
                          value={watch("end_date") ? watch("end_date") : cycleDetails?.end_date}
                          onChange={(val) => {
                            if (val) {
                              setTrackElement("CYCLE_PAGE_SIDEBAR_END_DATE_BUTTON");
                              handleEndDateChange(val);
                              close();
                            }
                          }}
                          startDate={watch("start_date") ?? watch("end_date") ?? null}
                          endDate={watch("end_date") ?? watch("start_date") ?? null}
                          minDate={new Date(`${watch("start_date")}`)}
                          selectsEnd={watch("start_date") ? true : false}
                        />
                      </Popover.Panel>
                    </Transition>
                  </>
                )}
              </Popover>
            </div>
          </div>

          <div className="flex items-center justify-start gap-1">
            <div className="flex w-1/2 items-center justify-start gap-2 text-custom-text-300">
              <UserCircle2 className="h-4 w-4" />
              <span className="text-base">Lead</span>
            </div>
            <div className="flex w-1/2 items-center rounded-sm">
              <div className="flex items-center gap-2.5">
                <Avatar name={cycleOwnerDetails?.display_name} src={cycleOwnerDetails?.avatar} />
                <span className="text-sm text-custom-text-200">{cycleOwnerDetails?.display_name}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-start gap-1">
            <div className="flex w-1/2 items-center justify-start gap-2 text-custom-text-300">
              <LayersIcon className="h-4 w-4" />
              <span className="text-base">Issues</span>
            </div>
            <div className="flex w-1/2 items-center">
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
                        {isStartValid && isEndValid ? (
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
                            {cycleDetails && cycleDetails.distribution && (
                              <div className="relative h-40 w-80">
                                <ProgressChart
                                  distribution={cycleDetails.distribution?.completion_chart ?? {}}
                                  startDate={cycleDetails.start_date ?? ""}
                                  endDate={cycleDetails.end_date ?? ""}
                                  totalIssues={cycleDetails.total_issues}
                                />
                              </div>
                            )}
                          </div>
                        ) : (
                          ""
                        )}
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
                            />
                          </div>
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
    </>
  );
});
