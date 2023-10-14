// react
import React, { useState } from "react";

// next
import { useRouter } from "next/router";

// swr
import useSWR, { mutate } from "swr";

// services
import { IssueService } from "services/issue";
import { CycleService } from "services/cycle.service";

// hooks
import useUser from "hooks/use-user";
// fetch keys
import { ISSUE_DETAILS, INCOMPLETE_CYCLES_LIST, CYCLE_ISSUES, PROJECT_ISSUES_ACTIVITY } from "constants/fetch-keys";
// icons
import { ChevronDown } from "lucide-react";
// components
import { WebViewModal } from "components/web-view";
// types
import { ICycle, IIssue, IIssueCycle } from "types";

type Props = {
  disabled?: boolean;
  value?: IIssueCycle | null;
};

// services
const issueService = new IssueService();
const cycleService = new CycleService();

export const CycleSelect: React.FC<Props> = (props) => {
  const { disabled = false, value } = props;

  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false);

  const router = useRouter();
  const { workspaceSlug, projectId, issueId } = router.query;

  const { data: incompleteCycles } = useSWR(
    workspaceSlug && projectId ? INCOMPLETE_CYCLES_LIST(projectId as string) : null,
    workspaceSlug && projectId
      ? () => cycleService.getCyclesWithParams(workspaceSlug as string, projectId as string, "incomplete")
      : null
  );

  const { user } = useUser();

  const handleCycleChange = (cycleDetails: ICycle) => {
    if (!workspaceSlug || !projectId || !issueId || disabled) return;

    issueService
      .addIssueToCycle(
        workspaceSlug as string,
        projectId as string,
        cycleDetails.id,
        {
          issues: [issueId.toString()],
        },
        user
      )
      .then(() => {
        mutate(ISSUE_DETAILS(issueId as string));
        mutate(PROJECT_ISSUES_ACTIVITY(issueId as string));
      });
  };

  const removeIssueFromCycle = (bridgeId?: string, cycleId?: string) => {
    if (!workspaceSlug || !projectId || !bridgeId || !cycleId || disabled) return;

    mutate<IIssue>(
      ISSUE_DETAILS(issueId as string),
      (prev) => {
        if (!prev) return prev;

        return {
          ...prev,
          issue_cycle: null,
        };
      },
      false
    );

    issueService
      .removeIssueFromCycle(workspaceSlug.toString(), projectId.toString(), cycleId, bridgeId)
      .then(() => {
        mutate(CYCLE_ISSUES(cycleId));
        mutate(ISSUE_DETAILS(issueId as string));
        mutate(PROJECT_ISSUES_ACTIVITY(issueId as string));
      })
      .catch((e) => {
        console.log(e);
      });
  };

  return (
    <>
      <WebViewModal isOpen={isBottomSheetOpen} onClose={() => setIsBottomSheetOpen(false)} modalTitle="Select Module">
        <WebViewModal.Options
          options={[
            ...(incompleteCycles ?? []).map((cycle) => ({
              checked: cycle.id === value?.cycle,
              label: cycle.name,
              value: cycle.id,
              onClick: () => {
                handleCycleChange(cycle);
                setIsBottomSheetOpen(false);
              },
            })),
            {
              checked: !value,
              label: "None",
              onClick: () => {
                setIsBottomSheetOpen(false);
                removeIssueFromCycle(value?.id, value?.cycle);
              },
              value: "none",
            },
          ]}
        />
      </WebViewModal>

      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsBottomSheetOpen(true)}
        className={
          "relative w-full px-2.5 py-0.5 text-base flex justify-between items-center gap-0.5 text-custom-text-100"
        }
      >
        <span className="text-custom-text-200">{value?.cycle_detail.name ?? "Select cycle"}</span>
        <ChevronDown className="w-4 h-4 text-custom-text-200" />
      </button>
    </>
  );
};
