import { FC, useEffect, useState } from "react";
import { observer } from "mobx-react";
import useSWR from "swr";
// components
import { ContentWrapper } from "@plane/ui";
import { InboxIssueActionsHeader, InboxIssueMainContent } from "@/components/inbox";
// hooks
import { useProjectInbox, useUser, useUserPermissions } from "@/hooks/store";
import { useAppRouter } from "@/hooks/use-app-router";
import { EUserPermissions, EUserPermissionsLevel } from "@/plane-web/constants/user-permissions";

type TInboxContentRoot = {
  workspaceSlug: string;
  projectId: string;
  inboxIssueId: string;
  isMobileSidebar: boolean;
  setIsMobileSidebar: (value: boolean) => void;
  isNotificationEmbed?: boolean;
  embedRemoveCurrentNotification?: () => void;
};

export const InboxContentRoot: FC<TInboxContentRoot> = observer((props) => {
  const {
    workspaceSlug,
    projectId,
    inboxIssueId,
    isMobileSidebar,
    setIsMobileSidebar,
    isNotificationEmbed = false,
    embedRemoveCurrentNotification,
  } = props;
  /// router
  const router = useAppRouter();
  // states
  const [isSubmitting, setIsSubmitting] = useState<"submitting" | "submitted" | "saved">("saved");
  // hooks
  const { data: currentUser } = useUser();
  const { currentTab, fetchInboxIssueById, getIssueInboxByIssueId, getIsIssueAvailable } = useProjectInbox();
  const inboxIssue = getIssueInboxByIssueId(inboxIssueId);
  const { allowPermissions, projectPermissionsByWorkspaceSlugAndProjectId } = useUserPermissions();

  // derived values
  const isIssueAvailable = getIsIssueAvailable(inboxIssueId?.toString() || "");

  useEffect(() => {
    if (!isIssueAvailable && inboxIssueId && !isNotificationEmbed) {
      router.replace(`/${workspaceSlug}/projects/${projectId}/inbox?currentTab=${currentTab}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isIssueAvailable, isNotificationEmbed]);

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

  const isEditable =
    allowPermissions([EUserPermissions.ADMIN], EUserPermissionsLevel.PROJECT) ||
    inboxIssue.created_by === currentUser?.id;

  const isGuest = projectPermissionsByWorkspaceSlugAndProjectId(workspaceSlug, projectId) === EUserPermissions.GUEST;
  const isOwner = inboxIssue?.issue.created_by === currentUser?.id;
  const readOnly = !isOwner && isGuest;

  if (!inboxIssue) return <></>;

  const isIssueDisabled = [-1, 1, 2].includes(inboxIssue.status);

  return (
    <>
      <div className="w-full h-full overflow-hidden relative flex flex-col">
        <div className="flex-shrink-0 min-h-[52px] z-[11]">
          <InboxIssueActionsHeader
            setIsMobileSidebar={setIsMobileSidebar}
            isMobileSidebar={isMobileSidebar}
            workspaceSlug={workspaceSlug}
            projectId={projectId}
            inboxIssue={inboxIssue}
            isSubmitting={isSubmitting}
            isNotificationEmbed={isNotificationEmbed || false}
            embedRemoveCurrentNotification={embedRemoveCurrentNotification}
          />
        </div>
        <ContentWrapper className="space-y-5 divide-y-2 divide-custom-border-200">
          <InboxIssueMainContent
            workspaceSlug={workspaceSlug}
            projectId={projectId}
            inboxIssue={inboxIssue}
            isEditable={isEditable && !isIssueDisabled && !readOnly}
            isSubmitting={isSubmitting}
            setIsSubmitting={setIsSubmitting}
          />
        </ContentWrapper>
      </div>
    </>
  );
});
