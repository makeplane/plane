/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { API_BASE_URL } from "@plane/constants";
import { APIService } from "@/services/api.service";

export class ProjectDataEmailService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async sendCustomFieldDataEmail(
    workspaceSlug: string,
    projectId: string,
    recipientIds: string[]
  ): Promise<{ queued: number }> {
    return this.post(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/custom-fields/send-data-email/`,
      { recipient_ids: recipientIds }
    )
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}
