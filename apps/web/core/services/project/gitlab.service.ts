/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// services
import { APIService } from "@/services/api.service";
// helpers
import { API_BASE_URL } from "@plane/constants";

export type TProjectGitLabConfig = {
  merge_from_state_id: string | null;
  merge_to_state_id: string | null;
  webhook_url: string;
};

export type TIssueGitLabMeta = {
  mr_status: string;
  mr_url: string;
  mr_iid: number | null;
  mr_title: string;
  commit_count: number;
  last_synced_at: string | null;
};

export class ProjectGitLabService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async getConfig(workspaceSlug: string, projectId: string): Promise<TProjectGitLabConfig> {
    return this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/gitlab-config/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async updateConfig(
    workspaceSlug: string,
    projectId: string,
    data: Partial<Pick<TProjectGitLabConfig, "merge_from_state_id" | "merge_to_state_id">>
  ): Promise<TProjectGitLabConfig> {
    return this.patch(`/api/workspaces/${workspaceSlug}/projects/${projectId}/gitlab-config/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getIssueGitLabMeta(workspaceSlug: string, projectId: string, issueId: string): Promise<TIssueGitLabMeta> {
    return this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/issues/${issueId}/gitlab/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}
