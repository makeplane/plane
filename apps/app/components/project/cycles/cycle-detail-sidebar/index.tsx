import { useEffect } from "react";

import { useRouter } from "next/router";
import Image from "next/image";

import { mutate } from "swr";

// react-hook-form
import { Controller, useForm } from "react-hook-form";
// react-circular-progressbar
import { CircularProgressbar } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";
// icons
import { CalendarDaysIcon, ChartPieIcon, LinkIcon, UserIcon } from "@heroicons/react/24/outline";
import { CycleSidebarStatusSelect } from "components/project/cycles";
// ui
import { Loader, CustomDatePicker } from "components/ui";
// hooks
import useToast from "hooks/use-toast";
// services
import cyclesService from "services/cycles.service";
// components
import { SidebarProgressStats } from "components/core";
// helpers
import { copyTextToClipboard } from "helpers/string.helper";
import { groupBy } from "helpers/array.helper";
import { renderShortNumericDateFormat } from "helpers/date-time.helper";
// types
import { CycleIssueResponse, ICycle, IIssue } from "types";
// fetch-keys
import { CYCLE_DETAILS } from "constants/fetch-keys";
import ProgressChart from "components/core/sidebar/progress-chart";

type Props = {
  issues: IIssue[];
  cycle: ICycle | undefined;
  isOpen: boolean;
  cycleIssues: CycleIssueResponse[];
};

const CycleDetailSidebar: React.FC<Props> = ({ issues, cycle, isOpen, cycleIssues }) => {
  const router = useRouter();
  const { workspaceSlug, projectId, cycleId } = router.query;

  const { setToastAlert } = useToast();

  const defaultValues: Partial<ICycle> = {
    start_date: new Date().toString(),
    end_date: new Date().toString(),
    status: cycle?.status,
  };

  const groupedIssues = {
    backlog: [],
    unstarted: [],
    started: [],
    cancelled: [],
    completed: [],
    ...groupBy(cycleIssues ?? [], "issue_detail.state_detail.group"),
  };

  const { reset, watch, control } = useForm({
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
    <div
      className={`fixed top-0 ${
        isOpen ? "right-0" : "-right-[24rem]"
      } z-20 h-full w-[24rem] overflow-y-auto border-l bg-gray-50 p-5 duration-300`}
    >
      {cycle ? (
        <>
          <div className="flex gap-2 text-sm my-2">
            <div className="px-2 py-1 rounded bg-gray-200">
              <span className="capitalize">{cycle.status}</span>
            </div>
            <div className="px-2 py-1 rounded bg-gray-200">
              <span>
                {renderShortNumericDateFormat(`${cycle.start_date}`)
                  ? renderShortNumericDateFormat(`${cycle.start_date}`)
                  : "N/A"}{" "}
                -{" "}
                {renderShortNumericDateFormat(`${cycle.end_date}`)
                  ? renderShortNumericDateFormat(`${cycle.end_date}`)
                  : "N/A"}
              </span>
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
                        {cycle.owned_by?.first_name && cycle.owned_by.first_name !== ""
                          ? cycle.owned_by.first_name.charAt(0)
                          : cycle.owned_by?.email.charAt(0)}
                      </div>
                    ))}
                  {cycle.owned_by.first_name !== ""
                    ? cycle.owned_by.first_name
                    : cycle.owned_by.email}
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
                      <CircularProgressbar
                        value={groupedIssues.completed.length}
                        maxValue={cycleIssues?.length}
                        strokeWidth={10}
                      />
                    </span>
                  </div>
                  {groupedIssues.completed.length}/{cycleIssues?.length}
                </div>
              </div>
            </div>
            <div className="py-1">
              <div className="flex flex-wrap items-center py-2">
                <div className="flex items-center gap-x-2 text-sm sm:basis-1/2">
                  <CalendarDaysIcon className="h-4 w-4 flex-shrink-0" />
                  <p>Start date</p>
                </div>
                <div className="sm:basis-1/2">
                  <Controller
                    control={control}
                    name="start_date"
                    render={({ field: { value } }) => (
                      <CustomDatePicker
                        value={value}
                        onChange={(val) =>
                          submitChanges({
                            start_date: val,
                          })
                        }
                        isClearable={false}
                      />
                    )}
                  />
                </div>
              </div>
              <div className="flex flex-wrap items-center py-2">
                <div className="flex items-center gap-x-2 text-sm sm:basis-1/2">
                  <CalendarDaysIcon className="h-4 w-4 flex-shrink-0" />
                  <p>End date</p>
                </div>
                <div className="sm:basis-1/2">
                  <Controller
                    control={control}
                    name="end_date"
                    render={({ field: { value } }) => (
                      <CustomDatePicker
                        value={value}
                        onChange={(val) =>
                          submitChanges({
                            end_date: val,
                          })
                        }
                        isClearable={false}
                      />
                    )}
                  />
                </div>
              </div>
              <CycleSidebarStatusSelect
                control={control}
                submitChanges={submitChanges}
                watch={watch}
              />
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
            <SidebarProgressStats issues={issues} groupedIssues={groupedIssues} />
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
  );
};

export default CycleDetailSidebar;
