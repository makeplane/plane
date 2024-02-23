import React, { useCallback } from "react";
import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
// hooks
import { useEventTracker, useIssues } from "hooks/store";
// components
import { CycleDropdown } from "components/dropdowns";
// types
import { TIssue } from "@plane/types";
// constants
import { EIssuesStoreType } from "constants/issue";

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
    issues: { addIssueToCycle, removeIssueFromCycle },
  } = useIssues(EIssuesStoreType.CYCLE);

  const handleCycle = useCallback(
    async (cycleId: string | null) => {
      console.log("cycleId", cycleId);
      if (!workspaceSlug || !issue || issue.cycle_id === cycleId) return;
      if (cycleId) await addIssueToCycle(workspaceSlug.toString(), issue.project_id, cycleId, [issue.id]);
      else await removeIssueFromCycle(workspaceSlug.toString(), issue.project_id, issue.cycle_id ?? "", issue.id);
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
    [workspaceSlug, issue, addIssueToCycle, removeIssueFromCycle, captureIssueEvent, router.asPath]
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
        buttonClassName="relative border-[0.5px] border-custom-border-400 h-4.5"
        onClose={onClose}
      />
    </div>
  );
});
