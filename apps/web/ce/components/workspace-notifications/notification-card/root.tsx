import type { FC } from "react";
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
    <div>
      {notificationIds.map((notificationId: string) => (
        <NotificationItem key={notificationId} workspaceSlug={workspaceSlug} notificationId={notificationId} />
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
