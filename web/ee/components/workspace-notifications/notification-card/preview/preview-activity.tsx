"use client";

import { FC } from "react";
import { TNotification } from "@plane/types";
// helpers
import { NotificationContent } from "@/components/workspace-notifications";
import { cn } from "@/helpers/common.helper";
// components
import { IssueActivityBlock } from "@/plane-web/components/workspace-notifications";

export type TNotificationPreviewActivity = {
  notification: TNotification;
  ends: "top" | "bottom" | "single" | undefined;
  workspaceId: string;
  workspaceSlug: string;
  projectId: string;
};

export const NotificationPreviewActivity: FC<TNotificationPreviewActivity> = (props) => {
  const { notification, workspaceId, workspaceSlug, ends, projectId } = props;
  const notificationField = notification?.data?.issue_activity.field || undefined;
  // const notificationTriggeredBy = notification.triggered_by_details || undefined;
  const triggeredBy = notification.triggered_by_details;

  if (!workspaceSlug || !notification.id || !notification?.id || !notificationField) return <></>;

  return (
    <div className={cn("flex gap-2 items-center", ends === "bottom" ? "pb-4" : "")}>
      <IssueActivityBlock
        ends={ends}
        notificationField={notificationField}
        createdAt={notification?.created_at}
        triggeredBy={triggeredBy}
      >
        <div className="w-full whitespace-normal truncate text-sm">
          <NotificationContent
            notification={notification}
            workspaceId={workspaceId}
            workspaceSlug={workspaceSlug}
            projectId={projectId}
          />
        </div>
      </IssueActivityBlock>
    </div>
  );
};
