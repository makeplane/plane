import { FC } from "react";
import { observer } from "mobx-react";
// components
import { InboxIssueListItem } from "components/inbox";
// store
import { IInboxIssueStore } from "store/inbox-issue.store";

export type InboxIssueListProps = {
  workspaceSlug: string;
  projectId: string;
  projectIdentifier?: string;
  inboxIssues: IInboxIssueStore[];
};

export const InboxIssueList: FC<InboxIssueListProps> = observer((props) => {
  const { workspaceSlug, projectId, projectIdentifier, inboxIssues } = props;

  return (
    <>
      {inboxIssues.map((inboxIssue) => (
        <InboxIssueListItem
          key={inboxIssue.id}
          workspaceSlug={workspaceSlug}
          projectId={projectId}
          projectIdentifier={projectIdentifier}
          inboxIssue={inboxIssue}
        />
      ))}
    </>
  );
});
