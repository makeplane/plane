import React, { useState } from "react";

import { useRouter } from "next/router";

// icons
import { UserIcon } from "@heroicons/react/24/outline";
// components
import { ParentIssuesListModal } from "components/issues";
// types
import { IIssue, ISearchIssueResponse, UserAuth } from "types";

type Props = {
  onChange: (value: string) => void;
  issueDetails: IIssue | undefined;
  userAuth: UserAuth;
  disabled?: boolean;
};

export const SidebarParentSelect: React.FC<Props> = ({
  onChange,
  issueDetails,
  userAuth,
  disabled = false,
}) => {
  const [isParentModalOpen, setIsParentModalOpen] = useState(false);
  const [selectedParentIssue, setSelectedParentIssue] = useState<ISearchIssueResponse | null>(null);

  const router = useRouter();
  const { projectId, issueId } = router.query;

  const isNotAllowed = userAuth.isGuest || userAuth.isViewer || disabled;

  return (
    <div className="flex flex-wrap items-center py-2">
      <div className="flex items-center gap-x-2 text-sm text-custom-text-200 sm:basis-1/2">
        <UserIcon className="h-4 w-4 flex-shrink-0" />
        <p>Parent</p>
      </div>
      <div className="sm:basis-1/2">
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
          className={`flex w-full ${
            isNotAllowed ? "cursor-not-allowed" : "cursor-pointer hover:bg-custom-background-80"
          } items-center justify-between gap-1 rounded-md border border-custom-border-200 px-2 py-1 text-xs shadow-sm duration-300 focus:outline-none`}
          onClick={() => setIsParentModalOpen(true)}
          disabled={isNotAllowed}
        >
          {selectedParentIssue && issueDetails?.parent ? (
            `${selectedParentIssue.project__identifier}-${selectedParentIssue.sequence_id}`
          ) : !selectedParentIssue && issueDetails?.parent ? (
            `${issueDetails.parent_detail?.project_detail.identifier}-${issueDetails.parent_detail?.sequence_id}`
          ) : (
            <span className="text-custom-text-200">Select issue</span>
          )}
        </button>
      </div>
    </div>
  );
};
