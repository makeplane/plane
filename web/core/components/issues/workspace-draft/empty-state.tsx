"use client";

import { FC, Fragment, useState } from "react";
// components
import { EmptyState } from "@/components/empty-state";
import { CreateUpdateIssueModal } from "@/components/issues";
// constants
import { EmptyStateType } from "@/constants/empty-state";
import { EIssuesStoreType } from "@/constants/issue";

export const WorkspaceDraftEmptyState: FC = () => {
  // state
  const [isDraftIssueModalOpen, setIsDraftIssueModalOpen] = useState(false);

  return (
    <Fragment>
      <CreateUpdateIssueModal
        isOpen={isDraftIssueModalOpen}
        storeType={EIssuesStoreType.WORKSPACE_DRAFT}
        onClose={() => setIsDraftIssueModalOpen(false)}
        isDraft
      />
      <div className="relative h-full w-full overflow-y-auto">
        <EmptyState
          type={EmptyStateType.WORKSPACE_DRAFT_ISSUES}
          primaryButtonOnClick={() => {
            setIsDraftIssueModalOpen(true);
          }}
        />
      </div>
    </Fragment>
  );
};
