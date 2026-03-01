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
import { orderBy } from "lodash-es";
import type { TNotification, TNotificationIssueLite } from "@plane/types";
import { convertToEpoch } from "@plane/utils";
import { IssueIdentifier } from "@/components/issues/issue-detail/issue-identifier";
import { NotificationPreviewActivity } from "./preview-activity";

export type TNotificationCardPreview = {
  notificationList: TNotification[];
  workspaceId: string;
  workspaceSlug: string;
  projectId: string;
  issueData: TNotificationIssueLite;
};

export function NotificationCardPreview(props: TNotificationCardPreview) {
  const { notificationList, workspaceId, workspaceSlug, projectId, issueData } = props;
  const unreadCount = notificationList.filter((e) => !e.read_at).length;

  if (!workspaceSlug) return;

  return (
    <div className="pt-4 border rounded-md shadow-raised-300 border-subtle bg-surface-1">
      <div className="flex items-center justify-between gap-4 px-4">
        {issueData.identifier && issueData.sequence_id && (
          <IssueIdentifier
            issueSequenceId={issueData.sequence_id}
            projectIdentifier={issueData.identifier}
            projectId={projectId}
            issueTypeId={issueData.type_id}
            size="xs"
          />
        )}
        {unreadCount > 0 && (
          <span className="text-caption-sm-medium py-[2px] px-[7px] text-on-color bg-accent-primary rounded-lg">
            {unreadCount} new update{unreadCount > 1 && "s"}
          </span>
        )}
      </div>
      <div className="my-3 px-4">
        <p className="text-body-sm-medium truncate overflow-hidden">{issueData.name}</p>
      </div>
      <div className="max-h-60 overflow-y-scroll vertical-scrollbar scrollbar-sm px-4">
        {orderBy(notificationList, (n) => convertToEpoch(n.created_at), "desc")
          .filter((n) => !!n)
          .map((notification, index, { length }) => (
            <NotificationPreviewActivity
              workspaceId={workspaceId}
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
}
