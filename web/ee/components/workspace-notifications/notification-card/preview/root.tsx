import { FC } from "react";
import { TNotification } from "@plane/types";
import { Row } from "@plane/ui";

export type TNotificationCardPreview = {
  notificationGroup: TNotification[];
};
export const NotificationCardPreview: FC<TNotificationCardPreview> = (props) => {
  const { notificationGroup } = props;
  const issue = notificationGroup[0].data?.issue;
  const unreadCount = notificationGroup.filter((e) => !e.read_at).length;

  if (!issue) return;
  return (
    <div className="p-3 border rounded-md shadow-md border-custom-border-100">
      <div className="flex justify-between gap-4">
        <p className="text-sm after:-100">
          {issue.identifier}-{issue.sequence_id}
        </p>
        {unreadCount > 0 && (
          <span className="text-xs first-letter:font-medium py-1 px-2 text-white bg-custom-primary-300 rounded-lg">
            {unreadCount} new updates
          </span>
        )}
      </div>
      <p className="text-sm font-medium">{issue.name}</p>
      <div>{/* Lastest notifications */}</div>
    </div>
  );
};
