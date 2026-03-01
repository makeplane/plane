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

// services
import { API_BASE_URL } from "@plane/constants";
import type { ICycle } from "@plane/types";
// helpers
// services
import { APIService } from "@/services/api.service";

export class TeamspaceCycleService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  /**
   * Fetches all cycles for a teamspace
   * @param workspaceSlug
   * @param teamspaceId
   * @returns Promise<ICycle[]>
   */
  async getTeamspaceCycles(workspaceSlug: string, teamspaceId: string): Promise<ICycle[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/teamspaces/${teamspaceId}/cycles/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response;
      });
  }
}
