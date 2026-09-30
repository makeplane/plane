/**
 * Copyright (c) 2026-present Okręgowa Spółdzielnia Mleczarska w Piątnicy
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { API_BASE_URL } from "@plane/constants";
import type { TIssueType, TIssueTypePropertyValueEntry, TProjectIssueType } from "@plane/types";
import { APIService } from "@/services/api.service";

type TListResult<T> = T[] | { results: T[]; count?: number; next?: string | null };

function normalizeList<T>(data: TListResult<T>): T[] {
  if (Array.isArray(data)) return data;
  if (data && "results" in data && Array.isArray(data.results)) return data.results;
  return [];
}

export class IssueTypeService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async listWorkspaceTypes(workspaceSlug: string, activeOnly = false): Promise<TIssueType[]> {
    const params: Record<string, string> = {};
    if (activeOnly) params.active_only = "true";
    return this.get(`/api/workspaces/${workspaceSlug}/issue-types/`, { params })
      .then((res) => normalizeList<TIssueType>(res?.data))
      .catch((e) => {
        throw e?.response;
      });
  }

  async retrieveWorkspaceType(workspaceSlug: string, typeId: string): Promise<TIssueType> {
    return this.get(`/api/workspaces/${workspaceSlug}/issue-types/${typeId}/`)
      .then((res) => res?.data)
      .catch((e) => {
        throw e?.response;
      });
  }

  async createWorkspaceType(workspaceSlug: string, data: Partial<TIssueType> & { name: string }): Promise<TIssueType> {
    return this.post(`/api/workspaces/${workspaceSlug}/issue-types/`, data)
      .then((res) => res?.data)
      .catch((e) => {
        throw e?.response;
      });
  }

  async updateWorkspaceType(workspaceSlug: string, typeId: string, data: Partial<TIssueType>): Promise<TIssueType> {
    return this.patch(`/api/workspaces/${workspaceSlug}/issue-types/${typeId}/`, data)
      .then((res) => res?.data)
      .catch((e) => {
        throw e?.response;
      });
  }

  async removeWorkspaceType(workspaceSlug: string, typeId: string): Promise<void> {
    return this.delete(`/api/workspaces/${workspaceSlug}/issue-types/${typeId}/`)
      .then(() => undefined)
      .catch((e) => {
        throw e?.response;
      });
  }

  async listProjectTypes(workspaceSlug: string, projectId: string): Promise<TProjectIssueType[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/issue-types/`)
      .then((res) => normalizeList<TProjectIssueType>(res?.data))
      .catch((e) => {
        throw e?.response;
      });
  }

  async bulkAssignProjectTypes(
    workspaceSlug: string,
    projectId: string,
    data: { issue_type_ids: string[]; default_type_id?: string | null }
  ): Promise<TIssueType[]> {
    return this.post(`/api/workspaces/${workspaceSlug}/projects/${projectId}/issue-types/bulk/`, data)
      .then((res) => normalizeList<TIssueType>(res?.data?.results ?? res?.data))
      .catch((e) => {
        throw e?.response;
      });
  }

  async listTypeProperties(
    workspaceSlug: string,
    projectId: string,
    typeId: string
  ): Promise<TIssueTypePropertyValueEntry[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/issue-type-properties/`, {
      params: { type_id: typeId },
    })
      .then((res) => normalizeList<TIssueTypePropertyValueEntry>(res?.data?.results ?? res?.data))
      .catch((e) => {
        throw e?.response;
      });
  }

  async getIssuePropertyValues(
    workspaceSlug: string,
    projectId: string,
    issueId: string
  ): Promise<TIssueTypePropertyValueEntry[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/issues/${issueId}/type-property-values/`)
      .then((res) => normalizeList<TIssueTypePropertyValueEntry>(res?.data?.results ?? res?.data))
      .catch((e) => {
        throw e?.response;
      });
  }

  async saveIssuePropertyValues(
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    values: { property_id: string; value: unknown }[]
  ): Promise<void> {
    return this.post(`/api/workspaces/${workspaceSlug}/projects/${projectId}/issues/${issueId}/type-property-values/`, {
      values,
    })
      .then(() => undefined)
      .catch((e) => {
        throw e?.response;
      });
  }
}
