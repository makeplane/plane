/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { API_BASE_URL } from "@plane/constants";
import { APIService } from "@/services/api.service";
import type {
  THelpArticleDetail,
  THelpArticleFilters,
  THelpArticlePayload,
  THelpArticleTranslation,
  THelpArticleListItem,
  THelpCategory,
  THelpCategoryPayload,
  THelpLocale,
} from "@/plane-web/types/help-center";

// Mirrors the frozen Phase-2 contract: /api/workspaces/<slug>/help/...; locale
// is always the `?locale=` query param (never Accept-Language).
export class HelpCenterService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async fetchCategories(workspaceSlug: string, locale: THelpLocale): Promise<THelpCategory[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/help/categories/`, { params: { locale } })
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async fetchArticles(workspaceSlug: string, filters: THelpArticleFilters): Promise<THelpArticleListItem[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/help/articles/`, { params: filters })
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async fetchArticleById(workspaceSlug: string, articleId: string, locale: THelpLocale): Promise<THelpArticleDetail> {
    return this.get(`/api/workspaces/${workspaceSlug}/help/articles/${articleId}/`, { params: { locale } })
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async createCategory(workspaceSlug: string, data: THelpCategoryPayload): Promise<THelpCategory> {
    return this.post(`/api/workspaces/${workspaceSlug}/help/categories/`, data)
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async updateCategory(workspaceSlug: string, categoryId: string, data: THelpCategoryPayload): Promise<THelpCategory> {
    return this.patch(`/api/workspaces/${workspaceSlug}/help/categories/${categoryId}/`, data)
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async deleteCategory(workspaceSlug: string, categoryId: string): Promise<void> {
    return this.delete(`/api/workspaces/${workspaceSlug}/help/categories/${categoryId}/`)
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async createArticle(workspaceSlug: string, data: THelpArticlePayload): Promise<THelpArticleDetail> {
    return this.post(`/api/workspaces/${workspaceSlug}/help/articles/`, data)
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async updateArticle(
    workspaceSlug: string,
    articleId: string,
    data: THelpArticlePayload
  ): Promise<THelpArticleDetail> {
    return this.patch(`/api/workspaces/${workspaceSlug}/help/articles/${articleId}/`, data)
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async deleteArticle(workspaceSlug: string, articleId: string): Promise<void> {
    return this.delete(`/api/workspaces/${workspaceSlug}/help/articles/${articleId}/`)
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async upsertTranslation(
    workspaceSlug: string,
    articleId: string,
    locale: THelpLocale,
    payload: Partial<THelpArticleTranslation>
  ): Promise<THelpArticleDetail> {
    return this.put(`/api/workspaces/${workspaceSlug}/help/articles/${articleId}/translations/${locale}/`, payload)
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }
}
