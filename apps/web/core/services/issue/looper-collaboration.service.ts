/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { API_BASE_URL } from "@plane/constants";
import type { TLooperSummary } from "@/components/issues/issue-detail/looper-collaboration/types";
import { APIService } from "@/services/api.service";

export class LooperCollaborationService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async getSummary(workspaceSlug: string, projectId: string, issueId: string): Promise<TLooperSummary> {
    return this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/issues/${issueId}/looper/`)
      .then((response) => response.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}
