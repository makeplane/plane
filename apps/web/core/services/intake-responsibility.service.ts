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
// services
import { APIService } from "@/services/api.service";

export class IntakeResponsibilityService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async getIntakeAssignees(workspaceSlug: string, projectId: string): Promise<string[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/intake-responsibilities/`)
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async updateIntakeAssignees(
    workspaceSlug: string,
    projectId: string,
    data: { users: string[] }
  ): Promise<{ users: string[] }> {
    return this.post(`/api/workspaces/${workspaceSlug}/projects/${projectId}/intake-responsibilities/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}
