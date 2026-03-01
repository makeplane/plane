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

import { WorkspaceNotificationService } from "@/services/workspace-notification.service";

export class InboxService extends WorkspaceNotificationService {
  async markBulkNotificationsAsRead(workspaceSlug: string, payload: { notification_ids: string[] }) {
    await this.post(`/api/workspaces/${workspaceSlug}/inbox/read/`, payload);
  }

  async markBulkNotificationsAsUnread(workspaceSlug: string, payload: { notification_ids: string[] }) {
    await this.delete(`/api/workspaces/${workspaceSlug}/inbox/read/`, payload);
  }

  async archiveNotificationList(workspaceSlug: string, payload: { notification_ids: string[] }) {
    await this.post(`/api/workspaces/${workspaceSlug}/inbox/archive/`, payload);
  }

  async unArchiveNotificationList(workspaceSlug: string, payload: { notification_ids: string[] }) {
    await this.delete(`/api/workspaces/${workspaceSlug}/inbox/archive/`, payload);
  }

  async updateNotficationList(
    workspaceSlug: string,
    payload: { notification_ids: string[]; snoozed_till: string | undefined }
  ) {
    await this.patch(`/api/workspaces/${workspaceSlug}/inbox/`, payload);
  }
}

const inboxService = new InboxService();
export default inboxService;
