import React, { useEffect, useState } from "react";

import { useRouter } from "next/router";
import Image from "next/image";

import { mutate } from "swr";

// react-hook-form
import { useForm } from "react-hook-form";
import { Popover, Transition } from "@headlessui/react";
import DatePicker from "react-datepicker";
// icons
import {
  CalendarDaysIcon,
  ChartPieIcon,
  LinkIcon,
  Squares2X2Icon,
  TrashIcon,
  UserIcon,
} from "@heroicons/react/24/outline";
// ui
import { Loader, ProgressBar } from "components/ui";
// hooks
import useToast from "hooks/use-toast";
// services
import cyclesService from "services/cycles.service";
// components
import { SidebarProgressStats } from "components/core";
import ProgressChart from "components/core/sidebar/progress-chart";
import { DeleteCycleModal } from "components/cycles";
// helpers
import { copyTextToClipboard } from "helpers/string.helper";
import { groupBy } from "helpers/array.helper";
import { renderDateFormat, renderShortNumericDateFormat } from "helpers/date-time.helper";
// types
import { CycleIssueResponse, ICycle, IIssue } from "types";
// fetch-keys
import { CYCLE_DETAILS } from "constants/fetch-keys";

type Props = {
  issues: IIssue[];
  cycle: ICycle | undefined;
  isOpen: boolean;
  cycleIssues: CycleIssueResponse[];
  cycleStatus: string;
};

export const CycleDetailsSidebar: React.FC<Props> = ({
  issues,
  cycle,
  isOpen,
  cycleIssues,
  cycleStatus,
}) => {
  const [cycleDeleteModal, setCycleDeleteModal] = useState(false);

  const router = useRouter();
  const { workspaceSlug, projectId, cycleId } = router.query;

  const [startDateRange, setStartDateRange] = useState<Date | null>(new Date());
  const [endDateRange, setEndDateRange] = useState<Date | null>(null);

  const { setToastAlert } = useToast();

  const defaultValues: Partial<ICycle> = {
    start_date: new Date().toString(),
    end_date: new Date().toString(),
  };

  const groupedIssues = {
    backlog: [],
    unstarted: [],
    started: [],
    cancelled: [],
    completed: [],
    ...groupBy(cycleIssues ?? [], "issue_detail.state_detail.group"),
  };

  const { reset } = useForm({
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

  useEffect(() => {
    if (cycle)
      reset({
        ...cycle,
      });
  }, [cycle, reset]);

  const isStartValid = new Date(`${cycle?.start_date}`) <= new Date();
  const isEndValid = new Date(`${cycle?.end_date}`) >= new Date(`${cycle?.start_date}`);

  return (
    <>
      <DeleteCycleModal isOpen={cycleDeleteModal} setIsOpen={setCycleDeleteModal} data={cycle} />
      <div
        className={`fixed top-0 ${
          isOpen ? "right-0" : "-right-[24rem]"
        } z-20 h-full w-[24rem] overflow-y-auto border-l bg-gray-50 p-5 duration-300`}
      >
        {cycle ? (
          <>
            <div className="flex gap-1 text-sm my-2">
              <div className="flex items-center ">
                <span
                  className={`flex items-center gap-1 text-left capitalize p-1 text-xs h-full w-full  text-gray-900`}
                >
                  <Squares2X2Icon className="h-4 w-4 flex-shrink-0" />
                  {cycleStatus === "current"
                    ? "In Progress"
                    : cycleStatus === "completed"
                    ? "Completed"
                    : cycleStatus === "upcoming"
                    ? "Upcoming"
                    : "Draft"}
                </span>
              </div>
              <div className="flex justify-center items-center gap-2 rounded-md border bg-transparent h-full  p-2 px-4  text-xs font-medium text-gray-900 hover:bg-gray-100 hover:text-gray-900 focus:outline-none">
                <Popover className="flex justify-center items-center relative  rounded-lg">
                  {({ open }) => (
                    <>
                      <Popover.Button
                        className={`group flex items-center  ${open ? "bg-gray-100" : ""}`}
                      >
                        <CalendarDaysIcon className="h-4 w-4 flex-shrink-0 mr-2" />
                        <span>
                          {renderShortNumericDateFormat(`${cycle.start_date}`)
                            ? renderShortNumericDateFormat(`${cycle.start_date}`)
                            : "N/A"}
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
                        <Popover.Panel className="absolute top-10 -left-10 z-20  transform overflow-hidden">
                          <DatePicker
                            selected={startDateRange}
                            onChange={(date) => {
                              submitChanges({
                                start_date: renderDateFormat(date),
                              });
                              setStartDateRange(date);
                            }}
                            selectsStart
                            startDate={startDateRange}
                            endDate={endDateRange}
                            inline
                          />
                        </Popover.Panel>
                      </Transition>
                    </>
                  )}
                </Popover>
                <Popover className="flex justify-center items-center relative  rounded-lg">
                  {({ open }) => (
                    <>
                      <Popover.Button
                        className={`group flex items-center ${open ? "bg-gray-100" : ""}`}
                      >
                        <span>
                          -{" "}
                          {renderShortNumericDateFormat(`${cycle.end_date}`)
                            ? renderShortNumericDateFormat(`${cycle.end_date}`)
                            : "N/A"}
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
                        <Popover.Panel className="absolute top-10 -right-20 z-20  transform overflow-hidden">
                          <DatePicker
                            selected={endDateRange}
                            onChange={(date) => {
                              submitChanges({
                                end_date: renderDateFormat(date),
                              });
                              setEndDateRange(date);
                            }}
                            selectsEnd
                            startDate={startDateRange}
                            endDate={endDateRange}
                            minDate={startDateRange}
                            inline
                          />
                        </Popover.Panel>
                      </Transition>
                    </>
                  )}
                </Popover>
              </div>
            </div>
            <div className="flex items-center justify-between pb-3">
              <h4 className="text-sm font-medium">{cycle.name}</h4>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  className="rounded-md border p-2 shadow-sm duration-300 hover:bg-gray-100 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  onClick={() =>
                    copyTextToClipboard(
                      `https://app.plane.so/${workspaceSlug}/projects/${projectId}/cycles/${cycle.id}`
                    )
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
                      })
                  }
                >
                  <LinkIcon className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  className="rounded-md border border-red-500 p-2 text-red-500 shadow-sm duration-300 hover:bg-red-50 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  onClick={() => setCycleDeleteModal(true)}
                >
                  <TrashIcon className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
            <div className="divide-y-2 divide-gray-100 text-xs">
              <div className="py-1">
                <div className="flex flex-wrap items-center py-2">
                  <div className="flex items-center gap-x-2 text-sm sm:basis-1/2">
                    <UserIcon className="h-4 w-4 flex-shrink-0" />
                    <p>Owned by</p>
                  </div>
                  <div className="sm:basis-1/2 flex items-center gap-1">
                    {cycle.owned_by &&
                      (cycle.owned_by.avatar && cycle.owned_by.avatar !== "" ? (
                        <div className="h-5 w-5 rounded-full border-2 border-transparent">
                          <Image
                            src={cycle.owned_by.avatar}
                            height="100%"
                            width="100%"
                            className="rounded-full"
                            alt={cycle.owned_by?.first_name}
                          />
                        </div>
                      ) : (
                        <div className="grid h-5 w-5 place-items-center rounded-full border-2 border-white bg-gray-700 capitalize text-white">
                          {cycle.owned_by &&
                          cycle.owned_by?.first_name &&
                          cycle.owned_by?.first_name !== ""
                            ? cycle.owned_by?.first_name.charAt(0)
                            : cycle.owned_by?.email.charAt(0)}
                        </div>
                      ))}
                    {cycle.owned_by?.first_name !== ""
                      ? cycle.owned_by?.first_name
                      : cycle.owned_by?.email}
                  </div>
                </div>
                <div className="flex flex-wrap items-center py-2">
                  <div className="flex items-center gap-x-2 text-sm sm:basis-1/2">
                    <ChartPieIcon className="h-4 w-4 flex-shrink-0" />
                    <p>Progress</p>
                  </div>
                  <div className="flex items-center gap-2 sm:basis-1/2">
                    <div className="grid flex-shrink-0 place-items-center">
                      <span className="h-4 w-4">
                        <ProgressBar
                          value={groupedIssues.completed.length}
                          maxValue={cycleIssues?.length}
                        />
                      </span>
                    </div>
                    {groupedIssues.completed.length}/{cycleIssues?.length}
                  </div>
                </div>
              </div>
              <div className="py-1" />
            </div>
            <div className="flex flex-col items-center justify-center w-full gap-2 ">
              {isStartValid && isEndValid ? (
                <div className="relative h-[200px] w-full ">
                  <ProgressChart
                    issues={issues}
                    start={cycle?.start_date ?? ""}
                    end={cycle?.end_date ?? ""}
                  />
                </div>
              ) : (
                ""
              )}
              {issues.length > 0 ? (
                <SidebarProgressStats issues={issues} groupedIssues={groupedIssues} />
              ) : (
                ""
              )}
            </div>
          </>
        ) : (
          <Loader>
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
