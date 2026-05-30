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
  THelpArticleListItem,
  THelpCategory,
  THelpLocale,
} from "@/plane-web/types/help-center";

// Instance-global READ endpoints (no workspace slug). Authoring is God Mode
// (apps/admin) and is NOT part of this web service. `locale` is the `?locale=`
// query param.
export class HelpCenterService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async fetchCategories(locale: THelpLocale): Promise<THelpCategory[]> {
    return this.get(`/api/help/categories/`, { params: { locale } })
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async fetchArticles(filters: THelpArticleFilters): Promise<THelpArticleListItem[]> {
    return this.get(`/api/help/articles/`, { params: filters })
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async fetchArticleById(articleId: string, locale: THelpLocale): Promise<THelpArticleDetail> {
    return this.get(`/api/help/articles/${articleId}/`, { params: { locale } })
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  // Deep links resolve by the globally-unique article slug.
  async fetchArticleBySlug(slug: string, locale: THelpLocale): Promise<THelpArticleDetail> {
    return this.get(`/api/help/articles/slug/${slug}/`, { params: { locale } })
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }
}
