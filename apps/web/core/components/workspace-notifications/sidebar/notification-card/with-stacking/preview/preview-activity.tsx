/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import type { FC } from "react";
// plane imports
import type { TNotification } from "@plane/types";
import { cn } from "@plane/utils";
// components
import { NotificationContent } from "@/components/workspace-notifications/sidebar/notification-card/common/content";
// local imports
import { IssueActivityBlock } from "./acitvity-block";

export type TNotificationPreviewActivity = {
  notification: TNotification;
  ends: "top" | "bottom" | "single" | undefined;
  workspaceId: string;
  workspaceSlug: string;
  projectId: string;
};

export function NotificationPreviewActivity(props: TNotificationPreviewActivity) {
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
        <div className="w-full whitespace-normal truncate text-body-xs-medium">
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
}
