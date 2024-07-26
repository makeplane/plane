import React, { useCallback } from "react";
import { observer } from "mobx-react";
import { useParams, usePathname } from "next/navigation";
// types
import { TIssue } from "@plane/types";
// components
import { CycleDropdown } from "@/components/dropdowns";
// hooks
import { useEventTracker } from "@/hooks/store";
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
  const pathname = usePathname();
  // hooks
  const { captureIssueEvent } = useEventTracker();
  const {
    issues: { addCycleToIssue, removeCycleFromIssue },
  } = useIssuesStore();

  const handleCycle = useCallback(
    async (cycleId: string | null) => {
      if (!workspaceSlug || !issue || !issue.project_id || issue.cycle_id === cycleId) return;
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
        path: pathname,
      });
    },
    [workspaceSlug, issue, addCycleToIssue, removeCycleFromIssue, captureIssueEvent, pathname]
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
        buttonContainerClassName="w-full relative flex items-center p-2 group-[.selected-issue-row]:bg-custom-primary-100/5 group-[.selected-issue-row]:hover:bg-custom-primary-100/10"
        buttonClassName="relative leading-4 h-4.5 bg-transparent hover:bg-transparent"
        onClose={onClose}
      />
    </div>
  );
});
