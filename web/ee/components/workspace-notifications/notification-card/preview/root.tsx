import { FC } from "react";
import orderBy from "lodash/orderBy";
import { TNotification } from "@plane/types";
import { convertToEpoch } from "@/helpers/date-time.helper";
import { NotificationPreviewActivity } from "@/plane-web/components/workspace-notifications";
export type TNotificationCardPreview = {
  notificationGroup: TNotification[];
  workspaceSlug: string;
  projectId: string;
};
export const NotificationCardPreview: FC<TNotificationCardPreview> = (props) => {
  const { notificationGroup, workspaceSlug } = props;
  const issue = notificationGroup[0].data?.issue;
  const unreadCount = notificationGroup.filter((e) => !e.read_at).length;

  if (!issue || !issue.id || !workspaceSlug) return;

  return (
    <div className="pt-3 px-3 border rounded-md shadow-md border-custom-border-100 bg-white">
      <div className="flex justify-between gap-4">
        <p className="text-sm after:-100">
          {issue.identifier}-{issue.sequence_id}
        </p>
        {unreadCount > 0 && (
          <span className="text-xs font-bold py-1 px-2 text-white bg-custom-primary-300 rounded-lg">
            {unreadCount} new update{unreadCount > 1 && "s"}
          </span>
        )}
      </div>
      <p className="font-medium mt-2 mb-8">{issue.name}</p>
      <div className="max-h-60 overflow-y-scroll vertical-scrollbar scrollbar-sm">
        {orderBy(notificationGroup, (n) => convertToEpoch(n.created_at), "desc")
          .filter((n) => !n.read_at)
          .filter((n) => !!n)
          .map((notification, index, { length }) => (
            <NotificationPreviewActivity
              workspaceSlug={workspaceSlug}
              notification={notification}
              key={notification.id}
              ends={length === 1 ? undefined : index === 0 ? "top" : index === length - 1 ? "bottom" : undefined}
            />
          ))}
      </div>
    </div>
  );
};
