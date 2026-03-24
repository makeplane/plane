/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import { API_BASE_URL } from "@plane/constants";
import type {
  ISearchIssueResponse,
  Release,
  ReleaseLabel,
  ReleaseLabelWrite,
  ReleaseTag,
  ReleaseTagWrite,
  ReleaseWrite,
  TIssueParams,
  TIssuesResponse,
} from "@plane/types";
import { APIService } from "@/services/api.service";

export type ReleaseSearchWorkItemsParams = {
  search?: string;
};

export class ReleaseService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async list(workspaceSlug: string): Promise<Release[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/releases/`)
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async create(workspaceSlug: string, data: ReleaseWrite): Promise<Release> {
    return this.post(`/api/workspaces/${workspaceSlug}/releases/`, data)
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async retrieve(workspaceSlug: string, releaseId: string): Promise<Release> {
    return this.get(`/api/workspaces/${workspaceSlug}/releases/${releaseId}/`)
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async update(workspaceSlug: string, releaseId: string, data: ReleaseWrite): Promise<Release> {
    return this.patch(`/api/workspaces/${workspaceSlug}/releases/${releaseId}/`, data)
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async destroy(workspaceSlug: string, releaseId: string): Promise<void> {
    return this.delete(`/api/workspaces/${workspaceSlug}/releases/${releaseId}/`)
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  // Tags
  async listTags(workspaceSlug: string): Promise<ReleaseTag[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/releases/tags/`)
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async createTag(workspaceSlug: string, data: ReleaseTagWrite): Promise<ReleaseTag> {
    return this.post(`/api/workspaces/${workspaceSlug}/releases/tags/`, data)
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async updateTag(workspaceSlug: string, tagId: string, data: Partial<ReleaseTagWrite>): Promise<ReleaseTag> {
    return this.patch(`/api/workspaces/${workspaceSlug}/releases/tags/${tagId}/`, data)
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async destroyTag(workspaceSlug: string, tagId: string): Promise<void> {
    return this.delete(`/api/workspaces/${workspaceSlug}/releases/tags/${tagId}/`)
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  // Labels
  async listLabels(workspaceSlug: string): Promise<ReleaseLabel[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/releases/labels/`)
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async createLabel(workspaceSlug: string, data: ReleaseLabelWrite): Promise<ReleaseLabel> {
    return this.post(`/api/workspaces/${workspaceSlug}/releases/labels/`, data)
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async updateLabel(workspaceSlug: string, labelId: string, data: Partial<ReleaseLabelWrite>): Promise<ReleaseLabel> {
    return this.patch(`/api/workspaces/${workspaceSlug}/releases/labels/${labelId}/`, data)
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async destroyLabel(workspaceSlug: string, labelId: string): Promise<void> {
    return this.delete(`/api/workspaces/${workspaceSlug}/releases/labels/${labelId}/`)
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  // Work items
  async listWorkItems(
    workspaceSlug: string,
    releaseId: string,
    params?: Partial<Record<TIssueParams, string | boolean>>
  ): Promise<TIssuesResponse> {
    return this.get(`/api/workspaces/${workspaceSlug}/releases/${releaseId}/work-items/`, { params })
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async addWorkItems(workspaceSlug: string, releaseId: string, workItemIds: string[]): Promise<void> {
    return this.post(`/api/workspaces/${workspaceSlug}/releases/${releaseId}/work-items/`, {
      work_item_ids: workItemIds,
    })
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async removeWorkItems(workspaceSlug: string, releaseId: string, workItemIds: string[]): Promise<void> {
    return this.delete(`/api/workspaces/${workspaceSlug}/releases/${releaseId}/work-items/`, {
      work_item_ids: workItemIds,
    })
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async searchWorkItems(
    workspaceSlug: string,
    releaseId: string,
    params: ReleaseSearchWorkItemsParams
  ): Promise<ISearchIssueResponse[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/releases/${releaseId}/search-work-items/`, {
      params: { search: params.search ?? "" },
    })
      .then((res) => res?.data ?? [])
      .catch((err) => {
        throw err?.response?.data;
      });
  }
}

const releaseService = new ReleaseService();

export default releaseService;
