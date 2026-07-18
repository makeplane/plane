/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { API_BASE_URL } from "@plane/constants";
import type { TStateTransitionMap, TStateTransitionPayload } from "@plane/types";
import { APIService } from "@/services/api.service";

export class ProjectStateTransitionService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async getStateTransitions(workspaceSlug: string, projectId: string): Promise<TStateTransitionMap> {
    return this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/state-transitions/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async updateStateTransitions(
    workspaceSlug: string,
    projectId: string,
    data: TStateTransitionPayload
  ): Promise<TStateTransitionMap> {
    return this.put(`/api/workspaces/${workspaceSlug}/projects/${projectId}/state-transitions/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response;
      });
  }
}
