/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// plane types
import { API_BASE_URL } from "@plane/constants";
import type { TTimeLogAnalytics, TTimeLogFilters, TWorkspaceTimeLog } from "@plane/types";
// services
import { APIService } from "@/services/api.service";

/** Strip empty filter values so we never send `?user_id=` with no value. */
const toParams = (filters: TTimeLogFilters) =>
  Object.fromEntries(Object.entries(filters).filter(([, value]) => !!value));

export class WorkspaceTimeLogService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async getWorkspaceTimeLogs(workspaceSlug: string, filters: TTimeLogFilters = {}): Promise<TWorkspaceTimeLog[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/time-logs/`, { params: toParams(filters) })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getWorkspaceTimeLogAnalytics(workspaceSlug: string, filters: TTimeLogFilters = {}): Promise<TTimeLogAnalytics> {
    return this.get(`/api/workspaces/${workspaceSlug}/time-logs/analytics/`, { params: toParams(filters) })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /** Downloads the filtered worklogs as a CSV file in the browser. */
  async exportWorkspaceTimeLogs(workspaceSlug: string, filters: TTimeLogFilters = {}): Promise<void> {
    return this.get(`/api/workspaces/${workspaceSlug}/time-logs/export/`, {
      params: toParams(filters),
      responseType: "blob",
    })
      .then((response) => {
        const url = window.URL.createObjectURL(new Blob([response.data], { type: "text/csv" }));
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", "worklogs.csv");
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
        return undefined;
      })
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}
