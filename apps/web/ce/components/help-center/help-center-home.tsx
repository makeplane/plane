/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useState } from "react";
import { useSearchParams } from "react-router";
import { observer } from "mobx-react";
import { useTranslation } from "@plane/i18n";
import { useHelpCenter } from "@/plane-web/hooks/store/use-help-center";
import { ArticleList } from "./article-list";
import { CategoryGrid } from "./category-grid";
import { HelpCenterEmpty, HelpLoading } from "./help-center-states";
import { HelpCenterFeatured } from "./help-center-featured";
import { HelpSearchBox } from "./help-search-box";

const SEARCH_DEBOUNCE_MS = 300;

// Help Center home: prominent search + "get started" + category grid. A
// `?category=` deep-link shows that category's articles; a non-empty query
// shows search results. observer() is required so a UI-locale switch (the i18n
// store is observable) re-renders this component and re-runs the locale fetches.
export const HelpCenterHome = observer(function HelpCenterHome() {
  const { t, currentLocale } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { category, article } = useHelpCenter();
  const [query, setQuery] = useState("");

  const categoryId = searchParams.get("category");
  const trimmed = query.trim();

  useEffect(() => {
    void category.fetchCategories(currentLocale);
  }, [category, currentLocale]);

  useEffect(() => {
    if (categoryId) void article.fetchArticles({ category: categoryId, locale: currentLocale });
  }, [article, categoryId, currentLocale]);

  useEffect(() => {
    if (!trimmed) return;
    const timer = window.setTimeout(() => void article.searchArticles(trimmed, currentLocale), SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [article, trimmed, currentLocale]);

  const categories = category.categoriesSorted;
  const selectCategory = (id: string) => setSearchParams({ category: id });

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold text-primary">{t("help_center.title")}</h1>
        <p className="mt-1 text-13 text-tertiary">{t("help_center.subtitle")}</p>
      </header>

      <HelpSearchBox value={query} onChange={setQuery} />

      {trimmed ? (
        <section className="mt-6">
          <ArticleList
            currentLocale={currentLocale}
            articles={article.searchResults}
            loading={article.searchLoader}
            emptyLabel={t("help_center.no_results")}
            showMatchedLocale
          />
        </section>
      ) : categoryId ? (
        <section className="mt-6">
          <button
            type="button"
            onClick={() => setSearchParams({})}
            className="mb-4 text-13 text-accent-primary hover:underline"
          >
            ← {t("help_center.all_categories")}
          </button>
          <ArticleList
            currentLocale={currentLocale}
            articles={article.getArticlesByCategory(categoryId)}
            loading={article.listLoader}
            emptyLabel={t("help_center.no_articles_yet")}
          />
        </section>
      ) : category.loader && categories.length === 0 ? (
        <HelpLoading />
      ) : categories.length === 0 ? (
        <HelpCenterEmpty title={t("help_center.no_categories_yet")} />
      ) : (
        <div className="mt-6">
          <HelpCenterFeatured category={categories[0]} onSelect={selectCategory} />
          <CategoryGrid categories={categories} onSelect={selectCategory} />
        </div>
      )}
    </div>
  );
});
