/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { API_BASE_URL } from "@plane/constants";
import type {
  TPaginationInfo,
  TProjectIssueTimeTotals,
  TProjectTimeSettings,
  TStartTimerPayload,
  TStartTimerResponse,
  TStopTimerResponse,
  TTimeEntry,
  TTimeEntryBulkPayload,
  TTimeEntryCreatePayload,
  TTimeEntryFilters,
  TTimeEntryListParams,
  TTimeEntryUpdatePayload,
  TTimeReport,
  TTimeReportParams,
  TTimerResponse,
  TTimesheet,
  TTimeSummary,
  TUpdateTimerPayload,
  TWorkItemTime,
} from "@plane/types";
// services
import { APIService } from "@/services/api.service";

export type TTimeEntryListResponse = TPaginationInfo & { results: TTimeEntry[] };

type TQueryValue = string | number | boolean | string[] | null | undefined;

/**
 * Query params the time tracking API understands: arrays become comma-separated strings,
 * empty values are dropped.
 */
export const serializeTimeTrackingParams = (params: Record<string, TQueryValue>): Record<string, string> => {
  const query: Record<string, string> = {};
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    if (Array.isArray(value)) {
      if (value.length) query[key] = value.join(",");
      continue;
    }
    query[key] = String(value);
  }
  return query;
};

export class TimeTrackingService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  private url(workspaceSlug: string, path = "") {
    return `/api/workspaces/${workspaceSlug}/time-entries/${path}`;
  }

  private async unwrap<T>(promise: Promise<{ data: T }>): Promise<T> {
    return promise
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  // timer

  async getTimer(workspaceSlug: string): Promise<TTimerResponse> {
    return this.unwrap(this.get(this.url(workspaceSlug, "timer/")));
  }

  async startTimer(workspaceSlug: string, payload: TStartTimerPayload): Promise<TStartTimerResponse> {
    return this.unwrap(this.post(this.url(workspaceSlug, "timer/start/"), payload));
  }

  async stopTimer(workspaceSlug: string, description?: string): Promise<TStopTimerResponse> {
    return this.unwrap(
      this.post(this.url(workspaceSlug, "timer/stop/"), description === undefined ? {} : { description })
    );
  }

  async updateTimer(workspaceSlug: string, payload: TUpdateTimerPayload): Promise<{ timer: TTimeEntry }> {
    return this.unwrap(this.patch(this.url(workspaceSlug, "timer/"), payload));
  }

  async discardTimer(workspaceSlug: string): Promise<void> {
    return this.unwrap(this.delete(this.url(workspaceSlug, "timer/")));
  }

  // entries

  async listEntries(workspaceSlug: string, params: TTimeEntryListParams): Promise<TTimeEntryListResponse> {
    return this.unwrap(this.get(this.url(workspaceSlug), { params: serializeTimeTrackingParams(params) }));
  }

  async createEntry(workspaceSlug: string, payload: TTimeEntryCreatePayload): Promise<TTimeEntry> {
    return this.unwrap(this.post(this.url(workspaceSlug), payload));
  }

  async getEntry(workspaceSlug: string, entryId: string): Promise<TTimeEntry> {
    return this.unwrap(this.get(this.url(workspaceSlug, `${entryId}/`)));
  }

  async updateEntry(workspaceSlug: string, entryId: string, payload: TTimeEntryUpdatePayload): Promise<TTimeEntry> {
    return this.unwrap(this.patch(this.url(workspaceSlug, `${entryId}/`), payload));
  }

  async deleteEntry(workspaceSlug: string, entryId: string): Promise<void> {
    return this.unwrap(this.delete(this.url(workspaceSlug, `${entryId}/`)));
  }

  async bulk(workspaceSlug: string, payload: TTimeEntryBulkPayload): Promise<{ updated: number }> {
    return this.unwrap(this.post(this.url(workspaceSlug, "bulk/"), payload));
  }

  // aggregates

  async getSummary(workspaceSlug: string, filters: TTimeEntryFilters): Promise<TTimeSummary> {
    return this.unwrap(this.get(this.url(workspaceSlug, "summary/"), { params: serializeTimeTrackingParams(filters) }));
  }

  async getReport(
    workspaceSlug: string,
    filters: TTimeEntryFilters,
    reportParams: TTimeReportParams
  ): Promise<TTimeReport> {
    return this.unwrap(
      this.get(this.url(workspaceSlug, "report/"), {
        params: serializeTimeTrackingParams({ ...filters, ...reportParams }),
      })
    );
  }

  async getTimesheet(workspaceSlug: string, userId: string, weekStartDate: string): Promise<TTimesheet> {
    return this.unwrap(
      this.get(this.url(workspaceSlug, "timesheet/"), {
        params: { user_id: userId, week_start_date: weekStartDate },
      })
    );
  }

  /** Export is a plain download link; the session cookie authenticates it. */
  getExportUrl(workspaceSlug: string, format: "csv" | "xlsx", filters: TTimeEntryFilters): string {
    const query = new URLSearchParams(serializeTimeTrackingParams({ ...filters, format }));
    return `${this.baseURL}${this.url(workspaceSlug, "export/")}?${query.toString()}`;
  }

  // project and work item

  async getProjectIssueTotals(workspaceSlug: string, projectId: string): Promise<TProjectIssueTimeTotals> {
    return this.unwrap(this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/time-entries/issue-totals/`));
  }

  async getWorkItemTime(workspaceSlug: string, projectId: string, issueId: string): Promise<TWorkItemTime> {
    return this.unwrap(
      this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/issues/${issueId}/time-entries/`)
    );
  }

  async getProjectTimeSettings(workspaceSlug: string, projectId: string): Promise<TProjectTimeSettings> {
    return this.unwrap(this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/time-settings/`));
  }

  async updateProjectTimeSettings(
    workspaceSlug: string,
    projectId: string,
    payload: Partial<Pick<TProjectTimeSettings, "default_billable">>
  ): Promise<TProjectTimeSettings> {
    return this.unwrap(this.patch(`/api/workspaces/${workspaceSlug}/projects/${projectId}/time-settings/`, payload));
  }
}

export const timeTrackingService = new TimeTrackingService();
