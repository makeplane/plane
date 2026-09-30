/**
 * Copyright (c) 2026-present Okręgowa Spółdzielnia Mleczarska w Piątnicy
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { API_BASE_URL } from "@plane/constants";
import type { TProjectTemplate, TProjectTemplatePayload } from "@plane/types";
import { APIService } from "@/services/api.service";

type TListResult = TProjectTemplate[] | { results: TProjectTemplate[]; count?: number; next?: string | null };

function normalizeList(data: TListResult): TProjectTemplate[] {
  if (Array.isArray(data)) return data;
  if (data && "results" in data && Array.isArray(data.results)) return data.results;
  return [];
}

export class ProjectTemplateService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async list(workspaceSlug: string): Promise<TProjectTemplate[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/project-templates/`)
      .then((response) => normalizeList(response?.data))
      .catch((error) => {
        throw error?.response;
      });
  }

  async retrieve(workspaceSlug: string, templateId: string): Promise<TProjectTemplate> {
    return this.get(`/api/workspaces/${workspaceSlug}/project-templates/${templateId}/`)
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
      payload: TProjectTemplatePayload;
    }
  ): Promise<TProjectTemplate> {
    return this.post(`/api/workspaces/${workspaceSlug}/project-templates/`, data)
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
      payload: TProjectTemplatePayload;
    }>
  ): Promise<TProjectTemplate> {
    return this.patch(`/api/workspaces/${workspaceSlug}/project-templates/${templateId}/`, data)
      .then((res) => res?.data)
      .catch((e) => {
        throw e?.response;
      });
  }

  async remove(workspaceSlug: string, templateId: string): Promise<void> {
    return this.delete(`/api/workspaces/${workspaceSlug}/project-templates/${templateId}/`)
      .then(() => undefined)
      .catch((e) => {
        throw e?.response;
      });
  }

  async createProjectStatesFromTemplate(
    workspaceSlug: string,
    projectId: string,
    states: NonNullable<TProjectTemplatePayload["state_templates"]>
  ): Promise<void> {
    await Promise.all(
      states
        .filter((state) => !!state?.name?.trim())
        .map((state) =>
          this.post(`/api/workspaces/${workspaceSlug}/projects/${projectId}/states/`, {
            name: state.name.trim(),
            group: state.group ?? "unstarted",
            color: state.color ?? "#60646C",
            default: Boolean(state.default),
          })
        )
    ).catch((e) => {
      throw e?.response;
    });
  }

  async createProjectLabelsFromTemplate(
    workspaceSlug: string,
    projectId: string,
    labels: NonNullable<TProjectTemplatePayload["label_templates"]>
  ): Promise<void> {
    await Promise.all(
      labels
        .filter((label) => !!label?.name?.trim())
        .map((label) =>
          this.post(`/api/workspaces/${workspaceSlug}/projects/${projectId}/issue-labels/`, {
            name: label.name.trim(),
            color: label.color ?? undefined,
          })
        )
    ).catch((e) => {
      throw e?.response;
    });
  }

  async seedIssueTypesFromProjectTemplate(workspaceSlug: string, projectId: string, templateId: string): Promise<void> {
    await this.post(`/api/workspaces/${workspaceSlug}/projects/${projectId}/issue-setup/from-project-template/`, {
      template_id: templateId,
    }).catch((e) => {
      throw e?.response;
    });
  }
}
