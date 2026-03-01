/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import { observer } from "mobx-react";
import { MessageSquare } from "lucide-react";
// plane imports
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
// components
import { NotificationItemOptionButton } from "@/components/workspace-notifications/sidebar/notification-card/common/notification-item-option-button";
// hooks
import { useWorkspaceNotifications } from "@/hooks/store/notifications";
// store
import type { INotification } from "@/store/notifications/notification";

type TNotificationItemReadOption = {
  workspaceSlug: string;
  notificationList: INotification[];
  issueId: string;
  unreadCount: number;
};

export const NotificationItemReadOption = observer(function NotificationItemReadOption(
  props: TNotificationItemReadOption
) {
  const { workspaceSlug, notificationList, unreadCount } = props;

  const { markBulkNotificationsAsRead, markBulkNotificationsAsUnread } = useWorkspaceNotifications();

  const handleNotificationUpdate = async () => {
    try {
      const request = unreadCount === 0 ? markBulkNotificationsAsUnread : markBulkNotificationsAsRead;
      await request(notificationList, workspaceSlug);
      setToast({
        title: unreadCount === 0 ? "Notification(s) marked as unread" : "Notification(s) marked as read",
        type: TOAST_TYPE.SUCCESS,
      });
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <NotificationItemOptionButton
      tooltipContent={unreadCount === 0 ? "Mark as unread" : "Mark as read"}
      callBack={handleNotificationUpdate}
    >
      <MessageSquare className="h-3 w-3 text-tertiary" />
    </NotificationItemOptionButton>
  );
});
