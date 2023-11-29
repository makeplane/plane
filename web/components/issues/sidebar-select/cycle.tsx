import React from "react";
import { useRouter } from "next/router";
import useSWR, { mutate } from "swr";
// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
// services
import { CycleService } from "services/cycle.service";
// ui
import { ContrastIcon, CustomSearchSelect, Tooltip } from "@plane/ui";
// types
import { IIssue } from "types";
// fetch-keys
import { CYCLE_ISSUES, INCOMPLETE_CYCLES_LIST, ISSUE_DETAILS } from "constants/fetch-keys";

type Props = {
  issueDetail: IIssue | undefined;
  handleCycleChange: (cycleId: string) => void;
  disabled?: boolean;
};

// services
const cycleService = new CycleService();

export const SidebarCycleSelect: React.FC<Props> = (props) => {
  const { issueDetail, handleCycleChange, disabled = false } = props;
  // router
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;
  // mobx store
  const {
    cycleIssues: { removeIssueFromCycle },
  } = useMobxStore();

  const { data: incompleteCycles } = useSWR(
    workspaceSlug && projectId ? INCOMPLETE_CYCLES_LIST(projectId as string) : null,
    workspaceSlug && projectId
      ? () => cycleService.getCyclesWithParams(workspaceSlug as string, projectId as string, "incomplete")
      : null
  );

  const handleRemoveIssueFromCycle = (bridgeId: string, cycleId: string) => {
    if (!workspaceSlug || !projectId || !issueDetail) return;

    removeIssueFromCycle(workspaceSlug.toString(), projectId.toString(), cycleId, issueDetail.id, bridgeId)
      .then(() => {
        mutate(ISSUE_DETAILS(issueDetail.id));

        mutate(CYCLE_ISSUES(cycleId));
      })
      .catch((e) => {
        console.log(e);
      });
  };

  const options = incompleteCycles?.map((cycle) => ({
    value: cycle.id,
    query: cycle.name,
    content: (
      <div className="flex items-center gap-1.5 truncate">
        <span className="flex justify-center items-center flex-shrink-0 w-3.5 h-3.5">
          <ContrastIcon />
        </span>
        <span className="truncate flex-grow">{cycle.name}</span>
      </div>
    ),
  }));

  const issueCycle = issueDetail?.issue_cycle;

  return (
    <CustomSearchSelect
      value={issueCycle?.cycle_detail.id}
      onChange={(value: any) => {
        value === issueCycle?.cycle_detail.id
          ? handleRemoveIssueFromCycle(issueCycle?.id ?? "", issueCycle?.cycle ?? "")
          : handleCycleChange(value);
      }}
      options={options}
      customButton={
        <div>
          <Tooltip position="left" tooltipContent={`${issueCycle ? issueCycle.cycle_detail.name : "No cycle"}`}>
            <button
              type="button"
              className={`bg-custom-background-80 text-xs rounded px-2.5 py-0.5 w-full flex items-center ${
                disabled ? "cursor-not-allowed" : ""
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
      disabled={disabled}
    />
  );
};
