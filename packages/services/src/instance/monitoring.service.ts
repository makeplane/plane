/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { API_BASE_URL } from "@plane/constants";
import { APIService } from "../api.service";

export class MonitoringService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async fetchEmailLogs(params?: Record<string, string>): Promise<unknown> {
    try {
      const response = await this.get("/api/instances/monitoring/email-logs/", { params });
      return response?.data as unknown;
    } catch (error) {
      throw (error as { response?: { data?: unknown } })?.response?.data;
    }
  }

  async fetchScheduledJobs(): Promise<unknown> {
    try {
      const response = await this.get("/api/instances/monitoring/scheduled-jobs/");
      return response?.data as unknown;
    } catch (error) {
      throw (error as { response?: { data?: unknown } })?.response?.data;
    }
  }

  async fetchWorkerHealth(): Promise<unknown> {
    try {
      const response = await this.get("/api/instances/monitoring/worker-health/");
      return response?.data as unknown;
    } catch (error) {
      throw (error as { response?: { data?: unknown } })?.response?.data;
    }
  }
}
