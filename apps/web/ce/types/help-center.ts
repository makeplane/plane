/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// The Help Center is instance-global (one shared guide across all workspaces).
// The web app is READ-ONLY here; authoring is God Mode (apps/admin).

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
  available_locales: THelpLocale[];
  requested_locale: THelpLocale | null;
};

export type THelpArticleFilters = {
  category?: string;
  locale?: THelpLocale | null;
  search?: string;
};
