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
import type { IBaseLabel } from "@plane/types";
// services
import { APIService } from "@/services/api.service";

export class WorkspaceProjectLabelService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async getWorkspaceProjectLabels(workspaceSlug: string): Promise<IBaseLabel[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/project-labels/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async createWorkspaceProjectLabel(workspaceSlug: string, data: any): Promise<IBaseLabel> {
    return this.post(`/api/workspaces/${workspaceSlug}/project-labels/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async updateWorkspaceProjectLabel(workspaceSlug: string, labelId: string, data: any): Promise<IBaseLabel> {
    return this.patch(`/api/workspaces/${workspaceSlug}/project-labels/${labelId}/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async deleteWorkspaceProjectLabel(workspaceSlug: string, labelId: string): Promise<any> {
    return this.delete(`/api/workspaces/${workspaceSlug}/project-labels/${labelId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}
