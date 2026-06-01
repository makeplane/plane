/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// Shapes for God Mode (instance-admin) authoring of the shared, instance-global
// Help Center. Content is multilingual (VI/EN/KO); the admin chrome is English-only.
// Mirrors the API serializers in plane/app/serializers/help_center.py
// (HelpCategoryAdminSerializer / HelpArticleAdminSerializer).

export type THelpLocale = "vi" | "en" | "ko";
export type THelpArticleStatus = "draft" | "published";

export interface IHelpCategoryTranslation {
  locale: THelpLocale;
  name: string;
}

export interface IHelpArticleTranslation {
  locale: THelpLocale;
  title: string;
  description_html: string;
  description_json: object;
}

export interface IHelpCategory {
  id: string;
  slug: string;
  sort_order: number;
  icon: string;
  color: string;
  is_active: boolean;
  translations: IHelpCategoryTranslation[];
}

export interface IHelpArticle {
  id: string;
  slug: string;
  category: string | null;
  sort_order: number;
  status: THelpArticleStatus;
  translations: IHelpArticleTranslation[];
  created_at: string;
  updated_at: string;
}

// ── Write payloads ───────────────────────────────────────────────────────────

export interface IHelpCategoryTranslationInput {
  locale: THelpLocale;
  name: string;
}

export interface IHelpCategoryCreate {
  translations: IHelpCategoryTranslationInput[];
  icon?: string;
  color?: string;
  is_active?: boolean;
}

export interface IHelpCategoryUpdate {
  icon?: string;
  color?: string;
  is_active?: boolean;
  sort_order?: number;
  translations?: IHelpCategoryTranslationInput[];
}

export interface IHelpArticleTranslationInput {
  locale: THelpLocale;
  title: string;
  description_html?: string;
  description_json?: object;
}

export interface IHelpArticleCreate {
  category: string | null;
  translations: IHelpArticleTranslationInput[];
  status?: THelpArticleStatus;
}

export interface IHelpArticleUpdate {
  category?: string | null;
  slug?: string;
  sort_order?: number;
  status?: THelpArticleStatus;
  translations?: IHelpArticleTranslationInput[];
}

export interface IHelpArticleTranslationUpsert {
  title: string;
  description_html?: string;
  description_json?: object;
}

// ── Bundle export/import ──────────────────────────────────────────────────────

// Result of importing a help-center bundle (.zip) into the current environment.
// Mirrors the API response of POST /api/instances/help/import/.
export type THelpBundleImportResult = {
  categories: number;
  articles: number;
  images: number;
};
