import { FC, Fragment } from "react";
import { observer } from "mobx-react";
// components
import { InboxIssueListItem } from "@/components/inbox";

export type InboxIssueListProps = {
  workspaceSlug: string;
  projectId: string;
  projectIdentifier?: string;
  filteredInboxIssueIds: string[];
  setIsMobileSidebar: (value: boolean) => void;
};

export const InboxIssueList: FC<InboxIssueListProps> = observer((props) => {
  const { workspaceSlug, projectId, projectIdentifier, filteredInboxIssueIds, setIsMobileSidebar } = props;

  return (
    <>
      {filteredInboxIssueIds.map((inboxIssueId) => (
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
