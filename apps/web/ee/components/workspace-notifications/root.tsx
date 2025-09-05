import { observer } from "mobx-react";
import { WithFeatureFlagHOC } from "@/plane-web/components/feature-flags";
import { NotificationCardListRoot as NotificationCardListRootCe } from "ce/components/workspace-notifications/notification-card/root";
import { TNotificationListRoot } from "ce/components/workspace-notifications/root";
import { NotificationCardListRoot as NotificationCardListRootEe } from "./notification-card/root";

export const NotificationListRoot = observer((props: TNotificationListRoot) => {
  const { workspaceSlug, workspaceId } = props;
  return (
    <WithFeatureFlagHOC
      workspaceSlug={workspaceSlug.toString()}
      flag="INBOX_STACKING"
      fallback={<NotificationCardListRootCe workspaceSlug={workspaceSlug.toString()} workspaceId={workspaceId} />}
    >
      <NotificationCardListRootEe workspaceSlug={workspaceSlug.toString()} workspaceId={workspaceId} />
    </WithFeatureFlagHOC>
  );
});
