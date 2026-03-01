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

// plane types
// helpers
import { API_BASE_URL } from "@plane/constants";
import type { TProjectUpdate } from "@/types";
// services
import { APIService } from "@/services/api.service";

export class ProjectUpdateService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }
  async createProjectUpdate(
    workspaceSlug: string,
    projectId: string,
    data: Partial<TProjectUpdate>
  ): Promise<TProjectUpdate> {
    return this.post(`/api/workspaces/${workspaceSlug}/projects/${projectId}/updates/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response;
      });
  }

  async updateProjectUpdate(
    workspaceSlug: string,
    projectId: string,
    updateId: string,
    data: Partial<TProjectUpdate>
  ): Promise<TProjectUpdate> {
    return this.patch(`/api/workspaces/${workspaceSlug}/projects/${projectId}/updates/${updateId}/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getProjectUpdates(workspaceSlug: string, projectId: string): Promise<TProjectUpdate[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/updates/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async deleteProjectUpdate(workspaceSlug: string, projectId: string, updateId: string): Promise<TProjectUpdate> {
    return this.delete(`/api/workspaces/${workspaceSlug}/projects/${projectId}/updates/${updateId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}
