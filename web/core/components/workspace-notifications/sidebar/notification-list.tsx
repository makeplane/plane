"use client";

import { FC } from "react";
import { observer } from "mobx-react";
// components
import { NotificationItem } from "@/components/workspace-notifications";
// hooks
import { useWorkspaceNotification } from "@/hooks/store";

type TNotificationList = {
  workspaceSlug: string;
  workspaceId: string;
};

export const NotificationList: FC<TNotificationList> = observer((props) => {
  const { workspaceSlug, workspaceId } = props;
  // hooks
  const { notificationIdsByWorkspaceId } = useWorkspaceNotification();
  const notificationIds = notificationIdsByWorkspaceId(workspaceId);

  if (!workspaceSlug || !workspaceId || !notificationIds) return <></>;
  return (
    <div>
      {notificationIds.map((notificationId: string) => (
        <NotificationItem key={notificationId} workspaceSlug={workspaceSlug} notificationId={notificationId} />
      ))}
    </div>
  );
});
