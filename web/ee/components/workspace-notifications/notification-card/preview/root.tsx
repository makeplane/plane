"use client";

import { FC } from "react";
import orderBy from "lodash/orderBy";
import { TNotification, TNotificationIssueLite } from "@plane/types";
import { convertToEpoch } from "@/helpers/date-time.helper";
import { IssueTypeIdentifier } from "@/plane-web/components/issues";
import { NotificationPreviewActivity } from "@/plane-web/components/workspace-notifications";
export type TNotificationCardPreview = {
  notificationList: TNotification[];
  workspaceSlug: string;
  projectId: string;
  issueData: TNotificationIssueLite;
};
export const NotificationCardPreview: FC<TNotificationCardPreview> = (props) => {
  const { notificationList, workspaceSlug, projectId, issueData } = props;
  const unreadCount = notificationList.filter((e) => !e.read_at).length;

  if (!workspaceSlug) return;

  return (
    <div className="pt-4 border rounded-md shadow-xl border-custom-border-200 bg-custom-background-100">
      <div className="flex items-center justify-between gap-4 px-4">
        <div className="flex items-center gap-2">
          {issueData.type_id && <IssueTypeIdentifier issueTypeId={issueData.type_id} />}
          <p className="text-sm after:-100">
            {issueData.identifier}-{issueData.sequence_id}
          </p>
        </div>
        {unreadCount > 0 && (
          <span className="text-xs font-medium py-[2px] px-[7px] text-white bg-custom-primary-300 rounded-lg">
            {unreadCount} new update{unreadCount > 1 && "s"}
          </span>
        )}
      </div>
      <div className="my-3 px-4">
        <p className="font-medium truncate overflow-hidden">{issueData.name}</p>
      </div>
      <div className="max-h-60 overflow-y-scroll vertical-scrollbar scrollbar-sm px-4">
        {orderBy(notificationList, (n) => convertToEpoch(n.created_at), "desc")
          .filter((n) => !!n)
          .map((notification, index, { length }) => (
            <NotificationPreviewActivity
              workspaceSlug={workspaceSlug}
              notification={notification}
              projectId={projectId}
              key={notification.id}
              ends={length === 1 ? "single" : index === 0 ? "top" : index === length - 1 ? "bottom" : undefined}
            />
          ))}
      </div>
    </div>
  );
};
