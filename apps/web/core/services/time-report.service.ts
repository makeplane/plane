/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// plane imports
import { API_BASE_URL } from "@plane/constants";
// services
import { APIService } from "./api.service";

export type TTimeReportEntry = {
  user_id: string | null;
  issue_id: string;
  project_id: string;
  date: string;
  duration_seconds: number;
};

export type TTimeReportIssue = {
  name: string;
  sequence_id: number;
  project_id: string;
  project_identifier: string;
};

export type TTimeReportUser = {
  display_name: string;
  first_name: string;
  last_name: string;
  avatar_url: string | null;
};

export type TTimeReportResponse = {
  start_date: string;
  end_date: string;
  can_view_others: boolean;
  entries: TTimeReportEntry[];
  issues: Record<string, TTimeReportIssue>;
  users: Record<string, TTimeReportUser>;
};

export type TTimeReportParams = {
  start_date: string;
  end_date: string;
  project_ids?: string;
  user_ids?: string;
};

export class TimeReportService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async getWorkspaceTimeReport(workspaceSlug: string, params: TTimeReportParams): Promise<TTimeReportResponse> {
    return this.get(`/api/workspaces/${workspaceSlug}/time-logs-report/`, { params })
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async getProjectTimeReport(
    workspaceSlug: string,
    projectId: string,
    params: TTimeReportParams
  ): Promise<TTimeReportResponse> {
    return this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/time-logs-report/`, { params })
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }
}

export const timeReportService = new TimeReportService();
