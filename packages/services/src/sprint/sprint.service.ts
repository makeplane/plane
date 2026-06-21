/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { API_BASE_URL } from "@plane/constants";
import type { IWorkspaceSprint, TWorkspaceSprintCreatePayload, WorkspaceSprintIssueResponse } from "@plane/types";
import { APIService } from "../api.service";

export class WorkspaceSprintService extends APIService {
  constructor(BASE_URL?: string) {
    super(BASE_URL || API_BASE_URL);
  }

  async list(workspaceSlug: string): Promise<IWorkspaceSprint[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/sprints/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async create(workspaceSlug: string, data: Partial<TWorkspaceSprintCreatePayload>): Promise<IWorkspaceSprint> {
    return this.post(`/api/workspaces/${workspaceSlug}/sprints/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async retrieve(workspaceSlug: string, sprintId: string): Promise<IWorkspaceSprint> {
    return this.get(`/api/workspaces/${workspaceSlug}/sprints/${sprintId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async update(
    workspaceSlug: string,
    sprintId: string,
    data: Partial<TWorkspaceSprintCreatePayload>
  ): Promise<IWorkspaceSprint> {
    return this.patch(`/api/workspaces/${workspaceSlug}/sprints/${sprintId}/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async destroy(workspaceSlug: string, sprintId: string): Promise<void> {
    return this.delete(`/api/workspaces/${workspaceSlug}/sprints/${sprintId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async listIssues(workspaceSlug: string, sprintId: string): Promise<WorkspaceSprintIssueResponse[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/sprints/${sprintId}/issues/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async addIssue(workspaceSlug: string, sprintId: string, issueId: string): Promise<WorkspaceSprintIssueResponse> {
    return this.post(`/api/workspaces/${workspaceSlug}/sprints/${sprintId}/issues/`, { issue_id: issueId })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async removeIssue(workspaceSlug: string, sprintId: string, issueId: string): Promise<void> {
    return this.delete(`/api/workspaces/${workspaceSlug}/sprints/${sprintId}/issues/${issueId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}
