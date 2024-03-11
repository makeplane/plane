import { FC } from "react";
import { observer } from "mobx-react";
import { Inbox } from "lucide-react";
// hooks
import { useInboxIssues, useProjectInbox } from "hooks/store";
// components
import { InboxIssueActionsHeader, InboxIssueMainContent, InboxIssueDetailsSidebar } from "components/inbox";

type TInboxContentRoot = {
  workspaceSlug: string;
  projectId: string;
  inboxIssueId: string;
};

export const InboxContentRoot: FC<TInboxContentRoot> = observer((props) => {
  const { workspaceSlug, projectId, inboxIssueId } = props;
  // hooks
  const { inboxIssuesArray } = useProjectInbox();
  const inboxIssue = useInboxIssues(inboxIssueId);

  return (
    <>
      <div className="w-full h-full overflow-hidden relative flex flex-col">
        <div className="flex-shrink-0 min-h-[50px] border-b border-custom-border-300">
          <InboxIssueActionsHeader workspaceSlug={workspaceSlug} projectId={projectId} inboxIssue={inboxIssue} />
        </div>
        <div className="w-full h-full">
          {/* <InboxIssueDetailRoot workspaceSlug={workspaceSlug} projectId={projectId} issueId={inboxIssueId} /> */}
          <div className="flex h-full overflow-hidden">
            <div className="h-full w-2/3 space-y-5 divide-y-2 divide-custom-border-300 overflow-y-auto p-5 vertical-scrollbar scrollbar-md">
              {/* <InboxIssueMainContent
                workspaceSlug={workspaceSlug}
                projectId={projectId}
                issueId={issueId}
                issueOperations={issueOperations}
                is_editable={is_editable}
              /> */}
            </div>
            <div className="h-full w-1/3 space-y-5 overflow-hidden border-l border-custom-border-300 py-5">
              {/* <InboxIssueDetailsSidebar
                workspaceSlug={workspaceSlug}
                projectId={projectId}
                issueId={issueId}
                issueOperations={issueOperations}
                is_editable={is_editable}
              /> */}
            </div>
          </div>
        </div>
      </div>
    </>
  );
});
