/**
 * Copyright (c) 2026-present Okręgowa Spółdzielnia Mleczarska w Piątnicy
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { API_BASE_URL } from "@plane/constants";
import type { TWorkItemTemplate, TWorkItemTemplatePayload } from "@plane/types";
import { APIService } from "@/services/api.service";

type TListResult = TWorkItemTemplate[] | { results: TWorkItemTemplate[]; count?: number; next?: string | null };

function normalizeList(data: TListResult): TWorkItemTemplate[] {
  if (Array.isArray(data)) return data;
  if (data && "results" in data && Array.isArray(data.results)) return data.results;
  return [];
}

export class WorkItemTemplateService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async list(workspaceSlug: string, forProjectId?: string | null): Promise<TWorkItemTemplate[]> {
    const params: Record<string, string> = {};
    if (forProjectId) {
      params.for_project = forProjectId;
    }
    return this.get(`/api/workspaces/${workspaceSlug}/work-item-templates/`, { params })
      .then((response) => {
        return normalizeList(response?.data);
      })
      .catch((error) => {
        throw error?.response;
      });
  }

  async retrieve(workspaceSlug: string, templateId: string, forProjectId: string): Promise<TWorkItemTemplate> {
    return this.get(`/api/workspaces/${workspaceSlug}/work-item-templates/${templateId}/`, {
      params: { for_project: forProjectId },
    })
      .then((res) => res?.data)
      .catch((e) => {
        throw e?.response;
      });
  }

  async create(
    workspaceSlug: string,
    data: {
      name: string;
      description?: string;
      project_id?: string | null;
      payload: TWorkItemTemplatePayload;
    }
  ): Promise<TWorkItemTemplate> {
    return this.post(`/api/workspaces/${workspaceSlug}/work-item-templates/`, data)
      .then((res) => res?.data)
      .catch((e) => {
        throw e?.response;
      });
  }

  async update(
    workspaceSlug: string,
    templateId: string,
    data: Partial<{
      name: string;
      description: string;
      project_id: string | null;
      payload: TWorkItemTemplatePayload;
    }>
  ): Promise<TWorkItemTemplate> {
    return this.patch(`/api/workspaces/${workspaceSlug}/work-item-templates/${templateId}/`, data)
      .then((res) => res?.data)
      .catch((e) => {
        throw e?.response;
      });
  }

  async remove(workspaceSlug: string, templateId: string): Promise<void> {
    return this.delete(`/api/workspaces/${workspaceSlug}/work-item-templates/${templateId}/`)
      .then(() => undefined)
      .catch((e) => {
        throw e?.response;
      });
  }
}
