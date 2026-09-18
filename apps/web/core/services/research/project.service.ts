/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { API_BASE_URL, researchEndpoints } from "@plane/constants";
import type {
  TPaginationInfo,
  TResearchContext,
  TResearchContextResourceMetadata,
  TResearchProjectProfile,
} from "@plane/types";
// services
import { APIService } from "@/services/api.service";

export type TResearchProject = {
  id: string;
  name: string;
  identifier: string;
  is_research_project: boolean;
  archived_at: string | null;
  research: (TResearchProjectProfile & { org_unit_name?: string | null }) | null;
};

export type TResearchProjectCreatePayload = {
  name?: string;
  identifier?: string;
  owner?: string;
  org_unit?: string | null;
  research_type?: string;
  started_at?: string | null;
  expected_end_at?: string | null;
  create_project?: boolean;
};

export class ResearchProjectService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async getProjects(workspaceSlug: string, params: Record<string, string> = {}) {
    return this.get(researchEndpoints.projects(workspaceSlug), { params })
      .then((res) => res?.data as TPaginationInfo & { results: TResearchProject[] })
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async getContext(workspaceSlug: string, params: { project_id?: string; page?: number; page_size?: number } = {}) {
    return this.get(researchEndpoints.context(workspaceSlug), { params })
      .then((res) => res?.data as TResearchContext)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async getContextResource(workspaceSlug: string, kind: string, resourceId: string, version = "latest") {
    return this.get(researchEndpoints.contextResource(workspaceSlug, kind, resourceId), { params: { version } })
      .then((res) => res?.data as TResearchContextResourceMetadata)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async createProject(workspaceSlug: string, payload: TResearchProjectCreatePayload) {
    return this.post(researchEndpoints.projects(workspaceSlug), payload)
      .then((res) => res?.data as TResearchProject)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async getProject(workspaceSlug: string, projectId: string) {
    return this.get(researchEndpoints.project(workspaceSlug, projectId))
      .then((res) => res?.data as TResearchProject)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async updateProject(workspaceSlug: string, projectId: string, payload: Partial<TResearchProjectCreatePayload>) {
    return this.patch(researchEndpoints.project(workspaceSlug, projectId), payload)
      .then((res) => res?.data as TResearchProject)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async archiveProject(workspaceSlug: string, projectId: string) {
    return this.post(researchEndpoints.projectArchive(workspaceSlug, projectId), {})
      .then((res) => res?.data as TResearchProject)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async restoreProject(workspaceSlug: string, projectId: string) {
    return this.post(researchEndpoints.projectRestore(workspaceSlug, projectId), {})
      .then((res) => res?.data as TResearchProject)
      .catch((err) => {
        throw err?.response?.data;
      });
  }
}
