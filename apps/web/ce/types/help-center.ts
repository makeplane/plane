/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

export type THelpLocale = "vi" | "en" | "ko";
export type THelpArticleStatus = "draft" | "published";

export type THelpCategory = {
  id: string;
  slug: string;
  sort_order: number;
  icon: string;
  color: string;
  is_active: boolean;
  name: string;
  article_count: number;
};

export type THelpArticleListItem = {
  id: string;
  slug: string;
  category: string | null;
  sort_order: number;
  status: THelpArticleStatus;
  title: string | null;
  resolved_locale: THelpLocale | null;
  matched_locale: THelpLocale | null;
  snippet: string | null;
  updated_at: string;
};

export type THelpArticleDetail = THelpArticleListItem & {
  description_html: string | null;
  description_json: Record<string, unknown> | null;
  available_locales: THelpLocale[];
  requested_locale: THelpLocale | null;
};

export type THelpArticleTranslation = {
  locale: THelpLocale;
  title: string;
  description_html: string;
  description_json: Record<string, unknown>;
};

export type THelpCategoryTranslation = {
  locale: THelpLocale;
  name: string;
};

export type THelpArticleFilters = {
  category?: string;
  locale?: THelpLocale | null;
  search?: string;
  status?: THelpArticleStatus;
};

export type THelpCategoryPayload = {
  icon?: string;
  color?: string;
  is_active?: boolean;
  sort_order?: number;
  translations?: THelpCategoryTranslation[];
};

export type THelpArticlePayload = {
  category?: string | null;
  status?: THelpArticleStatus;
  slug?: string;
  sort_order?: number;
  translations?: Partial<THelpArticleTranslation>[];
};
