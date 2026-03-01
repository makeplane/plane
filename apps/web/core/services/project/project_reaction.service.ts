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

import { API_BASE_URL } from "@plane/constants";
import type { TProjectReaction } from "@/types";
// services
import { APIService } from "@/services/api.service";

export class ProjectReactionService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async getProjectReactions(workspaceSlug: string, projectId: string): Promise<TProjectReaction[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/reactions/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async createProjectReaction(workspaceSlug: string, projectId: string, data: Partial<TProjectReaction>): Promise<any> {
    return this.post(`/api/workspaces/${workspaceSlug}/projects/${projectId}/reactions/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async deleteProjectReaction(workspaceSlug: string, projectId: string, reaction: string): Promise<any> {
    return this.delete(`/api/workspaces/${workspaceSlug}/projects/${projectId}/reactions/${reaction}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}
