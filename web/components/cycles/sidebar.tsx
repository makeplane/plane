import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { mutate } from "swr";
import { useForm } from "react-hook-form";
// headless ui
import { Disclosure, Popover, Transition } from "@headlessui/react";
// services
import { CycleService } from "services/cycle.service";
// hooks
import useToast from "hooks/use-toast";
// components
import { SidebarProgressStats } from "components/core";
import ProgressChart from "components/core/sidebar/progress-chart";
import { CycleDeleteModal } from "components/cycles/cycle-delete-modal";
// ui
import { CustomMenu, CustomRangeDatePicker } from "components/ui";
import { Loader, ProgressBar } from "@plane/ui";
// icons
import {
  CalendarDaysIcon,
  ChartPieIcon,
  ArrowLongRightIcon,
  TrashIcon,
  UserCircleIcon,
  ChevronDownIcon,
  DocumentIcon,
  LinkIcon,
} from "@heroicons/react/24/outline";
import { ExclamationIcon } from "components/icons";
// helpers
import { capitalizeFirstLetter, copyTextToClipboard } from "helpers/string.helper";
import { isDateGreaterThanToday, renderDateFormat, renderShortDateWithYearFormat } from "helpers/date-time.helper";
// types
import { IUser, ICycle } from "types";
// fetch-keys
import { CYCLE_DETAILS } from "constants/fetch-keys";

type Props = {
  cycle: ICycle | undefined;
  isOpen: boolean;
  cycleStatus: string;
  isCompleted: boolean;
  user: IUser | undefined;
};

const cycleService = new CycleService();

export const CycleDetailsSidebar: React.FC<Props> = ({ cycle, isOpen, cycleStatus, isCompleted, user }) => {
  const [cycleDeleteModal, setCycleDeleteModal] = useState(false);

  const router = useRouter();
  const { workspaceSlug, projectId, cycleId } = router.query as {
    workspaceSlug: string;
    projectId: string;
    cycleId: string;
  };

  const { setToastAlert } = useToast();

  const defaultValues: Partial<ICycle> = {
    start_date: new Date().toString(),
    end_date: new Date().toString(),
  };

  const { setValue, reset, watch } = useForm({
    defaultValues,
  });

  const submitChanges = (data: Partial<ICycle>) => {
    if (!workspaceSlug || !projectId || !cycleId) return;

    mutate<ICycle>(CYCLE_DETAILS(cycleId as string), (prevData) => ({ ...(prevData as ICycle), ...data }), false);

    cycleService
      .patchCycle(workspaceSlug as string, projectId as string, cycleId as string, data, user)
      .then(() => mutate(CYCLE_DETAILS(cycleId as string)))
      .catch((e) => console.log(e));
  };

  const handleCopyText = () => {
    const originURL = typeof window !== "undefined" && window.location.origin ? window.location.origin : "";

    copyTextToClipboard(`${originURL}/${workspaceSlug}/projects/${projectId}/cycles/${cycle?.id}`)
      .then(() => {
        setToastAlert({
          type: "success",
          title: "Cycle link copied to clipboard",
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
    if (cycle)
      reset({
        ...cycle,
      });
  }, [cycle, reset]);

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
    if (
      watch("start_date") &&
      watch("end_date") &&
      watch("start_date") !== "" &&
      watch("end_date") &&
      watch("start_date") !== ""
    ) {
      if (!isDateGreaterThanToday(`${watch("end_date")}`)) {
        setToastAlert({
          type: "error",
          title: "Error!",
          message: "Unable to create cycle in past date. Please enter a valid date.",
        });
        return;
      }

      if (cycle?.start_date && cycle?.end_date) {
        const isDateValidForExistingCycle = await dateChecker({
          start_date: `${watch("start_date")}`,
          end_date: `${watch("end_date")}`,
          cycle_id: cycle.id,
        });

        if (isDateValidForExistingCycle) {
          await submitChanges({
            start_date: renderDateFormat(`${watch("start_date")}`),
            end_date: renderDateFormat(`${watch("end_date")}`),
          });
          setToastAlert({
            type: "success",
            title: "Success!",
            message: "Cycle updated successfully.",
          });
          return;
        } else {
          setToastAlert({
            type: "error",
            title: "Error!",
            message:
              "You have a cycle already on the given dates, if you want to create your draft cycle you can do that by removing dates",
          });
          return;
        }
      }

      const isDateValid = await dateChecker({
        start_date: `${watch("start_date")}`,
        end_date: `${watch("end_date")}`,
      });

      if (isDateValid) {
        submitChanges({
          start_date: renderDateFormat(`${watch("start_date")}`),
          end_date: renderDateFormat(`${watch("end_date")}`),
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
    }
  };

  const handleEndDateChange = async (date: string) => {
    setValue("end_date", date);

    if (
      watch("start_date") &&
      watch("end_date") &&
      watch("start_date") !== "" &&
      watch("end_date") &&
      watch("start_date") !== ""
    ) {
      if (!isDateGreaterThanToday(`${watch("end_date")}`)) {
        setToastAlert({
          type: "error",
          title: "Error!",
          message: "Unable to create cycle in past date. Please enter a valid date.",
        });
        return;
      }

      if (cycle?.start_date && cycle?.end_date) {
        const isDateValidForExistingCycle = await dateChecker({
          start_date: `${watch("start_date")}`,
          end_date: `${watch("end_date")}`,
          cycle_id: cycle.id,
        });

        if (isDateValidForExistingCycle) {
          await submitChanges({
            start_date: renderDateFormat(`${watch("start_date")}`),
            end_date: renderDateFormat(`${watch("end_date")}`),
          });
          setToastAlert({
            type: "success",
            title: "Success!",
            message: "Cycle updated successfully.",
          });
          return;
        } else {
          setToastAlert({
            type: "error",
            title: "Error!",
            message:
              "You have a cycle already on the given dates, if you want to create your draft cycle you can do that by removing dates",
          });
          return;
        }
      }

      const isDateValid = await dateChecker({
        start_date: `${watch("start_date")}`,
        end_date: `${watch("end_date")}`,
      });

      if (isDateValid) {
        submitChanges({
          start_date: renderDateFormat(`${watch("start_date")}`),
          end_date: renderDateFormat(`${watch("end_date")}`),
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
    }
  };

  const isStartValid = new Date(`${cycle?.start_date}`) <= new Date();
  const isEndValid = new Date(`${cycle?.end_date}`) >= new Date(`${cycle?.start_date}`);

  const progressPercentage = cycle ? Math.round((cycle.completed_issues / cycle.total_issues) * 100) : null;

  return (
    <>
      {cycle && (
        <CycleDeleteModal
          cycle={cycle}
          modal={cycleDeleteModal}
          modalClose={() => setCycleDeleteModal(false)}
          onSubmit={() => {}}
          workspaceSlug={workspaceSlug}
          projectId={projectId}
        />
      )}
      <div
        className={`fixed top-[66px] z-20 ${
          isOpen ? "right-0" : "-right-[24rem]"
        } h-full w-[24rem] overflow-y-auto border-l border-custom-border-200 bg-custom-sidebar-background-100 pt-5 pb-10 duration-300`}
      >
        {cycle ? (
          <>
            <div className="flex flex-col items-start justify-center">
              <div className="flex gap-2.5 px-5 text-sm">
                <div className="flex items-center">
                  <span className="flex items-center rounded border-[0.5px] border-custom-border-200 bg-custom-background-90 px-2 py-1 text-center text-xs capitalize">
                    {capitalizeFirstLetter(cycleStatus)}
                  </span>
                </div>
                <div className="relative flex h-full w-52 items-center gap-2">
                  <Popover className="flex h-full items-center justify-center rounded-lg">
                    {({}) => (
                      <>
                        <Popover.Button
                          disabled={isCompleted ?? false}
                          className={`group flex h-full items-center gap-2 whitespace-nowrap rounded border-[0.5px] border-custom-border-200 bg-custom-background-90 px-2 py-1 text-xs ${
                            cycle.start_date ? "" : "text-custom-text-200"
                          }`}
                        >
                          <CalendarDaysIcon className="h-3 w-3" />
                          <span>
                            {renderShortDateWithYearFormat(
                              new Date(`${watch("start_date") ? watch("start_date") : cycle?.start_date}`),
                              "Start date"
                            )}
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
                          <Popover.Panel className="absolute top-10 -right-5 z-20  transform overflow-hidden">
                            <CustomRangeDatePicker
                              value={watch("start_date") ? watch("start_date") : cycle?.start_date}
                              onChange={(val) => {
                                if (val) {
                                  handleStartDateChange(val);
                                }
                              }}
                              startDate={watch("start_date") ? `${watch("start_date")}` : null}
                              endDate={watch("end_date") ? `${watch("end_date")}` : null}
                              maxDate={new Date(`${watch("end_date")}`)}
                              selectsStart
                            />
                          </Popover.Panel>
                        </Transition>
                      </>
                    )}
                  </Popover>
                  <span>
                    <ArrowLongRightIcon className="h-3 w-3 text-custom-text-200" />
                  </span>
                  <Popover className="flex h-full items-center justify-center rounded-lg">
                    {({}) => (
                      <>
                        <Popover.Button
                          disabled={isCompleted ?? false}
                          className={`group flex items-center gap-2 whitespace-nowrap rounded border-[0.5px] border-custom-border-200 bg-custom-background-90 px-2 py-1 text-xs ${
                            cycle.end_date ? "" : "text-custom-text-200"
                          }`}
                        >
                          <CalendarDaysIcon className="h-3 w-3" />

                          <span>
                            {renderShortDateWithYearFormat(
                              new Date(`${watch("end_date") ? watch("end_date") : cycle?.end_date}`),
                              "End date"
                            )}
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
                          <Popover.Panel className="absolute top-10 -right-5 z-20 transform overflow-hidden">
                            <CustomRangeDatePicker
                              value={watch("end_date") ? watch("end_date") : cycle?.end_date}
                              onChange={(val) => {
                                if (val) {
                                  handleEndDateChange(val);
                                }
                              }}
                              startDate={watch("start_date") ? `${watch("start_date")}` : null}
                              endDate={watch("end_date") ? `${watch("end_date")}` : null}
                              minDate={new Date(`${watch("start_date")}`)}
                              selectsEnd
                            />
                          </Popover.Panel>
                        </Transition>
                      </>
                    )}
                  </Popover>
                </div>
              </div>

              <div className="flex w-full flex-col gap-6 px-6 py-6">
                <div className="flex w-full flex-col items-start justify-start gap-2">
                  <div className="flex w-full items-start justify-between gap-2">
                    <div className="max-w-[300px]">
                      <h4 className="text-xl font-semibold text-custom-text-100 break-words w-full">{cycle.name}</h4>
                    </div>
                    <CustomMenu width="lg" ellipsis>
                      {!isCompleted && (
                        <CustomMenu.MenuItem onClick={() => setCycleDeleteModal(true)}>
                          <span className="flex items-center justify-start gap-2">
                            <TrashIcon className="h-4 w-4" />
                            <span>Delete</span>
                          </span>
                        </CustomMenu.MenuItem>
                      )}
                      <CustomMenu.MenuItem onClick={handleCopyText}>
                        <span className="flex items-center justify-start gap-2">
                          <LinkIcon className="h-4 w-4" />
                          <span>Copy link</span>
                        </span>
                      </CustomMenu.MenuItem>
                    </CustomMenu>
                  </div>

                  <span className="whitespace-normal text-sm leading-5 text-custom-text-200 break-words w-full">
                    {cycle.description}
                  </span>
                </div>

                <div className="flex flex-col  gap-4  text-sm">
                  <div className="flex items-center justify-start gap-1">
                    <div className="flex w-40 items-center justify-start gap-2 text-custom-text-200">
                      <UserCircleIcon className="h-5 w-5" />
                      <span>Lead</span>
                    </div>

                    <div className="flex items-center gap-2.5">
                      {cycle.owned_by.avatar && cycle.owned_by.avatar !== "" ? (
                        <img
                          src={cycle.owned_by.avatar}
                          height={12}
                          width={12}
                          className="rounded-full"
                          alt={cycle.owned_by.display_name}
                        />
                      ) : (
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gray-800 capitalize  text-white">
                          {cycle.owned_by.display_name.charAt(0)}
                        </span>
                      )}
                      <span className="text-custom-text-200">{cycle.owned_by.display_name}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-start gap-1">
                    <div className="flex w-40 items-center justify-start gap-2 text-custom-text-200">
                      <ChartPieIcon className="h-5 w-5" />
                      <span>Progress</span>
                    </div>

                    <div className="flex items-center gap-2.5 text-custom-text-200">
                      <span className="h-4 w-4">
                        <ProgressBar value={cycle.completed_issues} maxValue={cycle.total_issues} />
                      </span>
                      {cycle.completed_issues}/{cycle.total_issues}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex w-full flex-col items-center justify-start gap-2 border-t border-custom-border-200 p-6">
              <Disclosure defaultOpen>
                {({ open }) => (
                  <div className={`relative  flex  h-full w-full flex-col ${open ? "" : "flex-row"}`}>
                    <div className="flex w-full items-center justify-between gap-2    ">
                      <div className="flex items-center justify-start gap-2 text-sm">
                        <span className="font-medium text-custom-text-200">Progress</span>
                        {!open && progressPercentage ? (
                          <span className="rounded bg-[#09A953]/10 px-1.5 py-0.5 text-xs text-[#09A953]">
                            {progressPercentage ? `${progressPercentage}%` : ""}
                          </span>
                        ) : (
                          ""
                        )}
                      </div>
                      {isStartValid && isEndValid ? (
                        <Disclosure.Button>
                          <ChevronDownIcon
                            className={`h-3 w-3 ${open ? "rotate-180 transform" : ""}`}
                            aria-hidden="true"
                          />
                        </Disclosure.Button>
                      ) : (
                        <div className="flex items-center gap-1">
                          <ExclamationIcon height={14} width={14} className="fill-current text-custom-text-200" />
                          <span className="text-xs italic text-custom-text-200">
                            {cycleStatus === "upcoming"
                              ? "Cycle is yet to start."
                              : "Invalid date. Please enter valid date."}
                          </span>
                        </div>
                      )}
                    </div>
                    <Transition show={open}>
                      <Disclosure.Panel>
                        {isStartValid && isEndValid ? (
                          <div className=" h-full w-full py-4">
                            <div className="flex  items-start justify-between gap-4 py-2 text-xs">
                              <div className="flex items-center gap-1">
                                <span>
                                  <DocumentIcon className="h-3 w-3 text-custom-text-200" />
                                </span>
                                <span>
                                  Pending Issues -{" "}
                                  {cycle.total_issues - (cycle.completed_issues + cycle.cancelled_issues)}
                                </span>
                              </div>

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
                            <div className="relative">
                              <ProgressChart
                                distribution={cycle.distribution.completion_chart}
                                startDate={cycle.start_date ?? ""}
                                endDate={cycle.end_date ?? ""}
                                totalIssues={cycle.total_issues}
                              />
                            </div>
                          </div>
                        ) : (
                          ""
                        )}
                      </Disclosure.Panel>
                    </Transition>
                  </div>
                )}
              </Disclosure>
            </div>
            <div className="flex w-full flex-col items-center justify-start gap-2 border-t border-custom-border-200 p-6">
              <Disclosure defaultOpen>
                {({ open }) => (
                  <div className={`relative  flex  h-full w-full flex-col ${open ? "" : "flex-row"}`}>
                    <div className="flex w-full items-center justify-between gap-2">
                      <div className="flex items-center justify-start gap-2 text-sm">
                        <span className="font-medium text-custom-text-200">Other Information</span>
                      </div>

                      {cycle.total_issues > 0 ? (
                        <Disclosure.Button>
                          <ChevronDownIcon
                            className={`h-3 w-3 ${open ? "rotate-180 transform" : ""}`}
                            aria-hidden="true"
                          />
                        </Disclosure.Button>
                      ) : (
                        <div className="flex items-center gap-1">
                          <ExclamationIcon height={14} width={14} className="fill-current text-custom-text-200" />
                          <span className="text-xs italic text-custom-text-200">
                            No issues found. Please add issue.
                          </span>
                        </div>
                      )}
                    </div>
                    <Transition show={open}>
                      <Disclosure.Panel>
                        {cycle.total_issues > 0 ? (
                          <div className="h-full w-full py-4">
                            <SidebarProgressStats
                              distribution={cycle.distribution}
                              groupedIssues={{
                                backlog: cycle.backlog_issues,
                                unstarted: cycle.unstarted_issues,
                                started: cycle.started_issues,
                                completed: cycle.completed_issues,
                                cancelled: cycle.cancelled_issues,
                              }}
                              totalIssues={cycle.total_issues}
                            />
                          </div>
                        ) : (
                          ""
                        )}
                      </Disclosure.Panel>
                    </Transition>
                  </div>
                )}
              </Disclosure>
            </div>
          </>
        ) : (
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
        )}
      </div>
    </>
  );
};
