import React, { useState } from "react";

import { useRouter } from "next/router";
// hooks
import { useIssueDetail, useIssues, useProject } from "hooks/store";
// components
import { ParentIssuesListModal } from "components/issues";
// icons
import { X } from "lucide-react";
// types
import { TIssue, ISearchIssueResponse } from "@plane/types";
import { observer } from "mobx-react-lite";

type Props = {
  onChange: (value: string) => void;
  issueDetails: TIssue | undefined;
  disabled?: boolean;
};

export const SidebarParentSelect: React.FC<Props> = observer(({ onChange, issueDetails, disabled = false }) => {
  const [selectedParentIssue, setSelectedParentIssue] = useState<ISearchIssueResponse | null>(null);

  const { isParentIssueModalOpen, toggleParentIssueModal } = useIssueDetail();

  const router = useRouter();
  const { projectId, issueId } = router.query;

  // hooks
  const { getProjectById } = useProject();
  const { issueMap } = useIssues();

  return (
    <>
      <ParentIssuesListModal
        isOpen={isParentIssueModalOpen}
        handleClose={() => toggleParentIssueModal(false)}
        onChange={(issue) => {
          onChange(issue.id);
          setSelectedParentIssue(issue);
        }}
        issueId={issueId as string}
        projectId={projectId as string}
      />
      <button
        className={`flex items-center gap-2 rounded bg-custom-background-80 px-2.5 py-0.5 text-xs w-max max-w-max" ${
          disabled ? "cursor-not-allowed" : "cursor-pointer "
        }`}
        onClick={() => {
          if (issueDetails?.parent_id) {
            onChange("");
            setSelectedParentIssue(null);
          } else {
            toggleParentIssueModal(true);
          }
        }}
        disabled={disabled}
      >
        {selectedParentIssue && issueDetails?.parent_id ? (
          `${selectedParentIssue.project__identifier}-${selectedParentIssue.sequence_id}`
        ) : !selectedParentIssue && issueDetails?.parent_id ? (
          `${getProjectById(issueDetails.parent_id)?.identifier}-${issueMap[issueDetails.parent_id]?.sequence_id}`
        ) : (
          <span className="text-custom-text-200">Select issue</span>
        )}
        {issueDetails?.parent_id && <X className="h-2.5 w-2.5" />}
      </button>
    </>
  );
});
