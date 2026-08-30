/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// plane types
import { API_BASE_URL } from "@plane/constants";
import type { TTimeLog } from "@plane/types";
// services
import { APIService } from "@/services/api.service";

export class IssueTimeLogService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async getTimeLogs(workspaceSlug: string, projectId: string, issueId: string): Promise<TTimeLog[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/issues/${issueId}/time-logs/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async createTimeLog(
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    data: Partial<TTimeLog>
  ): Promise<TTimeLog> {
    return this.post(`/api/workspaces/${workspaceSlug}/projects/${projectId}/issues/${issueId}/time-logs/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async updateTimeLog(
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    timeLogId: string,
    data: Partial<TTimeLog>
  ): Promise<TTimeLog> {
    return this.patch(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/issues/${issueId}/time-logs/${timeLogId}/`,
      data
    )
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async deleteTimeLog(workspaceSlug: string, projectId: string, issueId: string, timeLogId: string): Promise<void> {
    return this.delete(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/issues/${issueId}/time-logs/${timeLogId}/`
    )
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}
