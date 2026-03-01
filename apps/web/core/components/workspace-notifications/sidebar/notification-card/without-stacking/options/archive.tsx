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
import { ArchiveRestore } from "lucide-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { ArchiveIcon } from "@plane/propel/icons";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
// store
import type { INotification } from "@/store/notifications/notification";
// local imports
import { NotificationItemOptionButton } from "@/components/workspace-notifications/sidebar/notification-card/common/notification-item-option-button";

type TNotificationItemArchiveOption = {
  workspaceSlug: string;
  notification: INotification;
};

export const NotificationItemArchiveOption = observer(function NotificationItemArchiveOption(
  props: TNotificationItemArchiveOption
) {
  const { workspaceSlug, notification } = props;
  // hooks
  const { asJson: data, archiveNotification, unArchiveNotification } = notification;
  const { t } = useTranslation();

  const handleNotificationUpdate = async () => {
    try {
      const request = data.archived_at ? unArchiveNotification : archiveNotification;
      await request(workspaceSlug);
      setToast({
        title: data.archived_at ? t("notification.toasts.unarchived") : t("notification.toasts.archived"),
        type: TOAST_TYPE.SUCCESS,
      });
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <NotificationItemOptionButton
      tooltipContent={
        data.archived_at ? t("notification.options.mark_unarchive") : t("notification.options.mark_archive")
      }
      callBack={handleNotificationUpdate}
    >
      {data.archived_at ? (
        <ArchiveRestore className="h-3 w-3 text-tertiary" />
      ) : (
        <ArchiveIcon className="h-3 w-3 text-tertiary" />
      )}
    </NotificationItemOptionButton>
  );
});
