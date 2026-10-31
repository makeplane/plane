/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { API_BASE_URL } from "@plane/constants";
import type { TDashboard, TDashboardParams } from "@plane/types";
// services
import { APIService } from "../api.service";

export class TeamDashboardService extends APIService {
  constructor(BASE_URL?: string) {
    super(BASE_URL || API_BASE_URL);
  }

  /** The management dashboard. Needs the right to see the team. */
  async getDashboard(workspaceSlug: string, params: TDashboardParams): Promise<TDashboard> {
    return this.get(`/api/workspaces/${workspaceSlug}/team-ops/dashboard/`, { params })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}
