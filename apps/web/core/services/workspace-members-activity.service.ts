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
// plane web imports
import type { TWorkspaceMemberActivity } from "@/components/workspace/settings/members/sidebar/activity/helper";
import { APIService } from "@/services/api.service";

export class WorkspaceMembersActivityService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  /**
   * Get workspace members activity
   * @param workspaceSlug
   * @param params
   */
  async getWorkspaceMembersActivity(
    workspaceSlug: string,
    params: { created_at__gt?: string } & Record<string, unknown> = {}
  ): Promise<TWorkspaceMemberActivity[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/members/history/`, {
      params,
    })
      .then((response) => response?.data as TWorkspaceMemberActivity[])
      .catch((error: { response?: { data?: unknown } }) => {
        throw error?.response?.data;
      });
  }
}
