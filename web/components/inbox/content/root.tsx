import { FC, useState } from "react";
import { observer } from "mobx-react";
import useSWR from "swr";
import { InboxIssueActionsHeader, InboxIssueMainContent } from "@/components/inbox";
import { EUserProjectRoles } from "@/constants/project";
import { useProjectInbox, useUser } from "@/hooks/store";

type TInboxContentRoot = {
  workspaceSlug: string;
  projectId: string;
  inboxIssueId: string;
  isMobileSidebar: boolean;
  setIsMobileSidebar: (value: boolean) => void;
};

export const InboxContentRoot: FC<TInboxContentRoot> = observer((props) => {
  const { workspaceSlug, projectId, inboxIssueId, isMobileSidebar, setIsMobileSidebar } = props;
  // states
  const [isSubmitting, setIsSubmitting] = useState<"submitting" | "submitted" | "saved">("saved");
  // hooks
  const { fetchInboxIssueById, getIssueInboxByIssueId } = useProjectInbox();
  const inboxIssue = getIssueInboxByIssueId(inboxIssueId);
  const {
    membership: { currentProjectRole },
  } = useUser();

  useSWR(
    workspaceSlug && projectId && inboxIssueId
      ? `PROJECT_INBOX_ISSUE_DETAIL_${workspaceSlug}_${projectId}_${inboxIssueId}`
      : null,
    workspaceSlug && projectId && inboxIssueId
      ? () => fetchInboxIssueById(workspaceSlug, projectId, inboxIssueId)
      : null,
    {
      revalidateOnFocus: false,
      revalidateIfStale: false,
    }
  );

  const isEditable = !!currentProjectRole && currentProjectRole >= EUserProjectRoles.MEMBER;

  if (!inboxIssue) return <></>;

  const isIssueDisabled = [-1, 1, 2].includes(inboxIssue.status);

  return (
    <>
      <div className="w-full h-full overflow-hidden relative flex flex-col">
        <div className="flex-shrink-0 min-h-[50px] border-b border-custom-border-300">
          <InboxIssueActionsHeader
            setIsMobileSidebar={setIsMobileSidebar}
            isMobileSidebar={isMobileSidebar}
            workspaceSlug={workspaceSlug}
            projectId={projectId}
            inboxIssue={inboxIssue}
            isSubmitting={isSubmitting}
          />
        </div>
        <div className="h-full w-full space-y-5 divide-y-2 divide-custom-border-200 overflow-y-auto px-6 py-5 vertical-scrollbar scrollbar-md">
          <InboxIssueMainContent
            workspaceSlug={workspaceSlug}
            projectId={projectId}
            inboxIssue={inboxIssue}
            isEditable={isEditable && !isIssueDisabled}
            isSubmitting={isSubmitting}
            setIsSubmitting={setIsSubmitting}
          />
        </div>
      </div>
    </>
  );
});
