import React from "react";

import { useRouter } from "next/router";

import useSWR, { mutate } from "swr";

// services
import issuesService from "services/issues.service";
import cyclesService from "services/cycles.service";
// ui
import { Spinner, CustomSelect } from "components/ui";
// icons
import { CyclesIcon } from "components/icons";
// types
import { ICycle, IIssue, UserAuth } from "types";
// fetch-keys
import { CYCLE_ISSUES, CYCLE_LIST, ISSUE_DETAILS } from "constants/fetch-keys";

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

  const { data: cycles } = useSWR(
    workspaceSlug && projectId ? CYCLE_LIST(projectId as string) : null,
    workspaceSlug && projectId
      ? () => cyclesService.getCycles(workspaceSlug as string, projectId as string)
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
      <div className="flex items-center gap-x-2 text-sm sm:basis-1/2">
        <CyclesIcon className="h-4 w-4 flex-shrink-0" />
        <p>Cycle</p>
      </div>
      <div className="space-y-1 sm:basis-1/2">
        <CustomSelect
          label={
            <span
              className={`hidden truncate text-left sm:block ${issueCycle ? "" : "text-gray-900"}`}
            >
              {issueCycle ? issueCycle.cycle_detail.name : "None"}
            </span>
          }
          value={issueCycle?.cycle_detail.id}
          onChange={(value: any) => {
            value === null
              ? removeIssueFromCycle(issueCycle?.id ?? "", issueCycle?.cycle ?? "")
              : handleCycleChange(cycles?.find((c) => c.id === value) as ICycle);
          }}
          disabled={isNotAllowed}
        >
          {cycles ? (
            cycles.length > 0 ? (
              <>
                <CustomSelect.Option value={null} className="capitalize">
                  None
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
      </div>
    </div>
  );
};
