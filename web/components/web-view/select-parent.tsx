import React, { useState } from "react";
import { useRouter } from "next/router";
import useSWR from "swr";

// services
import { IssueService } from "services/issue";
// constants
import { ISSUE_DETAILS } from "constants/fetch-keys";
// components
import { IssuesSelectBottomSheet } from "components/web-view";
// icons
import { ChevronDown, X } from "lucide-react";
// types
import { ISearchIssueResponse } from "types";

type Props = {
  value: string | null;
  onChange: (value: any) => void;
  disabled?: boolean;
};

const issueService = new IssueService();

export const ParentSelect: React.FC<Props> = (props) => {
  const { onChange, disabled = false } = props;

  const [isParentModalOpen, setIsParentModalOpen] = useState(false);
  const [selectedParentIssue, setSelectedParentIssue] = useState<ISearchIssueResponse | null>(null);

  const router = useRouter();
  const { workspaceSlug, projectId, issueId } = router.query;

  const { data: issueDetails } = useSWR(
    workspaceSlug && projectId && issueId ? ISSUE_DETAILS(issueId.toString()) : null,
    workspaceSlug && projectId && issueId
      ? () => issueService.retrieve(workspaceSlug.toString(), projectId.toString(), issueId.toString())
      : null
  );

  const parentIssueResult = selectedParentIssue
    ? `${selectedParentIssue.project__identifier}-${selectedParentIssue.sequence_id}`
    : issueDetails?.parent
    ? `${issueDetails.parent_detail?.project_detail.identifier}-${issueDetails.parent_detail?.sequence_id}`
    : null; // defaults to null

  return (
    <>
      <IssuesSelectBottomSheet
        isOpen={isParentModalOpen}
        onClose={() => setIsParentModalOpen(false)}
        singleSelect
        onSubmit={async (issues) => {
          if (disabled) return;
          const issue = issues[0];
          onChange(issue.id);
          setSelectedParentIssue(issue);
        }}
        searchParams={{
          parent: true,
          issue_id: issueId as string,
        }}
      />

      {parentIssueResult ? (
        <div className="flex justify-between items-center gap-0.5">
          <button
            type="button"
            onClick={() => {
              setIsParentModalOpen(true);
            }}
          >
            <span>{parentIssueResult}</span>
          </button>
          <button
            type="button"
            disabled={disabled}
            className="pr-2.5"
            onClick={() => {
              onChange(null);
              setSelectedParentIssue(null);
            }}
          >
            <X className="w-4 h-4 text-custom-text-200" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          disabled={disabled}
          onClick={() => {
            setIsParentModalOpen(true);
          }}
          className={"relative w-full px-2.5 py-0.5 text-base flex justify-between items-center gap-0.5"}
        >
          <span className="text-custom-text-200">Select issue</span>
          <ChevronDown className="w-4 h-4 text-custom-text-200" />
        </button>
      )}
    </>
  );
};
