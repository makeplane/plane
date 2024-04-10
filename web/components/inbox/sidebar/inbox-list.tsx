import { FC, Fragment } from "react";
import { observer } from "mobx-react";
// components
import { InboxIssueListItem } from "@/components/inbox";
// store
import { IInboxIssueStore } from "@/store/inbox/inbox-issue.store";

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
        <Fragment key={inboxIssue.id}>
          <InboxIssueListItem
            workspaceSlug={workspaceSlug}
            projectId={projectId}
            projectIdentifier={projectIdentifier}
            inboxIssue={inboxIssue}
          />
        </Fragment>
      ))}
    </>
  );
});
