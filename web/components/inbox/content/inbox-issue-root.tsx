import React, { FC } from "react";
import { Inbox } from "lucide-react";
// components
import { InboxContentRoot } from "@/components/inbox";

type IInboxIssueContentRootProps = {
  workspaceSlug: string;
  projectId: string;
  inboxIssueId: string | undefined;
  inboxIssuesArrayLength: number;
};

export const InboxIssueContentRoot: FC<IInboxIssueContentRootProps> = (props) => {
  const { workspaceSlug, projectId, inboxIssueId, inboxIssuesArrayLength } = props;
  return (
    <div className="w-4/6">
      {inboxIssueId ? (
        <InboxContentRoot workspaceSlug={workspaceSlug} projectId={projectId} inboxIssueId={inboxIssueId} />
      ) : (
        <div className="grid h-full place-items-center p-4 text-custom-text-200">
          <div className="grid h-full place-items-center">
            <div className="my-5 flex flex-col items-center gap-4">
              <Inbox size={60} strokeWidth={1.5} />
              {inboxIssuesArrayLength > 0 ? (
                <span className="text-custom-text-200">
                  {inboxIssuesArrayLength} issues found. Select an issue from the sidebar to view its details.
                </span>
              ) : (
                <span className="text-custom-text-200">No issues found</span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
