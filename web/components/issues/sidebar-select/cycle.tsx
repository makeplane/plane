import React from "react";

import { useRouter } from "next/router";

import useSWR, { mutate } from "swr";

// services
import { IssueService } from "services/issue";
import { CycleService } from "services/cycle.service";
// ui
import { CustomSelect } from "components/ui";
import { Spinner, Tooltip } from "@plane/ui";
// helper
import { truncateText } from "helpers/string.helper";
// types
import { ICycle, IIssue } from "types";
// fetch-keys
import { CYCLE_ISSUES, INCOMPLETE_CYCLES_LIST, ISSUE_DETAILS } from "constants/fetch-keys";

type Props = {
  issueDetail: IIssue | undefined;
  handleCycleChange: (cycle: ICycle) => void;
  disabled?: boolean;
};

// services
const issueService = new IssueService();
const cycleService = new CycleService();

export const SidebarCycleSelect: React.FC<Props> = ({ issueDetail, handleCycleChange, disabled = false }) => {
  const router = useRouter();
  const { workspaceSlug, projectId, issueId } = router.query;

  const { data: incompleteCycles } = useSWR(
    workspaceSlug && projectId ? INCOMPLETE_CYCLES_LIST(projectId as string) : null,
    workspaceSlug && projectId
      ? () => cycleService.getCyclesWithParams(workspaceSlug as string, projectId as string, "incomplete")
      : null
  );

  const removeIssueFromCycle = (bridgeId: string, cycleId: string) => {
    if (!workspaceSlug || !projectId) return;

    issueService
      .removeIssueFromCycle(workspaceSlug as string, projectId as string, cycleId, bridgeId)
      .then(() => {
        mutate(ISSUE_DETAILS(issueId as string));

        mutate(CYCLE_ISSUES(cycleId));
      })
      .catch((e) => {
        console.log(e);
      });
  };

  const issueCycle = issueDetail?.issue_cycle;

  return (
    <CustomSelect
      customButton={
        <div>
          <Tooltip position="left" tooltipContent={`${issueCycle ? issueCycle.cycle_detail.name : "No cycle"}`}>
            <button
              type="button"
              className={`bg-custom-background-80 text-xs rounded px-2.5 py-0.5 w-full flex ${
                disabled ? "cursor-not-allowed" : ""
              }`}
            >
              <span className={`truncate ${issueCycle ? "text-custom-text-100" : "text-custom-text-200"}`}>
                {issueCycle ? issueCycle.cycle_detail.name : "No cycle"}
              </span>
            </button>
          </Tooltip>
        </div>
      }
      value={issueCycle ? issueCycle.cycle_detail.id : null}
      onChange={(value: any) => {
        !value
          ? removeIssueFromCycle(issueCycle?.id ?? "", issueCycle?.cycle ?? "")
          : handleCycleChange(incompleteCycles?.find((c) => c.id === value) as ICycle);
      }}
      width="w-full"
      maxHeight="rg"
      disabled={disabled}
    >
      {incompleteCycles ? (
        incompleteCycles.length > 0 ? (
          <>
            {incompleteCycles.map((option) => (
              <CustomSelect.Option key={option.id} value={option.id}>
                <Tooltip position="left-bottom" tooltipContent={option.name}>
                  <span className="w-full truncate">{truncateText(option.name, 25)}</span>
                </Tooltip>
              </CustomSelect.Option>
            ))}
            <CustomSelect.Option value={null}>None</CustomSelect.Option>
          </>
        ) : (
          <div className="text-center">No cycles found</div>
        )
      ) : (
        <Spinner />
      )}
    </CustomSelect>
  );
};
