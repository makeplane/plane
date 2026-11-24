/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// Liviere/plane fork: app endpoints of the project activity heatmap and log entries
// (apps/api/plane/liviere/app/activity.py).

import { API_BASE_URL } from "@plane/constants";
import { APIService } from "@/services/api.service";
import type {
  TActivityEvent,
  TActivityEventsPage,
  TActivityHeatmap,
  TActivityLogInput,
  TActivityQuery,
  TActivitySettings,
} from "./types";

// Entries per page of the work log view
const LOG_PAGE_SIZE = 50;

export class ProjectActivityService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  private projectUrl(workspaceSlug: string, projectId: string, path: string) {
    return `/api/workspaces/${workspaceSlug}/projects/${projectId}/liviere/activity/${path}/`;
  }

  private queryParams(query: TActivityQuery) {
    return { from: query.from, to: query.to, tz: query.tz, ...(query.actor ? { actor: query.actor } : {}) };
  }

  async getHeatmap(workspaceSlug: string, projectId: string, query: TActivityQuery): Promise<TActivityHeatmap> {
    return this.get(this.projectUrl(workspaceSlug, projectId, "heatmap"), { params: this.queryParams(query) })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getEvents(
    workspaceSlug: string,
    projectId: string,
    query: TActivityQuery & { start: string; end: string }
  ): Promise<TActivityEventsPage> {
    return this.get(this.projectUrl(workspaceSlug, projectId, "events"), {
      params: { ...this.queryParams(query), start: query.start, end: query.end, per_page: 200 },
    })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getSettings(workspaceSlug: string, projectId: string): Promise<TActivitySettings> {
    return this.get(this.projectUrl(workspaceSlug, projectId, "settings"))
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async updateSettings(
    workspaceSlug: string,
    projectId: string,
    data: Partial<Pick<TActivitySettings, "enabled" | "kinds">>
  ): Promise<TActivitySettings> {
    return this.patch(this.projectUrl(workspaceSlug, projectId, "settings"), data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getLogs(
    workspaceSlug: string,
    projectId: string,
    query: TActivityQuery,
    cursor?: string
  ): Promise<TActivityEventsPage> {
    return this.get(this.projectUrl(workspaceSlug, projectId, "logs"), {
      params: { ...this.queryParams(query), per_page: LOG_PAGE_SIZE, ...(cursor ? { cursor } : {}) },
    })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async createLog(workspaceSlug: string, projectId: string, data: TActivityLogInput): Promise<TActivityEvent> {
    return this.post(this.projectUrl(workspaceSlug, projectId, "logs"), data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async updateLog(
    workspaceSlug: string,
    projectId: string,
    logId: number,
    data: Partial<TActivityLogInput>
  ): Promise<TActivityEvent> {
    return this.patch(`${this.projectUrl(workspaceSlug, projectId, "logs")}${logId}/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async deleteLog(workspaceSlug: string, projectId: string, logId: number): Promise<void> {
    return this.delete(`${this.projectUrl(workspaceSlug, projectId, "logs")}${logId}/`)
      .then(() => undefined)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getEnabledProjectIds(workspaceSlug: string): Promise<string[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/liviere/activity/enabled-projects/`)
      .then((response) => response?.data?.project_ids ?? [])
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}

export const projectActivityService = new ProjectActivityService();
