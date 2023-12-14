import React, { useState } from "react";
import { useRouter } from "next/router";
import useSWR, { mutate } from "swr";
// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
// services
import { CycleService } from "services/cycle.service";
// ui
import { ContrastIcon, CustomSearchSelect, Spinner, Tooltip } from "@plane/ui";
// types
import { IIssue } from "types";
// fetch-keys
import { CYCLE_ISSUES, INCOMPLETE_CYCLES_LIST, ISSUE_DETAILS } from "constants/fetch-keys";

type Props = {
  issueDetail: IIssue | undefined;
  projectId: string;
  handleCycleChange?: (cycleId: string) => void;
  disabled?: boolean;
  handleIssueUpdate?: () => void;
};

// services
const cycleService = new CycleService();

export const SidebarCycleSelect: React.FC<Props> = (props) => {
  const { issueDetail, disabled = false, handleIssueUpdate, handleCycleChange } = props;
  // router
  const router = useRouter();
  const { workspaceSlug, projectId: _projectId, peekProjectId } = router.query;
  // mobx store
  const {
    cycleIssues: { removeIssueFromCycle, addIssueToCycle },
  } = useMobxStore();

  const [isUpdating, setIsUpdating] = useState(false);

  const projectId = _projectId ?? peekProjectId;

  const { data: incompleteCycles } = useSWR(
    workspaceSlug && projectId ? INCOMPLETE_CYCLES_LIST(projectId as string) : null,
    workspaceSlug && projectId
      ? () => cycleService.getCyclesWithParams(workspaceSlug as string, projectId as string, "incomplete")
      : null
  );

  const handleCycleStoreChange = async (cycleId: string) => {
    if (!workspaceSlug || !issueDetail || !cycleId) return;

    setIsUpdating(true);
    await addIssueToCycle(workspaceSlug.toString(), cycleId, [issueDetail.id], false, projectId?.toString())
      .then(async () => {
        handleIssueUpdate && (await handleIssueUpdate());
      })
      .finally(() => {
        setIsUpdating(false);
      });
  };

  const handleRemoveIssueFromCycle = (bridgeId: string, cycleId: string) => {
    if (!workspaceSlug || !projectId || !issueDetail) return;

    setIsUpdating(true);
    removeIssueFromCycle(workspaceSlug.toString(), projectId.toString(), cycleId, issueDetail.id, bridgeId)
      .then(async () => {
        handleIssueUpdate && (await handleIssueUpdate());
        mutate(ISSUE_DETAILS(issueDetail.id));

        mutate(CYCLE_ISSUES(cycleId));
      })
      .catch((e) => {
        console.log(e);
      })
      .finally(() => {
        setIsUpdating(false);
      });
  };

  const options = incompleteCycles?.map((cycle) => ({
    value: cycle.id,
    query: cycle.name,
    content: (
      <div className="flex items-center gap-1.5 truncate">
        <span className="flex h-3.5 w-3.5 flex-shrink-0 items-center justify-center">
          <ContrastIcon />
        </span>
        <span className="flex-grow truncate">{cycle.name}</span>
      </div>
    ),
  }));

  const issueCycle = issueDetail?.issue_cycle;

  const disableSelect = disabled || isUpdating;

  return (
    <div className="flex items-center gap-1">
      <CustomSearchSelect
        value={issueCycle?.cycle_detail.id}
        onChange={(value: any) => {
          value === issueCycle?.cycle_detail.id
            ? handleRemoveIssueFromCycle(issueCycle?.id ?? "", issueCycle?.cycle ?? "")
            : handleCycleChange
              ? handleCycleChange(value)
              : handleCycleStoreChange(value);
        }}
        options={options}
        customButton={
          <div>
            <Tooltip position="left" tooltipContent={`${issueCycle ? issueCycle.cycle_detail.name : "No cycle"}`}>
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
                  <span className="truncate">{issueCycle ? issueCycle.cycle_detail.name : "No cycle"}</span>
                </span>
              </button>
            </Tooltip>
          </div>
        }
        width="max-w-[10rem]"
        noChevron
        disabled={disableSelect}
      />
      {isUpdating && <Spinner className="h-4 w-4" />}
    </div>
  );
};
