import React, { FC } from "react";
// components
import { EmptyState } from "@/components/empty-state";
import { InboxContentRoot } from "@/components/inbox";
import { EmptyStateType } from "@/constants/empty-state";

type IInboxIssueContentRootProps = {
  workspaceSlug: string;
  projectId: string;
  inboxIssueId: string | undefined;
  inboxIssuesArrayLength: number;
};

export const InboxIssueContentRoot: FC<IInboxIssueContentRootProps> = (props) => {
  const { workspaceSlug, projectId, inboxIssueId } = props;
  return (
    <div className="w-4/6">
      {inboxIssueId ? (
        <InboxContentRoot workspaceSlug={workspaceSlug} projectId={projectId} inboxIssueId={inboxIssueId} />
      ) : (
        <div className="flex items-center justify-center h-full w-full">
          <EmptyState type={EmptyStateType.INBOX_DETAIL_EMPTY_STATE} layout="screen-simple" />
        </div>
      )}
    </div>
  );
};
