/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
// plane imports
import { ENotificationLoader, ENotificationQueryParamType } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
// components
import { NotificationItem } from "@/components/workspace-notifications/sidebar/notification-card/item";
// hooks
import { useWorkspaceNotifications } from "@/hooks/store/notifications";

type TNotificationCardListRoot = {
  workspaceSlug: string;
  workspaceId: string;
};

export const NotificationCardListRoot = observer(function NotificationCardListRoot(props: TNotificationCardListRoot) {
  const { workspaceSlug, workspaceId } = props;
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
    <>
      {notificationIds.map((notificationId: string) => (
        <NotificationItem key={notificationId} workspaceSlug={workspaceSlug} notificationId={notificationId} />
      ))}

      {/* fetch next page notifications */}
      {paginationInfo && paginationInfo?.next_page_results && (
        <>
          {loader === ENotificationLoader.PAGINATION_LOADER ? (
            <div className="flex items-center justify-center py-4 text-body-xs-medium">
              <div className="text-accent-secondary">{t("loading")}...</div>
            </div>
          ) : (
            <div className="flex items-center justify-center py-4 text-body-xs-medium">
              <button
                type="button"
                className="cursor-pointer text-accent-secondary transition-colors hover:text-accent-primary"
                onClick={() => {
                  void getNextNotifications();
                }}
              >
                {t("load_more")}
              </button>
            </div>
          )}
        </>
      )}
    </>
  );
});
