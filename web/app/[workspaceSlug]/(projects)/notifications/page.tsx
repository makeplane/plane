"use client";

import { observer } from "mobx-react";
import useSWR from "swr";
// components
import { PageHead } from "@/components/core";
import { IssuePeekOverview } from "@/components/issues";
// constants
import { ENotificationLoader } from "@/constants/notification";
// hooks
import { useWorkspace, useWorkspaceNotification } from "@/hooks/store";

const WorkspaceDashboardPage = observer(() => {
  // hooks
  const { currentWorkspace } = useWorkspace();
  const { notificationIdsByWorkspaceId, getNotifications } = useWorkspaceNotification();
  // derived values
  const pageTitle = currentWorkspace?.name ? `${currentWorkspace?.name} - Notifications` : undefined;

  // fetch workspace notifications
  useSWR(
    currentWorkspace?.slug ? `WORKSPACE_NOTIFICATION` : null,
    currentWorkspace?.slug
      ? async () =>
          getNotifications(
            currentWorkspace?.slug,
            notificationIdsByWorkspaceId(currentWorkspace.id)
              ? ENotificationLoader.MUTATION_LOADER
              : ENotificationLoader.INIT_LOADER
          )
      : null
  );

  return (
    <>
      <PageHead title={pageTitle} />
      <div className="w-ful h-full overflow-hidden overflow-y-auto">
        <IssuePeekOverview />
      </div>
    </>
  );
});

export default WorkspaceDashboardPage;
