// react
import React from "react";

import { useRouter } from "next/router";

import useSWR, { mutate } from "swr";

import { Control, Controller, UseFormWatch } from "react-hook-form";
// constants
import { CYCLE_ISSUES, CYCLE_LIST, PROJECT_ISSUES_LIST } from "constants/fetch-keys";
// services
import issuesService from "lib/services/issues.service";
import cyclesService from "lib/services/cycles.service";
// ui
import { Spinner, CustomSelect } from "ui";
// icons
import { ArrowPathIcon } from "@heroicons/react/24/outline";
// types
import { CycleIssueResponse, ICycle, IIssue, IssueResponse } from "types";
// common
import { classNames } from "constants/common";

type Props = {
  issueDetail: IIssue | undefined;
  control: Control<IIssue, any>;
  handleCycleChange: (cycle: ICycle) => void;
  watch: UseFormWatch<IIssue>;
};

const SelectCycle: React.FC<Props> = ({ issueDetail, control, handleCycleChange }) => {
  const router = useRouter();
  const { workspaceSlug, projectId, issueId } = router.query;

  const { data: cycles } = useSWR(
    workspaceSlug && projectId ? CYCLE_LIST(projectId as string) : null,
    workspaceSlug && projectId
      ? () => cyclesService.getCycles(workspaceSlug as string, projectId as string)
      : null
  );

  const removeIssueFromCycle = (bridgeId: string, cycleId: string) => {
    if (!workspaceSlug || !projectId) return;

    mutate(PROJECT_ISSUES_LIST(workspaceSlug as string, projectId as string));

    issuesService
      .removeIssueFromCycle(workspaceSlug as string, projectId as string, cycleId, bridgeId)
      .then((res) => {
        console.log(res);

        mutate(CYCLE_ISSUES(cycleId));
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
                    {value ? value?.cycle_detail?.name : "None"}
                  </span>
                }
                value={value}
                onChange={(value: any) => {
                  value === null
                    ? removeIssueFromCycle(
                        issueDetail?.issue_cycle?.id ?? "",
                        issueDetail?.issue_cycle?.cycle ?? ""
                      )
                    : handleCycleChange(cycles?.find((c) => c.id === value) as any);
                }}
              >
                {cycles ? (
                  cycles.length > 0 ? (
                    <>
                      <CustomSelect.Option value={null} className="capitalize">
                        <>None</>
                      </CustomSelect.Option>
                      {cycles.map((option) => (
                        <CustomSelect.Option key={option.id} value={option.id}>
                          {option.name}
                        </CustomSelect.Option>
                      ))}
                    </>
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
