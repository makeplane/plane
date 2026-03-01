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
import type { TProjectMemberActivity } from "@/components/projects/settings/members/sidebar/activity/helper";
import { APIService } from "@/services/api.service";

export class ProjectMembersActivityService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  /**
   * Get project members activity
   * @param workspaceSlug
   * @param projectId
   * @param params
   */
  async getProjectMembersActivity(
    workspaceSlug: string,
    projectId: string,
    params: { created_at__gt?: string } & Record<string, unknown> = {}
  ): Promise<TProjectMemberActivity[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/project-members/history/`, {
      params,
    })
      .then((response) => response?.data as TProjectMemberActivity[])
      .catch((error: { response?: { data?: unknown } }) => {
        throw error?.response?.data;
      });
  }
}
