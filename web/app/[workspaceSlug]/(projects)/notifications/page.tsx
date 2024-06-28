"use client";

import { observer } from "mobx-react";
import useSWR from "swr";
// components
import { PageHead } from "@/components/core";
import { IssuePeekOverview } from "@/components/issues";
// constants
import { ENotificationLoader, ENotificationQueryParamType } from "@/constants/notification";
// hooks
import { useWorkspace, useWorkspaceNotifications } from "@/hooks/store";

const WorkspaceDashboardPage = observer(() => {
  // hooks
  const { currentWorkspace } = useWorkspace();
  const { notificationIdsByWorkspaceId, getNotifications } = useWorkspaceNotifications();
  // derived values
  const pageTitle = currentWorkspace?.name ? `${currentWorkspace?.name} - Notifications` : undefined;

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
      ? async () => getNotifications(currentWorkspace?.slug, notificationMutation, notificationLoader)
      : null
  );

  return (
    <>
      <PageHead title={pageTitle} />
      <div className="w-ful h-full overflow-hidden overflow-y-auto">
        <IssuePeekOverview embedIssue />
      </div>
    </>
  );
});

export default WorkspaceDashboardPage;
