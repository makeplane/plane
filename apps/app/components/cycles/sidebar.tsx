import React, { useEffect, useState } from "react";

import { useRouter } from "next/router";
import Image from "next/image";

import useSWR, { mutate } from "swr";

// react-hook-form
import { useForm } from "react-hook-form";
import { Disclosure, Popover, Transition } from "@headlessui/react";
import DatePicker from "react-datepicker";
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
// ui
import { CustomMenu, Loader, ProgressBar } from "components/ui";
// hooks
import useToast from "hooks/use-toast";
// services
import cyclesService from "services/cycles.service";
// components
import { SidebarProgressStats } from "components/core";
import ProgressChart from "components/core/sidebar/progress-chart";
import { DeleteCycleModal } from "components/cycles";
// icons
import { ExclamationIcon } from "components/icons";
// helpers
import { capitalizeFirstLetter, copyTextToClipboard } from "helpers/string.helper";
import { groupBy } from "helpers/array.helper";
import { isDateRangeValid, renderDateFormat, renderShortDate } from "helpers/date-time.helper";
// types
import { ICycle, IIssue } from "types";
// fetch-keys
import { CYCLE_DETAILS, CYCLE_ISSUES } from "constants/fetch-keys";

type Props = {
  cycle: ICycle | undefined;
  isOpen: boolean;
  cycleStatus: string;
  isCompleted: boolean;
};

export const CycleDetailsSidebar: React.FC<Props> = ({
  cycle,
  isOpen,
  cycleStatus,
  isCompleted,
}) => {
  const [cycleDeleteModal, setCycleDeleteModal] = useState(false);

  const router = useRouter();
  const { workspaceSlug, projectId, cycleId } = router.query;

  const { setToastAlert } = useToast();

  const defaultValues: Partial<ICycle> = {
    start_date: new Date().toString(),
    end_date: new Date().toString(),
  };

  const { data: issues } = useSWR<IIssue[]>(
    workspaceSlug && projectId && cycleId ? CYCLE_ISSUES(cycleId as string) : null,
    workspaceSlug && projectId && cycleId
      ? () =>
          cyclesService.getCycleIssues(
            workspaceSlug as string,
            projectId as string,
            cycleId as string
          )
      : null
  );

  const groupedIssues = {
    backlog: [],
    unstarted: [],
    started: [],
    cancelled: [],
    completed: [],
    ...groupBy(issues ?? [], "state_detail.group"),
  };

  const { reset, watch } = useForm({
    defaultValues,
  });

  const submitChanges = (data: Partial<ICycle>) => {
    if (!workspaceSlug || !projectId || !cycleId) return;

    mutate<ICycle>(
      CYCLE_DETAILS(cycleId as string),
      (prevData) => ({ ...(prevData as ICycle), ...data }),
      false
    );

    cyclesService
      .patchCycle(workspaceSlug as string, projectId as string, cycleId as string, data)
      .then((res) => {
        console.log(res);
        mutate(CYCLE_DETAILS(cycleId as string));
      })
      .catch((e) => {
        console.log(e);
      });
  };

  const handleCopyText = () => {
    const originURL =
      typeof window !== "undefined" && window.location.origin ? window.location.origin : "";

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

  const isStartValid = new Date(`${cycle?.start_date}`) <= new Date();
  const isEndValid = new Date(`${cycle?.end_date}`) >= new Date(`${cycle?.start_date}`);

  const progressPercentage = issues
    ? Math.round((groupedIssues.completed.length / issues?.length) * 100)
    : null;

  return (
    <>
      <DeleteCycleModal isOpen={cycleDeleteModal} setIsOpen={setCycleDeleteModal} data={cycle} />
      <div
        className={`fixed top-0 ${
          isOpen ? "right-0" : "-right-[24rem]"
        } z-20 h-full w-[24rem] overflow-y-auto border-l bg-gray-50 py-5 duration-300`}
      >
        {cycle ? (
          <>
            <div className="flex flex-col items-start justify-center">
              <div className="flex gap-2.5 px-5 text-sm">
                <div className="flex items-center ">
                  <span
                    className={`flex items-center rounded border-[0.5px] border-gray-200 bg-gray-100 px-2.5 py-1.5 text-center text-sm capitalize text-gray-800 `}
                  >
                    {capitalizeFirstLetter(cycleStatus)}
                  </span>
                </div>
                <div className="relative flex h-full w-52 items-center justify-center gap-2 text-sm text-gray-800">
                  <Popover className="flex h-full items-center  justify-center rounded-lg">
                    {({ open }) => (
                      <>
                        <Popover.Button
                          disabled={isCompleted ?? false}
                          className={`group flex h-full items-center gap-1 rounded border-[0.5px]  border-gray-200 bg-gray-100 px-2.5 py-1.5 text-gray-800   ${
                            open ? "bg-gray-100" : ""
                          }`}
                        >
                          <CalendarDaysIcon className="h-3 w-3" />
                          <span>{renderShortDate(new Date(`${cycle?.start_date}`))}</span>
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
                            <DatePicker
                              selected={
                                watch("start_date")
                                  ? new Date(`${watch("start_date")}`)
                                  : new Date()
                              }
                              onChange={(date) => {
                                if (date && watch("end_date")) {
                                  if (
                                    isDateRangeValid(renderDateFormat(date), `${watch("end_date")}`)
                                  ) {
                                    submitChanges({
                                      start_date: renderDateFormat(date),
                                    });
                                  } else {
                                    setToastAlert({
                                      type: "error",
                                      title: "Error!",
                                      message: "The date you have entered is invalid. Please check and enter a valid date.",
                                    });
                                  }
                                }
                              }}
                              selectsStart
                              startDate={new Date(`${watch("start_date")}`)}
                              endDate={new Date(`${watch("end_date")}`)}
                              maxDate={new Date(`${watch("end_date")}`)}
                              shouldCloseOnSelect
                              inline
                            />
                          </Popover.Panel>
                        </Transition>
                      </>
                    )}
                  </Popover>
                  <span>
                    <ArrowLongRightIcon className="h-3 w-3" />
                  </span>
                  <Popover className="flex h-full items-center  justify-center rounded-lg">
                    {({ open }) => (
                      <>
                        <Popover.Button
                          disabled={isCompleted ?? false}
                          className={`group flex items-center gap-1 rounded border-[0.5px] border-gray-200 bg-gray-100 px-2.5 py-1.5 text-gray-800  ${
                            open ? "bg-gray-100" : ""
                          }`}
                        >
                          <CalendarDaysIcon className="h-3 w-3 " />

                          <span>{renderShortDate(new Date(`${cycle?.end_date}`))}</span>
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
                            <DatePicker
                              selected={
                                watch("end_date") ? new Date(`${watch("end_date")}`) : new Date()
                              }
                              onChange={(date) => {
                                if (watch("start_date") && date) {
                                  if (
                                    isDateRangeValid(
                                      `${watch("start_date")}`,
                                      renderDateFormat(date)
                                    )
                                  ) {
                                    submitChanges({
                                      end_date: renderDateFormat(date),
                                    });
                                  } else {
                                    setToastAlert({
                                      type: "error",
                                      title: "Error!",
                                      message: "The date you have entered is invalid. Please check and enter a valid date.",
                                    });
                                  }
                                }
                              }}
                              selectsEnd
                              startDate={new Date(`${watch("start_date")}`)}
                              endDate={new Date(`${watch("end_date")}`)}
                              minDate={new Date(`${watch("start_date")}`)}
                              shouldCloseOnSelect
                              inline
                            />
                          </Popover.Panel>
                        </Transition>
                      </>
                    )}
                  </Popover>
                </div>
              </div>

              <div className="flex flex-col gap-6 px-6 py-6 w-full">
                <div className="flex flex-col items-start justify-start gap-2 w-full">
                  <div className="flex items-start justify-between gap-2 w-full">
                    <h4 className="text-xl font-semibold text-gray-900">{cycle.name}</h4>
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

                  <span className="whitespace-normal text-sm leading-5 text-black">
                    {cycle.description}
                  </span>
                </div>

                <div className="flex flex-col  gap-4  text-sm">
                  <div className="flex items-center justify-start gap-1">
                    <div className="flex w-40 items-center justify-start gap-2">
                      <UserCircleIcon className="h-5 w-5 text-gray-400" />
                      <span>Lead</span>
                    </div>

                    <div className="flex items-center gap-2.5">
                      {cycle.owned_by.avatar && cycle.owned_by.avatar !== "" ? (
                        <Image
                          src={cycle.owned_by.avatar}
                          height={12}
                          width={12}
                          className="rounded-full"
                          alt={cycle.owned_by.first_name}
                        />
                      ) : (
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gray-800 capitalize  text-white">
                          {cycle.owned_by.first_name.charAt(0)}
                        </span>
                      )}
                      <span className="text-gray-900">{cycle.owned_by.first_name}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-start gap-1">
                    <div className="flex w-40 items-center justify-start gap-2">
                      <ChartPieIcon className="h-5 w-5 text-gray-400" />
                      <span>Progress</span>
                    </div>

                    <div className="flex items-center gap-2.5 text-gray-800">
                      <span className="h-4 w-4">
                        <ProgressBar
                          value={groupedIssues.completed.length}
                          maxValue={issues?.length}
                        />
                      </span>
                      {groupedIssues.completed.length}/{issues?.length}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex w-full flex-col items-center justify-start gap-2 border-t border-gray-300 px-6 py-6 ">
              <Disclosure>
                {({ open }) => (
                  <div
                    className={`relative  flex  h-full w-full flex-col ${open ? "" : "flex-row"}`}
                  >
                    <div className="flex w-full items-center justify-between gap-2    ">
                      <div className="flex items-center justify-start gap-2 text-sm">
                        <span className="font-medium text-gray-500">Progress</span>
                        {!open && issues && progressPercentage ? (
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
                          <ExclamationIcon height={14} width={14} />
                          <span className="text-xs italic text-gray-500">
                            Invalid date. Please enter valid date.
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
                                  <DocumentIcon className="h-3 w-3 text-gray-500" />
                                </span>
                                <span>
                                  Pending Issues -{" "}
                                  {issues &&
                                    groupedIssues &&
                                    issues?.length - groupedIssues.completed.length}
                                </span>
                              </div>

                              <div className="flex items-center gap-3 text-gray-900">
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
                                issues={issues ?? []}
                                start={cycle?.start_date ?? ""}
                                end={cycle?.end_date ?? ""}
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

            <div className="flex w-full flex-col items-center justify-start gap-2 border-t border-gray-300 px-6 py-6 ">
              <Disclosure>
                {({ open }) => (
                  <div
                    className={`relative  flex  h-full w-full flex-col ${open ? "" : "flex-row"}`}
                  >
                    <div className="flex w-full items-center justify-between gap-2    ">
                      <div className="flex items-center justify-start gap-2 text-sm">
                        <span className="font-medium text-gray-500">Other Information</span>
                      </div>

                      {(issues?.length ?? 0) > 0 ? (
                        <Disclosure.Button>
                          <ChevronDownIcon
                            className={`h-3 w-3 ${open ? "rotate-180 transform" : ""}`}
                            aria-hidden="true"
                          />
                        </Disclosure.Button>
                      ) : (
                        <div className="flex items-center gap-1">
                          <ExclamationIcon height={14} width={14} />
                          <span className="text-xs italic text-gray-500">
                            No issues found. Please add issue.
                          </span>
                        </div>
                      )}
                    </div>
                    <Transition show={open}>
                      <Disclosure.Panel>
                        {(issues?.length ?? 0) > 0 ? (
                          <div className=" h-full w-full py-4">
                            <SidebarProgressStats
                              issues={issues ?? []}
                              groupedIssues={groupedIssues}
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
