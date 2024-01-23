import React, { ReactNode, useState } from "react";
import { observer } from "mobx-react-lite";
import useSWR from "swr";
// hooks
import { useCycle, useIssueDetail } from "hooks/store";
// ui
import { ContrastIcon, CustomSearchSelect, Spinner, Tooltip } from "@plane/ui";
// types
import type { TIssueOperations } from "./root";

type TIssueCycleSelect = {
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  issueOperations: TIssueOperations;
  disabled?: boolean;
};

export const IssueCycleSelect: React.FC<TIssueCycleSelect> = observer((props) => {
  const { workspaceSlug, projectId, issueId, issueOperations, disabled = false } = props;
  // hooks
  const { getCycleById, currentProjectIncompleteCycleIds, fetchAllCycles } = useCycle();
  const {
    issue: { getIssueById },
  } = useIssueDetail();
  // state
  const [isUpdating, setIsUpdating] = useState(false);

  useSWR(workspaceSlug && projectId ? `PROJECT_${projectId}_ISSUE_${issueId}_CYCLES` : null, async () => {
    if (workspaceSlug && projectId) await fetchAllCycles(workspaceSlug, projectId);
  });

  const issue = getIssueById(issueId);
  const projectCycleIds = currentProjectIncompleteCycleIds;
  const issueCycle = (issue && issue.cycle_id && getCycleById(issue.cycle_id)) || undefined;
  const disableSelect = disabled || isUpdating;

  const handleIssueCycleChange = async (cycleId: string) => {
    if (!cycleId) return;
    setIsUpdating(true);
    if (issue && issue.cycle_id === cycleId)
      await issueOperations.removeIssueFromCycle(workspaceSlug, projectId, cycleId, issueId);
    else await issueOperations.addIssueToCycle(workspaceSlug, projectId, cycleId, [issueId]);
    setIsUpdating(false);
  };

  type TDropdownOptions = { value: string; query: string; content: ReactNode }[];
  const options: TDropdownOptions | undefined = projectCycleIds
    ? (projectCycleIds
        .map((cycleId) => {
          const cycle = getCycleById(cycleId) || undefined;
          if (!cycle) return undefined;
          return {
            value: cycle.id,
            query: cycle.name,
            content: (
              <div className="flex items-center gap-1.5 truncate">
                <span className="flex h-3.5 w-3.5 flex-shrink-0 items-center justify-center">
                  <ContrastIcon />
                </span>
                <span className="flex-grow truncate">{cycle.name}</span>
              </div>
            ) as ReactNode,
          };
        })
        .filter((cycle) => cycle !== undefined) as TDropdownOptions)
    : undefined;

  return (
    <div className="flex items-center gap-1">
      <CustomSearchSelect
        value={issue?.cycle_id || undefined}
        onChange={(value: any) => handleIssueCycleChange(value)}
        options={options}
        customButton={
          <div>
            <Tooltip position="left" tooltipContent={`${issueCycle ? issueCycle?.name : "No cycle"}`}>
              <button
                type="button"
                className={`flex w-full items-center rounded bg-custom-background-80 px-2.5 py-0.5 text-xs ${
                  disableSelect ? "cursor-not-allowed" : ""
                } max-w-[10rem]`}
              >
                <span
                  className={`flex items-center gap-1.5 truncate ${
                    issueCycle ? "text-custom-text-100" : "text-custom-text-200"
                  }`}
                >
                  <span className="flex-shrink-0">{issueCycle && <ContrastIcon className="h-3.5 w-3.5" />}</span>
                  <span className="truncate">{issueCycle ? issueCycle?.name : "No cycle"}</span>
                </span>
              </button>
            </Tooltip>
          </div>
        }
        noChevron
        disabled={disableSelect}
      />
      {isUpdating && <Spinner className="h-4 w-4" />}
    </div>
  );
});
