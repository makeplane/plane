"use client";

import { FC } from "react";
import { observer } from "mobx-react";
// components
// constants
import { ENotificationLoader, ENotificationQueryParamType } from "@/constants/notification";
// hooks
import { useWorkspaceNotifications } from "@/hooks/store";
import { NotificationItem } from "@/plane-web/components/workspace-notifications";

type TNotificationCardListRoot = {
  workspaceSlug: string;
  workspaceId: string;
};

export const NotificationCardListRoot: FC<TNotificationCardListRoot> = observer((props) => {
  const { workspaceSlug, workspaceId } = props;
  // hooks
  const { loader, paginationInfo, getNotifications, notificationIssueIdsByWorkspaceId } = useWorkspaceNotifications();
  const notificationIssueIds = notificationIssueIdsByWorkspaceId(workspaceId);

  const getNextNotifications = async () => {
    try {
      await getNotifications(workspaceSlug, ENotificationLoader.PAGINATION_LOADER, ENotificationQueryParamType.NEXT);
    } catch (error) {
      console.error(error);
    }
  };

  if (!workspaceSlug || !workspaceId || !notificationIssueIds) return <></>;
  return (
    <>
      {notificationIssueIds.map((issueId: string) => (
        // <NotificationItem key={notificationId} workspaceSlug={workspaceSlug} notificationId={notificationId} />
        <NotificationItem issueId={issueId} key={issueId} />
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
