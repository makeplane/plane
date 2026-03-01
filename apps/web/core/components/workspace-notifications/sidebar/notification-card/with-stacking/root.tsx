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

import { useEffect } from "react";
import { observer } from "mobx-react";
// plane imports
import { ENotificationLoader, ENotificationQueryParamType } from "@plane/constants";
// hooks
import { useWorkspaceNotifications } from "@/hooks/store/notifications";
// components
import { NotificationItem } from "./item";

type TNotificationCardWithStackingListRoot = {
  workspaceSlug: string;
  workspaceId: string;
  onNotificationClick?: () => void;
};

export const NotificationCardWithStackingListRoot = observer(function NotificationCardWithStackingListRoot(
  props: TNotificationCardWithStackingListRoot
) {
  const { workspaceSlug, workspaceId, onNotificationClick } = props;
  // hooks
  const { loader, paginationInfo, getNotifications, getIssueIdsSortedByLatestNotification, setHighlightedActivityIds } =
    useWorkspaceNotifications();
  const notificationIssueIds = getIssueIdsSortedByLatestNotification(workspaceId);

  const getNextNotifications = async () => {
    try {
      await getNotifications(workspaceSlug, ENotificationLoader.PAGINATION_LOADER, ENotificationQueryParamType.NEXT);
    } catch (error) {
      console.error(error);
    }
  };

  // reset highlighted activity ids when notification list is updated
  useEffect(() => {
    setHighlightedActivityIds([]);
  }, [notificationIssueIds]);

  if (!workspaceSlug || !workspaceId || !notificationIssueIds) return <></>;
  return (
    <>
      {notificationIssueIds.map((issueId: string) => (
        <NotificationItem
          issueId={issueId}
          key={issueId}
          workspaceSlug={workspaceSlug}
          workspaceId={workspaceId}
          onNotificationClick={onNotificationClick}
        />
      ))}

      {/* fetch next page notifications */}
      {paginationInfo && paginationInfo?.next_page_results && (
        <>
          {loader === ENotificationLoader.PAGINATION_LOADER ? (
            <div className="py-4 flex justify-center items-center text-body-xs-medium">
              <div className="text-accent-primary">Loading</div>
            </div>
          ) : (
            <div className="py-4 flex justify-center items-center text-body-xs-medium" onClick={getNextNotifications}>
              <div className="text-accent-primary hover:text-accent-primary transition-all cursor-pointer">
                Load more
              </div>
            </div>
          )}
        </>
      )}
    </>
  );
});
