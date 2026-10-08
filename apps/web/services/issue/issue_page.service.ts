/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { API_BASE_URL } from "@plane/constants";
import type { TPage } from "@plane/types";
import { APIService } from "@/services/api.service";

export type TWorkItemPage = {
  id: string;
  page: TPage;
  issue: string;
  project: string;
  workspace: string;
  created_at: string;
  updated_at: string;
};

type TWorkItemPageResponse = TWorkItemPage[] | { results: TWorkItemPage[] };

export class IssuePageService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async list(workspaceSlug: string, projectId: string, issueId: string): Promise<TWorkItemPage[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/work-items/${issueId}/pages/`)
      .then((response) => {
        const data = response?.data as TWorkItemPageResponse;
        return Array.isArray(data) ? data : (data?.results ?? []);
      })
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async create(workspaceSlug: string, projectId: string, issueId: string, pageId: string): Promise<TWorkItemPage> {
    return this.post(`/api/workspaces/${workspaceSlug}/projects/${projectId}/work-items/${issueId}/pages/`, {
      page_id: pageId,
    })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async remove(workspaceSlug: string, projectId: string, issueId: string, linkId: string): Promise<void> {
    return this.delete(`/api/workspaces/${workspaceSlug}/projects/${projectId}/work-items/${issueId}/pages/${linkId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}
