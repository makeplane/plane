import type { FC } from "react";
import { Fragment } from "react";
import { observer } from "mobx-react";
// local imports
import { InboxIssueListItem } from "./inbox-list-item";

export type InboxIssueListProps = {
  workspaceSlug: string;
  projectId: string;
  projectIdentifier?: string;
  inboxIssueIds: string[];
  setIsMobileSidebar: (value: boolean) => void;
};

export const InboxIssueList = observer(function InboxIssueList(props: InboxIssueListProps) {
  const { workspaceSlug, projectId, projectIdentifier, inboxIssueIds, setIsMobileSidebar } = props;

  return (
    <>
      {inboxIssueIds.map((inboxIssueId) => (
        <Fragment key={inboxIssueId}>
          <InboxIssueListItem
            setIsMobileSidebar={setIsMobileSidebar}
            workspaceSlug={workspaceSlug}
            projectId={projectId}
            projectIdentifier={projectIdentifier}
            inboxIssueId={inboxIssueId}
          />
        </Fragment>
      ))}
    </>
  );
});
