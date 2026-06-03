/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { IHelpArticle, IHelpCategory } from "@plane/types";

// Pick a representative label for the English-only admin list views: prefer EN,
// then VI, then any translation, falling back to the slug.
export const categoryDisplayName = (category: IHelpCategory): string => {
  const byLocale = new Map(category.translations.map((t) => [t.locale, t.name]));
  return byLocale.get("en") || byLocale.get("vi") || category.translations[0]?.name || category.slug;
};

export const articleDisplayTitle = (article: IHelpArticle): string => {
  const byLocale = new Map(article.translations.map((t) => [t.locale, t.title]));
  return byLocale.get("en") || byLocale.get("vi") || article.translations[0]?.title || article.slug;
};
