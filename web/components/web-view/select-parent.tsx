// react
import React, { useState } from "react";

// next
import { useRouter } from "next/router";

// swr
import useSWR from "swr";

// services
import issuesService from "services/issues.service";

// fetch key
import { ISSUE_DETAILS } from "constants/fetch-keys";

// components
import { ParentIssuesListModal } from "components/issues";

// types
import { ISearchIssueResponse } from "types";

type Props = {
  value: string | null;
  onChange: (value: any) => void;
  disabled?: boolean;
};

export const ParentSelect: React.FC<Props> = (props) => {
  const { value, onChange, disabled = false } = props;

  const [isParentModalOpen, setIsParentModalOpen] = useState(false);
  const [selectedParentIssue, setSelectedParentIssue] = useState<ISearchIssueResponse | null>(null);

  const router = useRouter();
  const { workspaceSlug, projectId, issueId } = router.query;

  const { data: issueDetails } = useSWR(
    workspaceSlug && projectId && issueId ? ISSUE_DETAILS(issueId.toString()) : null,
    workspaceSlug && projectId && issueId
      ? () =>
          issuesService.retrieve(workspaceSlug.toString(), projectId.toString(), issueId.toString())
      : null
  );

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
        disabled={disabled}
        onClick={() => setIsParentModalOpen(true)}
        className={
          "relative w-full px-2.5 py-0.5 text-base flex justify-between items-center gap-0.5 text-custom-text-100"
        }
      >
        {selectedParentIssue && issueDetails?.parent ? (
          `${selectedParentIssue.project__identifier}-${selectedParentIssue.sequence_id}`
        ) : !selectedParentIssue && issueDetails?.parent ? (
          `${issueDetails.parent_detail?.project_detail.identifier}-${issueDetails.parent_detail?.sequence_id}`
        ) : (
          <span className="text-custom-text-200">Select issue</span>
        )}
      </button>
    </>
  );
};
