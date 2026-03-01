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
// plane imports
import { ENotificationLoader, ENotificationQueryParamType } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
// hooks
import { useWorkspaceNotifications } from "@/hooks/store/notifications";
// local imports
import { NotificationItem } from "./item";

type TNotificationCardWithoutStackingListRoot = {
  workspaceSlug: string;
  workspaceId: string;
  onNotificationClick?: () => void;
};

export const NotificationCardWithoutStackingListRoot = observer(function NotificationCardWithoutStackingListRoot(
  props: TNotificationCardWithoutStackingListRoot
) {
  const { workspaceSlug, workspaceId, onNotificationClick } = props;
  // hooks
  const { loader, paginationInfo, getNotifications, notificationIdsByWorkspaceId } = useWorkspaceNotifications();
  const notificationIds = notificationIdsByWorkspaceId(workspaceId);
  const { t } = useTranslation();

  const getNextNotifications = async () => {
    try {
      await getNotifications(workspaceSlug, ENotificationLoader.PAGINATION_LOADER, ENotificationQueryParamType.NEXT);
    } catch (error) {
      console.error(error);
    }
  };

  if (!workspaceSlug || !workspaceId || !notificationIds) return <></>;
  return (
    <div>
      {notificationIds.map((notificationId: string) => (
        <NotificationItem
          key={notificationId}
          workspaceSlug={workspaceSlug}
          notificationId={notificationId}
          onNotificationClick={onNotificationClick}
        />
      ))}

      {/* fetch next page notifications */}
      {paginationInfo && paginationInfo?.next_page_results && (
        <>
          {loader === ENotificationLoader.PAGINATION_LOADER ? (
            <div className="py-4 flex justify-center items-center text-13 font-medium">
              <div className="text-accent-secondary">{t("loading")}...</div>
            </div>
          ) : (
            <div className="py-4 flex justify-center items-center text-13 font-medium" onClick={getNextNotifications}>
              <div className="text-accent-secondary hover:text-accent-primary transition-all cursor-pointer">
                {t("load_more")}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
});
