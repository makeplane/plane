"use client";

import { observer } from "mobx-react";
import useSWR from "swr";
// components
import { LogoSpinner } from "@/components/common";
import { PageHead } from "@/components/core";
import { InboxContentRoot } from "@/components/inbox";
import { IssuePeekOverview } from "@/components/issues";
// constants
import { ENotificationLoader, ENotificationQueryParamType } from "@/constants/notification";
// hooks
import { useUser, useWorkspace, useWorkspaceNotifications } from "@/hooks/store";

const WorkspaceDashboardPage = observer(() => {
  // hooks
  const { currentWorkspace } = useWorkspace();
  const { currentSelectedNotification, notificationIdsByWorkspaceId, getNotifications } = useWorkspaceNotifications();
  const {
    membership: { fetchUserProjectInfo },
  } = useUser();
  // derived values
  const pageTitle = currentWorkspace?.name ? `${currentWorkspace?.name} - Notifications` : undefined;
  const { workspace_slug, project_id, issue_id, is_inbox_issue } = currentSelectedNotification;

  // fetch workspace notifications
  const notificationMutation =
    currentWorkspace && notificationIdsByWorkspaceId(currentWorkspace.id)
      ? ENotificationLoader.MUTATION_LOADER
      : ENotificationLoader.INIT_LOADER;
  const notificationLoader =
    currentWorkspace && notificationIdsByWorkspaceId(currentWorkspace.id)
      ? ENotificationQueryParamType.CURRENT
      : ENotificationQueryParamType.INIT;
  useSWR(
    currentWorkspace?.slug ? `WORKSPACE_NOTIFICATION` : null,
    currentWorkspace?.slug
      ? () => getNotifications(currentWorkspace?.slug, notificationMutation, notificationLoader)
      : null
  );

  // fetching user project member info
  const { isLoading: projectMemberInfoLoader } = useSWR(
    workspace_slug && project_id && is_inbox_issue
      ? `PROJECT_MEMBER_PERMISSION_INFO_${workspace_slug}_${project_id}`
      : null,
    workspace_slug && project_id && is_inbox_issue ? () => fetchUserProjectInfo(workspace_slug, project_id) : null
  );

  return (
    <>
      <PageHead title={pageTitle} />
      <div className="w-full h-full overflow-hidden overflow-y-auto">
        {is_inbox_issue === true && workspace_slug && project_id && issue_id ? (
          <>
            {projectMemberInfoLoader ? (
              <div className="w-full h-full flex justify-center items-center">
                <LogoSpinner />
              </div>
            ) : (
              <InboxContentRoot
                setIsMobileSidebar={() => {}}
                isMobileSidebar={false}
                workspaceSlug={workspace_slug}
                projectId={project_id}
                inboxIssueId={issue_id}
                isNotificationEmbed
              />
            )}
          </>
        ) : (
          <IssuePeekOverview embedIssue />
        )}
      </div>
    </>
  );
});

export default WorkspaceDashboardPage;
