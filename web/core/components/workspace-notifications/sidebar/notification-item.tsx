"use client";

import { FC } from "react";
import { observer } from "mobx-react";
// components
import { NotificationOption } from "@/components/workspace-notifications";
// hooks
import { useNotification } from "@/hooks/store";

type TNotificationItem = {
  workspaceSlug: string;
  notificationId: string;
};

export const NotificationItem: FC<TNotificationItem> = observer((props) => {
  const { workspaceSlug, notificationId } = props;
  // hooks
  const { asJson: notification } = useNotification(notificationId);

  if (!workspaceSlug || !notificationId || !notification?.id) return <></>;
  return (
    <div className="relative p-3 py-4 flex items-center gap-2 border-b border-custom-border-200 cursor-pointer transition-all hover:bg-custom-background-80/50 group">
      <div className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-custom-primary-100" />
      <div className="relative w-full flex gap-2">
        <div className="flex-shrink-0 relative flex justify-center items-center w-12 h-12 bg-custom-background-80 rounded-full">
          <div className="text-xl font-medium">S</div>
        </div>
        <div className="w-full space-y-1">
          <div className="relative flex items-center gap-3 h-8">
            <div className="w-full overflow-hidden whitespace-normal break-words truncate line-clamp-1 text-base text-custom-text-100">
              {notification?.id}
            </div>
            <div className="flex-shrink-0 hidden group-hover:block text-sm">
              <NotificationOption notificationId={notification?.id} />
            </div>
          </div>
          <div className="relative flex items-center gap-3 text-xs text-custom-text-200">
            <div className="w-full overflow-hidden whitespace-normal break-words truncate line-clamp-1">
              {notification?.data?.issue?.identifier}-{notification?.data?.issue?.sequence_id}&nbsp;
              {notification?.data?.issue?.name}
            </div>
            <div className="flex-shrink-0">Issue created_at</div>
          </div>
        </div>
      </div>
    </div>
  );
});
