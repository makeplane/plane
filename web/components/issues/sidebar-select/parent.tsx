import React, { useState } from "react";

import { useRouter } from "next/router";

// components
import { ParentIssuesListModal } from "components/issues";
// icons
import { X } from "lucide-react";
// types
import { IIssue, ISearchIssueResponse } from "types";

type Props = {
  onChange: (value: string) => void;
  issueDetails: IIssue | undefined;
  disabled?: boolean;
};

export const SidebarParentSelect: React.FC<Props> = ({ onChange, issueDetails, disabled = false }) => {
  const [isParentModalOpen, setIsParentModalOpen] = useState(false);
  const [selectedParentIssue, setSelectedParentIssue] = useState<ISearchIssueResponse | null>(null);

  const router = useRouter();
  const { projectId, issueId } = router.query;

  return (
    <>
      <ParentIssuesListModal
        isOpen={isParentModalOpen}
        handleClose={() => setIsParentModalOpen(false)}
        onChange={(issue) => {
          onChange(issue.id);
          setSelectedParentIssue(issue);
        }}
        issueId={issueId as string}
        projectId={projectId as string}
      />

      <button
        type="button"
        className={`flex items-center gap-2 rounded bg-custom-background-80 px-2.5 py-0.5 text-xs max-w-max" ${
          disabled ? "cursor-not-allowed" : "cursor-pointer "
        }`}
        onClick={() => {
          if (issueDetails?.parent) {
            onChange("");
            setSelectedParentIssue(null);
          } else {
            setIsParentModalOpen(true);
          }
        }}
        disabled={disabled}
      >
        {selectedParentIssue && issueDetails?.parent ? (
          `${selectedParentIssue.project__identifier}-${selectedParentIssue.sequence_id}`
        ) : !selectedParentIssue && issueDetails?.parent ? (
          `${issueDetails.parent_detail?.project_detail.identifier}-${issueDetails.parent_detail?.sequence_id}`
        ) : (
          <span className="text-custom-text-200">Select issue</span>
        )}
        {issueDetails?.parent && <X className="h-2.5 w-2.5" />}
      </button>
    </>
  );
};
