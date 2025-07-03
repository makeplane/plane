import React, { useCallback } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// types
import { WORK_ITEM_TRACKER_EVENTS } from "@plane/constants";
import { TIssue } from "@plane/types";
// components
import { CycleDropdown } from "@/components/dropdowns";
// hooks
import { captureSuccess } from "@/helpers/event-tracker.helper";
import { useIssuesStore } from "@/hooks/use-issue-layout-store";

type Props = {
  issue: TIssue;
  onClose: () => void;
  disabled: boolean;
};

export const SpreadsheetCycleColumn: React.FC<Props> = observer((props) => {
  const { issue, disabled, onClose } = props;
  // router
  const { workspaceSlug } = useParams();
  // hooks
  const {
    issues: { addCycleToIssue, removeCycleFromIssue },
  } = useIssuesStore();

  const handleCycle = useCallback(
    async (cycleId: string | null) => {
      if (!workspaceSlug || !issue || !issue.project_id || issue.cycle_id === cycleId) return;
      if (cycleId) await addCycleToIssue(workspaceSlug.toString(), issue.project_id, cycleId, issue.id);
      else await removeCycleFromIssue(workspaceSlug.toString(), issue.project_id, issue.id);
      captureSuccess({
        eventName: WORK_ITEM_TRACKER_EVENTS.update,
        payload: {
          id: issue.id,
        },
      });
    },
    [workspaceSlug, issue, addCycleToIssue, removeCycleFromIssue]
  );

  return (
    <div className="h-11 border-b-[0.5px] border-custom-border-200">
      <CycleDropdown
        projectId={issue.project_id ?? undefined}
        value={issue.cycle_id}
        onChange={handleCycle}
        disabled={disabled}
        placeholder="Select cycle"
        buttonVariant="transparent-with-text"
        buttonContainerClassName="w-full relative flex items-center p-2 group-[.selected-issue-row]:bg-custom-primary-100/5 group-[.selected-issue-row]:hover:bg-custom-primary-100/10 px-page-x"
        buttonClassName="relative leading-4 h-4.5 bg-transparent hover:bg-transparent px-0"
        onClose={onClose}
      />
    </div>
  );
});
