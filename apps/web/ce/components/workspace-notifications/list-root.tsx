import { NotificationCardListRoot } from "./notification-card/root";

export type TNotificationListRoot = {
  workspaceSlug: string;
  workspaceId: string;
};

export const NotificationListRoot = (props: TNotificationListRoot) => <NotificationCardListRoot {...props} />;
