/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { API_BASE_URL } from "@plane/constants";
import type { TIssueWorkLog, TIssueWorkLogSummary } from "@plane/types";
import { APIService } from "@/services/api.service";

export class IssueWorkLogService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  // ── Worklog list / CRUD ─────────────────────────────────────────────

  async getWorklogs(workspaceSlug: string, projectId: string, issueId: string): Promise<TIssueWorkLog[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/issues/${issueId}/worklogs/`)
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async createWorklog(
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    data: Partial<TIssueWorkLog>
  ): Promise<TIssueWorkLog> {
    return this.post(`/api/workspaces/${workspaceSlug}/projects/${projectId}/issues/${issueId}/worklogs/`, data)
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async updateWorklog(
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    worklogId: string,
    data: Partial<TIssueWorkLog>
  ): Promise<TIssueWorkLog> {
    return this.patch(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/issues/${issueId}/worklogs/${worklogId}/`,
      data
    )
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async deleteWorklog(workspaceSlug: string, projectId: string, issueId: string, worklogId: string): Promise<void> {
    return this.delete(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/issues/${issueId}/worklogs/${worklogId}/`
    )
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  // ── Timer ────────────────────────────────────────────────────────────

  async getActiveTimer(workspaceSlug: string, projectId: string, issueId: string): Promise<TIssueWorkLog | null> {
    return this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/issues/${issueId}/timer/`)
      .then((res) => res?.data ?? null)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  // The caller's single running timer anywhere in the workspace (or null) — used by list/board rows.
  async getUserActiveTimer(workspaceSlug: string): Promise<TIssueWorkLog | null> {
    return this.get(`/api/workspaces/${workspaceSlug}/me/active-timer/`)
      .then((res) => res?.data ?? null)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async startTimer(workspaceSlug: string, projectId: string, issueId: string): Promise<TIssueWorkLog> {
    return this.post(`/api/workspaces/${workspaceSlug}/projects/${projectId}/issues/${issueId}/timer/`)
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async stopTimer(
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    data: { description?: string; worklog_id?: string } = {}
  ): Promise<TIssueWorkLog> {
    return this.patch(`/api/workspaces/${workspaceSlug}/projects/${projectId}/issues/${issueId}/timer/`, data)
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  // all running timers for the issue (any user) — for the "who is working on this" banner / overview
  async getIssueActiveTimers(workspaceSlug: string, projectId: string, issueId: string): Promise<TIssueWorkLog[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/issues/${issueId}/active-timers/`)
      .then((res) => res?.data ?? [])
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  // ── Summary ──────────────────────────────────────────────────────────

  async getWorklogSummary(
    workspaceSlug: string,
    projectId: string,
    issueId: string
  ): Promise<TIssueWorkLogSummary> {
    return this.get(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/issues/${issueId}/worklog-summary/`
    )
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }
}
