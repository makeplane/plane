import { useEffect } from "react";

import { useRouter } from "next/router";

import { mutate } from "swr";

// react-hook-form
import { Controller, useForm } from "react-hook-form";
// icons
import { CalendarDaysIcon, ChartPieIcon, LinkIcon, UserIcon } from "@heroicons/react/24/outline";
// services
import cyclesService from "services/cycles.service";
// hooks
import useToast from "hooks/use-toast";
// ui
import { Loader } from "components/ui";
// helpers
import { copyTextToClipboard } from "helpers/string.helper";
import { groupBy } from "helpers/array.helper";
// types
import { CycleIssueResponse, ICycle } from "types";
// fetch-keys
import { CYCLE_DETAIL } from "constants/fetch-keys";

type Props = {
  cycle: ICycle | undefined;
  isOpen: boolean;
  cycleIssues: CycleIssueResponse[];
};

const defaultValues: Partial<ICycle> = {
  start_date: new Date().toString(),
  end_date: new Date().toString(),
};

const CycleDetailSidebar: React.FC<Props> = ({ cycle, isOpen, cycleIssues }) => {
  const router = useRouter();
  const {
    query: { workspaceSlug, projectId },
  } = router;

  const { setToastAlert } = useToast();

  const { reset, control } = useForm({
    defaultValues,
  });

  const groupedIssues = {
    backlog: [],
    unstarted: [],
    started: [],
    cancelled: [],
    completed: [],
    ...groupBy(cycleIssues ?? [], "issue_detail.state_detail.group"),
  };

  const submitChanges = (data: Partial<ICycle>) => {
    if (!workspaceSlug || !projectId || !module) return;

    cyclesService
      .patchCycle(workspaceSlug as string, projectId as string, cycle?.id ?? "", data)
      .then((res) => {
        console.log(res);
        mutate(CYCLE_DETAIL);
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

  return (
    <div
      className={`fixed top-0 ${
        isOpen ? "right-0" : "-right-[24rem]"
      } z-20 h-full w-[24rem] overflow-y-auto border-l bg-gray-50 p-5 duration-300`}
    >
      {cycle ? (
        <>
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
                <div className="sm:basis-1/2">
                  {cycle.owned_by.first_name !== "" ? (
                    <>
                      {cycle.owned_by.first_name} {cycle.owned_by.last_name}
                    </>
                  ) : (
                    cycle.owned_by.email
                  )}
                </div>
              </div>
              <div className="flex flex-wrap items-center py-2">
                <div className="flex items-center gap-x-2 text-sm sm:basis-1/2">
                  <ChartPieIcon className="h-4 w-4 flex-shrink-0" />
                  <p>Progress</p>
                </div>
                <div className="flex items-center gap-2 sm:basis-1/2">
                  <div className="grid flex-shrink-0 place-items-center">
                    <span className="h-4 w-4 rounded-full border-2 border-gray-300 border-r-blue-500" />
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
                    render={({ field: { value, onChange } }) => (
                      <input
                        type="date"
                        id="cycleStartDate"
                        value={value ?? ""}
                        onChange={(e: any) => {
                          submitChanges({ start_date: e.target.value });
                          onChange(e.target.value);
                        }}
                        className="w-full cursor-pointer rounded-md border bg-transparent px-2 py-1 text-xs shadow-sm duration-300 hover:bg-gray-100 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
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
                    render={({ field: { value, onChange } }) => (
                      <input
                        type="date"
                        id="moduleEndDate"
                        value={value ?? ""}
                        onChange={(e: any) => {
                          submitChanges({ end_date: e.target.value });
                          onChange(e.target.value);
                        }}
                        className="w-full cursor-pointer rounded-md border bg-transparent px-2 py-1 text-xs shadow-sm duration-300 hover:bg-gray-100 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    )}
                  />
                </div>
              </div>
            </div>
            <div className="py-1" />
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
