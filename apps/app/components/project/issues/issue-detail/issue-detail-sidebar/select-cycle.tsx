import React from "react";
// swr
import useSWR, { mutate } from "swr";
// react-hook-form
import { Control, Controller, UseFormWatch } from "react-hook-form";
// hooks
import useUser from "lib/hooks/useUser";
// constants
import { CYCLE_ISSUES, CYCLE_LIST, PROJECT_ISSUES_LIST } from "constants/fetch-keys";
// services
import issuesService from "lib/services/issues.service";
import cyclesService from "lib/services/cycles.service";
// ui
import { Spinner, CustomSelect } from "ui";
// icons
import { ArrowPathIcon, XMarkIcon } from "@heroicons/react/24/outline";
// types
import { CycleIssueResponse, ICycle, IIssue } from "types";
// common
import { classNames } from "constants/common";

type Props = {
  issueDetail: IIssue | undefined;
  control: Control<IIssue, any>;
  handleCycleChange: (cycle: ICycle) => void;
  watch: UseFormWatch<IIssue>;
};

const SelectCycle: React.FC<Props> = ({ issueDetail, control, handleCycleChange, watch }) => {
  const { activeWorkspace, activeProject } = useUser();

  const { data: cycles } = useSWR(
    activeWorkspace && activeProject ? CYCLE_LIST(activeProject.id) : null,
    activeWorkspace && activeProject
      ? () => cyclesService.getCycles(activeWorkspace.slug, activeProject.id)
      : null
  );

  const removeIssueFromCycle = (bridgeId: string, cycleId: string) => {
    if (!activeWorkspace || !activeProject) return;

    mutate<CycleIssueResponse[]>(
      CYCLE_ISSUES(cycleId),
      (prevData) => prevData?.filter((p) => p.id !== bridgeId),
      false
    );

    mutate(
      activeWorkspace && activeProject
        ? PROJECT_ISSUES_LIST(activeWorkspace.slug, activeProject.id)
        : null
    );

    issuesService
      .removeIssueFromCycle(activeWorkspace.slug, activeProject.id, cycleId, bridgeId)
      .then((res) => {
        console.log(res);
      })
      .catch((e) => {
        console.log(e);
      });
  };

  return (
    <div className="flex flex-wrap items-center py-2">
      <div className="flex items-center gap-x-2 text-sm sm:basis-1/2">
        <ArrowPathIcon className="h-4 w-4 flex-shrink-0" />
        <p>Cycle</p>
      </div>
      <div className="space-y-1 sm:basis-1/2">
        {issueDetail?.issue_cycle && watch("issue_cycle") && (
          <div className="flex flex-wrap gap-1">
            <span
              className="group flex cursor-pointer items-center gap-1 rounded-2xl border border-red-500 px-1.5 py-0.5 text-xs text-red-500 hover:bg-yellow-50"
              onClick={() =>
                removeIssueFromCycle(
                  issueDetail.issue_cycle?.id ?? "",
                  issueDetail.issue_cycle?.cycle ?? ""
                )
              }
            >
              {watch("issue_cycle")?.cycle_detail.name}
              <XMarkIcon className="h-2 w-2 group-hover:text-red-500" />
            </span>
          </div>
        )}
        <Controller
          control={control}
          name="issue_cycle"
          render={({ field: { value } }) => (
            <>
              <CustomSelect
                label={
                  <span
                    className={classNames(
                      value ? "" : "text-gray-900",
                      "hidden truncate text-left sm:block"
                    )}
                  >
                    {value ? cycles?.find((c) => c.id === value.cycle_detail.id)?.name : "None"}
                  </span>
                }
                value={value}
                onChange={(value: any) => {
                  handleCycleChange(cycles?.find((c) => c.id === value) as any);
                }}
              >
                {cycles ? (
                  cycles.length > 0 ? (
                    cycles.map((option) => (
                      <CustomSelect.Option key={option.id} value={option.id}>
                        {option.name}
                      </CustomSelect.Option>
                    ))
                  ) : (
                    <div className="text-center">No cycles found</div>
                  )
                ) : (
                  <Spinner />
                )}
              </CustomSelect>
            </>
          )}
        />
      </div>
    </div>
  );
};

export default SelectCycle;
