"use client";

import { useCallback, useEffect } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import useSWR from "swr";
// components
import { LogoSpinner } from "@/components/common";
import { PageHead } from "@/components/core";
import { EmptyState } from "@/components/empty-state";
import { InboxContentRoot } from "@/components/inbox";
import { IssuePeekOverview } from "@/components/issues";
// constants
import { EmptyStateType } from "@/constants/empty-state";
import { ENotificationLoader, ENotificationQueryParamType } from "@/constants/notification";
// hooks
import { useIssueDetail, useUserPermissions, useWorkspace, useWorkspaceNotifications } from "@/hooks/store";
import { useWorkspaceIssueProperties } from "@/hooks/use-workspace-issue-properties";

const WorkspaceDashboardPage = observer(() => {
  const { workspaceSlug } = useParams();
  // hooks
  const { currentWorkspace } = useWorkspace();
  const {
    currentSelectedNotificationId,
    setCurrentSelectedNotificationId,
    notificationLiteByNotificationId,
    notificationIdsByWorkspaceId,
    getNotifications,
  } = useWorkspaceNotifications();
  const { fetchUserProjectInfo } = useUserPermissions();
  const { setPeekIssue } = useIssueDetail();
  // derived values
  const pageTitle = currentWorkspace?.name ? `${currentWorkspace?.name} - Inbox` : undefined;
  const { workspace_slug, project_id, issue_id, is_inbox_issue } =
    notificationLiteByNotificationId(currentSelectedNotificationId);

  // fetching workspace issue properties
  useWorkspaceIssueProperties(workspaceSlug);

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

  const embedRemoveCurrentNotification = useCallback(
    () => setCurrentSelectedNotificationId(undefined),
    [setCurrentSelectedNotificationId]
  );

  // clearing up the selected notifications when unmounting the page
  useEffect(
    () => () => {
      setCurrentSelectedNotificationId(undefined);
      setPeekIssue(undefined);
    },
    [setCurrentSelectedNotificationId, setPeekIssue]
  );

  return (
    <>
      <PageHead title={pageTitle} />
      <div className="w-full h-full overflow-hidden overflow-y-auto">
        {!currentSelectedNotificationId ? (
          <div className="w-full h-screen flex justify-center items-center">
            <EmptyState type={EmptyStateType.NOTIFICATION_DETAIL_EMPTY_STATE} layout="screen-simple" />
          </div>
        ) : (
          <>
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
                    embedRemoveCurrentNotification={embedRemoveCurrentNotification}
                  />
                )}
              </>
            ) : (
              <IssuePeekOverview embedIssue embedRemoveCurrentNotification={embedRemoveCurrentNotification} />
            )}
          </>
        )}
      </div>
    </>
  );
});

export default WorkspaceDashboardPage;
