import { NotificationCardListRoot } from "./notification-card/root";

export type TNotificationListRoot = {
  workspaceSlug: string;
  workspaceId: string;
  onNotificationClick?: () => void;
};

export function NotificationListRoot(props: TNotificationListRoot) {
  return <NotificationCardListRoot {...props} />;
}
