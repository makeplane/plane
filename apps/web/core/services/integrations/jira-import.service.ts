/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { API_BASE_URL } from "@plane/constants";
import type {
  TJiraBoard,
  TJiraConnectionResponse,
  TJiraCredentials,
  TJiraImportPayload,
  TJiraMetadata,
  TImportJob,
} from "@plane/types";
import { APIService } from "@/services/api.service";

/**
 * Live Jira Cloud import service. Talks to the internal `plane.app` API.
 */
export class JiraImportService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async testConnection(workspaceSlug: string, credentials: TJiraCredentials): Promise<TJiraConnectionResponse> {
    return this.post(`/api/workspaces/${workspaceSlug}/jira-import/test-connection/`, credentials)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getBoards(workspaceSlug: string, credentials: TJiraCredentials): Promise<TJiraBoard[]> {
    return this.post(`/api/workspaces/${workspaceSlug}/jira-import/boards/`, credentials)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getMetadata(workspaceSlug: string, credentials: TJiraCredentials, boardId: number): Promise<TJiraMetadata> {
    return this.post(`/api/workspaces/${workspaceSlug}/jira-import/metadata/`, {
      ...credentials,
      board_id: boardId,
    })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getImportJobs(workspaceSlug: string): Promise<TImportJob[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/jira-import/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async createImportJob(workspaceSlug: string, payload: TJiraImportPayload): Promise<TImportJob> {
    return this.post(`/api/workspaces/${workspaceSlug}/jira-import/`, payload)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async reRunImportJob(workspaceSlug: string, jobId: string, token: string): Promise<TImportJob> {
    return this.post(`/api/workspaces/${workspaceSlug}/jira-import/${jobId}/re-run/`, { token })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}

export const jiraImportService = new JiraImportService();
