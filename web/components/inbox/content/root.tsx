import { FC } from "react";
import { observer } from "mobx-react";
import useSWR from "swr";
import { InboxIssueActionsHeader, InboxIssueMainContent } from "@/components/inbox";
import { EUserProjectRoles } from "@/constants/project";
import { useInboxIssues, useIssueDetail, useProjectInbox, useUser } from "@/hooks/store";

type TInboxContentRoot = {
  workspaceSlug: string;
  projectId: string;
  inboxIssueId: string;
};

export const InboxContentRoot: FC<TInboxContentRoot> = observer((props) => {
  const { workspaceSlug, projectId, inboxIssueId } = props;
  // hooks
  const { fetchInboxIssueById } = useProjectInbox();
  const inboxIssue = useInboxIssues(inboxIssueId);
  const {
    membership: { currentProjectRole },
  } = useUser();

  const { fetchReactions, fetchActivities, fetchComments } = useIssueDetail();

  useSWR(
    workspaceSlug && projectId && inboxIssueId
      ? `INBOX_ISSUE_DETAIL_${workspaceSlug}_${projectId}_inbox_${inboxIssueId}`
      : null,
    async () => {
      if (workspaceSlug && projectId && inboxIssueId) {
        await fetchInboxIssueById(workspaceSlug, projectId, inboxIssueId);
        await fetchReactions(workspaceSlug, projectId, inboxIssueId);
        await fetchActivities(workspaceSlug, projectId, inboxIssueId);
        await fetchComments(workspaceSlug, projectId, inboxIssueId);
      }
    }
  );

  const is_editable = !!currentProjectRole && currentProjectRole >= EUserProjectRoles.MEMBER;

  if (!inboxIssue) return <></>;
  return (
    <>
      <div className="w-full h-full overflow-hidden relative flex flex-col">
        <div className="flex-shrink-0 min-h-[50px] border-b border-custom-border-300">
          <InboxIssueActionsHeader workspaceSlug={workspaceSlug} projectId={projectId} inboxIssue={inboxIssue} />
        </div>
        <div className="h-full w-full space-y-5 divide-y-2 divide-custom-border-300 overflow-y-auto p-5 vertical-scrollbar scrollbar-md">
          <InboxIssueMainContent
            workspaceSlug={workspaceSlug}
            projectId={projectId}
            inboxIssue={inboxIssue}
            is_editable={is_editable}
          />
        </div>
      </div>
    </>
  );
});
