/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { API_BASE_URL } from "@plane/constants";
import type { TDepartmentsResponse, TUsageUsersResponse } from "@plane/types";
import { APIService } from "../api.service";

export class UsageMonitorService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async fetchUsers(params?: Record<string, string>): Promise<TUsageUsersResponse> {
    return this.get("/api/instances/usage-monitor/users/", { params })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async fetchDepartments(params?: Record<string, string>): Promise<TDepartmentsResponse> {
    return this.get("/api/instances/usage-monitor/departments/", { params })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}
