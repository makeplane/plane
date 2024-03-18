import React, { FC } from "react";
// icons
import { Inbox } from "lucide-react";
// components
import { InboxContentRoot } from "./root";
// types
import { IInboxIssueStore } from "store/inbox-issue.store";

type IInboxIssueRootProps = {
  workspaceSlug: string;
  projectId: string;
  inboxIssuesArray: IInboxIssueStore[] | undefined;
  inboxIssueId: string | undefined;
};

export const InboxIssueRoot: FC<IInboxIssueRootProps> = (props) => {
  const { workspaceSlug, projectId, inboxIssuesArray, inboxIssueId } = props;
  return (
    <div className="w-3/5">
      {inboxIssueId ? (
        <InboxContentRoot
          workspaceSlug={workspaceSlug.toString()}
          projectId={projectId.toString()}
          inboxIssueId={inboxIssueId.toString()}
        />
      ) : (
        <div className="grid h-full place-items-center p-4 text-custom-text-200">
          <div className="grid h-full place-items-center">
            <div className="my-5 flex flex-col items-center gap-4">
              <Inbox size={60} strokeWidth={1.5} />
              {inboxIssuesArray && inboxIssuesArray.length > 0 ? (
                <span className="text-custom-text-200">
                  {inboxIssuesArray?.length} issues found. Select an issue from the sidebar to view its details.
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
