"use client";

import { FC, useEffect } from "react";
import { observer } from "mobx-react";
// plane imports
import { ENotificationLoader, ENotificationQueryParamType } from "@plane/constants";
// hooks
import { useWorkspaceNotifications } from "@/hooks/store/notifications";
// components
import { NotificationItem } from "./item";

type TNotificationCardListRoot = {
  workspaceSlug: string;
  workspaceId: string;
};

export const NotificationCardListRoot: FC<TNotificationCardListRoot> = observer((props) => {
  const { workspaceSlug, workspaceId } = props;
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
        <NotificationItem issueId={issueId} key={issueId} workspaceSlug={workspaceSlug} workspaceId={workspaceId} />
      ))}

      {/* fetch next page notifications */}
      {paginationInfo && paginationInfo?.next_page_results && (
        <>
          {loader === ENotificationLoader.PAGINATION_LOADER ? (
            <div className="py-4 flex justify-center items-center text-sm font-medium">
              <div className="text-custom-primary-90">Loading...</div>
            </div>
          ) : (
            <div className="py-4 flex justify-center items-center text-sm font-medium" onClick={getNextNotifications}>
              <div className="text-custom-primary-90 hover:text-custom-primary-100 transition-all cursor-pointer">
                Load more
              </div>
            </div>
          )}
        </>
      )}
    </>
  );
});
