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
import { useTranslation } from "@plane/i18n";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
// store
import type { INotification } from "@/store/notifications/notification";
// local imports
import { NotificationItemOptionButton } from "@/components/workspace-notifications/sidebar/notification-card/common/notification-item-option-button";

type TNotificationItemReadOption = {
  workspaceSlug: string;
  notification: INotification;
};

export const NotificationItemReadOption = observer(function NotificationItemReadOption(
  props: TNotificationItemReadOption
) {
  const { workspaceSlug, notification } = props;
  // hooks
  const { asJson: data, markNotificationAsRead, markNotificationAsUnRead } = notification;
  const { t } = useTranslation();

  const handleNotificationUpdate = async () => {
    try {
      const request = data.read_at ? markNotificationAsUnRead : markNotificationAsRead;
      await request(workspaceSlug);
      setToast({
        title: data.read_at ? t("notification.toasts.unread") : t("notification.toasts.read"),
        type: TOAST_TYPE.SUCCESS,
      });
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <NotificationItemOptionButton
      tooltipContent={data.read_at ? t("notification.options.mark_unread") : t("notification.options.mark_read")}
      callBack={handleNotificationUpdate}
    >
      <MessageSquare className="h-3 w-3 text-tertiary" />
    </NotificationItemOptionButton>
  );
});
