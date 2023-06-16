import React from "react";

import { useRouter } from "next/router";

import useSWR, { mutate } from "swr";

// services
import issuesService from "services/issues.service";
import cyclesService from "services/cycles.service";
// ui
import { Spinner, CustomSelect, Tooltip } from "components/ui";
// helper
import { truncateText } from "helpers/string.helper";
// icons
import { ContrastIcon } from "components/icons";
// types
import { ICycle, IIssue, UserAuth } from "types";
// fetch-keys
import { CYCLE_ISSUES, INCOMPLETE_CYCLES_LIST, ISSUE_DETAILS } from "constants/fetch-keys";

type Props = {
  issueDetail: IIssue | undefined;
  handleCycleChange: (cycle: ICycle) => void;
  userAuth: UserAuth;
};

export const SidebarCycleSelect: React.FC<Props> = ({
  issueDetail,
  handleCycleChange,
  userAuth,
}) => {
  const router = useRouter();
  const { workspaceSlug, projectId, issueId } = router.query;

  const { data: incompleteCycles } = useSWR(
    workspaceSlug && projectId ? INCOMPLETE_CYCLES_LIST(projectId as string) : null,
    workspaceSlug && projectId
      ? () =>
          cyclesService.getCyclesWithParams(
            workspaceSlug as string,
            projectId as string,
            "incomplete"
          )
      : null
  );

  const removeIssueFromCycle = (bridgeId: string, cycleId: string) => {
    if (!workspaceSlug || !projectId) return;

    issuesService
      .removeIssueFromCycle(workspaceSlug as string, projectId as string, cycleId, bridgeId)
      .then((res) => {
        mutate(ISSUE_DETAILS(issueId as string));

        mutate(CYCLE_ISSUES(cycleId));
      })
      .catch((e) => {
        console.log(e);
      });
  };

  const issueCycle = issueDetail?.issue_cycle;

  const isNotAllowed = userAuth.isGuest || userAuth.isViewer;

  return (
    <div className="flex flex-wrap items-center py-2">
      <div className="flex items-center gap-x-2 text-sm text-brand-secondary sm:basis-1/2">
        <ContrastIcon className="h-4 w-4 flex-shrink-0" />
        <p>Cycle</p>
      </div>
      <div className="space-y-1 sm:basis-1/2">
        <CustomSelect
          label={
            <Tooltip
              position="left"
              tooltipContent={`${issueCycle ? issueCycle.cycle_detail.name : "No cycle"}`}
            >
              <span className="w-full max-w-[125px] truncate text-left sm:block">
                <span className={`${issueCycle ? "text-brand-base" : "text-brand-secondary"}`}>
                  {issueCycle ? truncateText(issueCycle.cycle_detail.name, 15) : "No cycle"}
                </span>
              </span>
            </Tooltip>
          }
          value={issueCycle ? issueCycle.cycle_detail.id : null}
          onChange={(value: any) => {
            !value
              ? removeIssueFromCycle(issueCycle?.id ?? "", issueCycle?.cycle ?? "")
              : handleCycleChange(incompleteCycles?.find((c) => c.id === value) as ICycle);
          }}
          width="auto"
          position="right"
          maxHeight="rg"
          disabled={isNotAllowed}
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
      </div>
    </div>
  );
};
