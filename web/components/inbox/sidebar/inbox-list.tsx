import { FC } from "react";
import { observer } from "mobx-react";
// types
import { TInboxIssue } from "@plane/types";
// components
import { InboxIssueListItem } from "../";

export type InboxIssueListProps = {
  workspaceSlug: string;
  projectId: string;
  projectIdentifier: string;
  inboxIssues: TInboxIssue[];
};

export const InboxIssueList: FC<InboxIssueListProps> = observer((props) => {
  const { workspaceSlug, projectId, inboxIssues, projectIdentifier } = props;

  return (
    <div className="overflow-y-auto w-full h-full vertical-scrollbar scrollbar-md">
      {inboxIssues.map((inboxIssue) => (
        <InboxIssueListItem
          key={inboxIssue.id}
          workspaceSlug={workspaceSlug}
          projectId={projectId}
          projectIdentifier={projectIdentifier}
          inboxIssue={inboxIssue}
        />
      ))}
    </div>
  );
});
