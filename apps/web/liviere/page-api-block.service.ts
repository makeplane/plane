/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// Liviere/plane fork: "Block API changes" for a project page (apps/api/plane/liviere/app).

import { API_BASE_URL } from "@plane/constants";
import { APIService } from "@/services/api.service";

export class PageApiBlockService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async setBlocked(workspaceSlug: string, projectId: string, pageId: string, blocked: boolean): Promise<void> {
    const url = `/api/workspaces/${workspaceSlug}/projects/${projectId}/pages/${pageId}/liviere/api-block/`;
    return (blocked ? this.post(url) : this.delete(url))
      .then(() => undefined)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}
