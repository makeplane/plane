import React, { useCallback } from "react";
import { observer } from "mobx-react";
import { useRouter } from "next/router";
import { TIssue } from "@plane/types";
// hooks
import { CycleDropdown } from "@/components/dropdowns";
import { EIssuesStoreType } from "@/constants/issue";
import { useEventTracker, useIssues } from "@/hooks/store";
// components
// types
// constants

type Props = {
  issue: TIssue;
  onClose: () => void;
  disabled: boolean;
};

export const SpreadsheetCycleColumn: React.FC<Props> = observer((props) => {
  // router
  const router = useRouter();
  const { workspaceSlug } = router.query;
  // props
  const { issue, disabled, onClose } = props;
  // hooks
  const { captureIssueEvent } = useEventTracker();
  const {
    issues: { addCycleToIssue, removeCycleFromIssue },
  } = useIssues(EIssuesStoreType.CYCLE);

  const handleCycle = useCallback(
    async (cycleId: string | null) => {
      if (!workspaceSlug || !issue || issue.cycle_id === cycleId) return;
      if (cycleId) await addCycleToIssue(workspaceSlug.toString(), issue.project_id, cycleId, issue.id);
      else await removeCycleFromIssue(workspaceSlug.toString(), issue.project_id, issue.id);
      captureIssueEvent({
        eventName: "Issue updated",
        payload: {
          ...issue,
          cycle_id: cycleId,
          element: "Spreadsheet layout",
        },
        updates: { changed_property: "cycle", change_details: { cycle_id: cycleId } },
        path: router.asPath,
      });
    },
    [workspaceSlug, issue, addCycleToIssue, removeCycleFromIssue, captureIssueEvent, router.asPath]
  );

  return (
    <div className="h-11 border-b-[0.5px] border-custom-border-200">
      <CycleDropdown
        projectId={issue.project_id}
        value={issue.cycle_id}
        onChange={handleCycle}
        disabled={disabled}
        placeholder="Select cycle"
        buttonVariant="transparent-with-text"
        buttonContainerClassName="w-full relative flex items-center p-2"
        buttonClassName="relative leading-4 h-4.5 bg-transparent"
        onClose={onClose}
      />
    </div>
  );
});
