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

// plane imports
import { API_BASE_URL } from "@plane/constants";
import type {
  TDocumentPayload,
  TIssuePage,
  TMovePagePayload,
  TPage,
  TEditorEmbedsResponse,
  TEditorEmbedType,
  TEditorMentionsResponse,
  TEditorMentionType,
  TPagesSummary,
  TPaginationInfo,
} from "@plane/types";
// services
import { APIService } from "@/services/api.service";

// Paginated response type for pages
export type TPagePaginatedResponse = TPaginationInfo & {
  results: TPage[];
};

export class WorkspacePageService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async fetchAll(workspaceSlug: string): Promise<TPage[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/pages/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async fetchPagesSummary(workspaceSlug: string): Promise<TPagesSummary> {
    return this.get(`/api/workspaces/${workspaceSlug}/pages-summary/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async fetchPagesByType(
    workspaceSlug: string,
    type: string,
    searchQuery?: string,
    cursor?: string,
    perPage: number = 20
  ): Promise<TPagePaginatedResponse> {
    return this.get(`/api/workspaces/${workspaceSlug}/pages/`, {
      params: {
        search: searchQuery,
        type,
        cursor,
        per_page: perPage,
      },
    })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async fetchById(workspaceSlug: string, pageId: string, trackVisit: boolean): Promise<TPage> {
    return this.get(`/api/workspaces/${workspaceSlug}/pages/${pageId}/`, {
      params: {
        track_visit: trackVisit,
      },
    })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async create(workspaceSlug: string, data: Partial<TPage>): Promise<TPage> {
    return this.post(`/api/workspaces/${workspaceSlug}/pages/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async update(workspaceSlug: string, pageId: string, data: Partial<TPage>): Promise<TPage> {
    return this.patch(`/api/workspaces/${workspaceSlug}/pages/${pageId}/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async updateAccess(workspaceSlug: string, pageId: string, data: Partial<TPage>): Promise<void> {
    return this.post(`/api/workspaces/${workspaceSlug}/pages/${pageId}/access/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async remove(workspaceSlug: string, pageId: string): Promise<void> {
    return this.delete(`/api/workspaces/${workspaceSlug}/pages/${pageId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async addToFavorites(workspaceSlug: string, pageId: string): Promise<void> {
    return this.post(`/api/workspaces/${workspaceSlug}/favorite-pages/${pageId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async removeFromFavorites(workspaceSlug: string, pageId: string): Promise<void> {
    return this.delete(`/api/workspaces/${workspaceSlug}/favorite-pages/${pageId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async archive(
    workspaceSlug: string,
    pageId: string
  ): Promise<{
    archived_at: string;
  }> {
    return this.post(`/api/workspaces/${workspaceSlug}/pages/${pageId}/archive/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async restore(workspaceSlug: string, pageId: string): Promise<void> {
    return this.delete(`/api/workspaces/${workspaceSlug}/pages/${pageId}/archive/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async lock(workspaceSlug: string, pageId: string, recursive: boolean): Promise<void> {
    return this.post(`/api/workspaces/${workspaceSlug}/pages/${pageId}/lock/`, {
      action: recursive ? "all" : "",
    })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async unlock(workspaceSlug: string, pageId: string, recursive: boolean): Promise<void> {
    return this.delete(`/api/workspaces/${workspaceSlug}/pages/${pageId}/lock/`, {
      action: recursive ? "all" : "",
    })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async fetchDescriptionBinary(workspaceSlug: string, pageId: string): Promise<any> {
    return this.get(`/api/workspaces/${workspaceSlug}/pages/${pageId}/description/`, {
      headers: {
        "Content-Type": "application/octet-stream",
      },
      responseType: "arraybuffer",
    })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async updateDescription(workspaceSlug: string, pageId: string, data: TDocumentPayload): Promise<any> {
    return this.patch(`/api/workspaces/${workspaceSlug}/pages/${pageId}/description/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async duplicate(workspaceSlug: string, pageId: string): Promise<TPage> {
    return this.post(`/api/workspaces/${workspaceSlug}/pages/${pageId}/duplicate/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async move(workspaceSlug: string, pageId: string, data: TMovePagePayload): Promise<void> {
    return this.post(`/api/workspaces/${workspaceSlug}/pages/${pageId}/move/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async fetchSubPages(workspaceSlug: string, pageId: string): Promise<TPage[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/pages/${pageId}/sub-pages/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async fetchParentPages(workspaceSlug: string, pageId: string): Promise<TPage[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/pages/${pageId}/parent-pages/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async searchPages(
    workspaceSlug: string,
    projectId: string,
    payload: { is_global: boolean; search: string }
  ): Promise<TIssuePage[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/pages-search/`, {
      params: payload,
    })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async downloadWikiDirectory(workspaceSlug: string): Promise<void> {
    return this.post(`/api/workspaces/${workspaceSlug}/pages-export/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async downloadPage(workspaceSlug: string, pageId: string): Promise<void> {
    return this.post(`/api/workspaces/${workspaceSlug}/pages/${pageId}/exports/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async fetchEmbeds(
    workspaceSlug: string,
    pageId: string,
    embedType: TEditorEmbedType
  ): Promise<TEditorEmbedsResponse> {
    return this.get(`/api/workspaces/${workspaceSlug}/pages/${pageId}/embeds/`, {
      params: {
        embed_type: embedType,
      },
    })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async fetchMentions(
    workspaceSlug: string,
    pageId: string,
    mentionType: TEditorMentionType
  ): Promise<TEditorMentionsResponse> {
    return this.get(`/api/workspaces/${workspaceSlug}/pages/${pageId}/mentions/`, {
      params: {
        mention_type: mentionType,
      },
    })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}
