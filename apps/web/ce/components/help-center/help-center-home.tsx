/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useState } from "react";
import type { KeyboardEvent } from "react";
import { ArrowLeft } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router";
import { observer } from "mobx-react";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { useHelpCenter } from "@/plane-web/hooks/store/use-help-center";
import { ArticleList } from "./article-list";
import { CategoryGrid } from "./category-grid";
import { HelpCenterEmpty, HelpCenterError, HelpLoading } from "./help-center-states";
import { HelpCenterFeatured } from "./help-center-featured";
import { HelpSearchBox } from "./help-search-box";
import { SearchFallbackNotice } from "./locale-fallback-notice";

const SEARCH_DEBOUNCE_MS = 300;
// Vietnamese words are rarely a single character — require >=2 chars before
// firing a backend search so a stray keystroke doesn't flood the user with
// near-everything as "results".
const MIN_QUERY_LENGTH = 2;
const RESULTS_LISTBOX_ID = "help-search-results";

// Help Center home: prominent search + "get started" + category grid. A
// `?category=` deep-link shows that category's articles; `?q=` (also set by the
// header search on article pages) shows search results. observer() is required so
// a UI-locale switch (the i18n store is observable) re-renders this component and
// re-runs the locale fetches.
export const HelpCenterHome = observer(function HelpCenterHome() {
  const { t, currentLocale } = useTranslation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { category, article } = useHelpCenter();

  // `?q=` is the search source of truth so the header search can deep-link into
  // results; the local state is the typing buffer, seeded/synced from the URL.
  const urlQuery = searchParams.get("q") ?? "";
  const [query, setQuery] = useState(urlQuery);
  const [activeIndex, setActiveIndex] = useState(0);

  const categoryId = searchParams.get("category");
  const trimmed = query.trim();
  const isSearching = trimmed.length >= MIN_QUERY_LENGTH;
  const results = article.searchResults;

  // Sync the buffer when the URL query changes externally (e.g. header search).
  useEffect(() => {
    setQuery(urlQuery);
  }, [urlQuery]);

  useEffect(() => {
    void category.fetchCategories(currentLocale);
  }, [category, currentLocale]);

  useEffect(() => {
    if (categoryId) void article.fetchArticles({ category: categoryId, locale: currentLocale });
  }, [article, categoryId, currentLocale]);

  useEffect(() => {
    if (!isSearching) return;
    // clear stale results + show the loader immediately so the prior query's
    // rows/count aren't shown (mislabeled) during the debounce window
    article.beginSearch();
    const timer = window.setTimeout(() => void article.searchArticles(trimmed, currentLocale), SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [article, isSearching, trimmed, currentLocale]);

  // Keep the active result in range as the query/results change.
  useEffect(() => {
    setActiveIndex(0);
  }, [trimmed, results.length]);

  const categories = category.categoriesSorted;
  const selectCategory = (id: string) => setSearchParams({ category: id });

  // When results came back in a language other than the UI locale, the search
  // fell back to the source language — surface that so the switch is explained.
  const fallbackLocale =
    isSearching && !article.searchLoader
      ? (results.find((r) => r.matched_locale && r.matched_locale !== currentLocale)?.matched_locale ?? null)
      : null;

  // Update the buffer; when cleared, return to the all-categories view by
  // dropping BOTH ?q= and ?category= (so "browse all categories" / clear / Esc
  // never strand the user inside a single category).
  const handleQueryChange = (value: string) => {
    setQuery(value);
    if (!value.trim() && (urlQuery || categoryId)) setSearchParams({});
  };

  const handleSearchKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape") {
      handleQueryChange("");
      return;
    }
    if (!isSearching || results.length === 0) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) => Math.min(index + 1, results.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => Math.max(index - 1, 0));
    } else if (event.key === "Enter") {
      const target = results[activeIndex] ?? results[0];
      if (target) {
        event.preventDefault();
        void navigate(`/help/a/${target.slug}`);
      }
    }
  };

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold text-primary">{t("help_center.title")}</h1>
        <p className="mt-1 text-13 text-tertiary">{t("help_center.subtitle")}</p>
      </header>

      <HelpSearchBox
        value={query}
        onChange={handleQueryChange}
        onKeyDown={handleSearchKeyDown}
        controlsId={isSearching && results.length > 0 ? RESULTS_LISTBOX_ID : undefined}
        activeDescendant={isSearching && results.length > 0 ? `${RESULTS_LISTBOX_ID}-${activeIndex}` : undefined}
        hasResults={results.length > 0}
      />

      {isSearching ? (
        <section className="mt-6">
          {/* Source-fallback banner — UI locale had no match, showing the source language */}
          {fallbackLocale && <SearchFallbackNotice uiLocale={currentLocale} fallbackLocale={fallbackLocale} />}
          {/* Search results count heading — shown once results/loading resolves */}
          {!article.searchLoader && results.length > 0 && (
            <p className="mb-3 text-13 text-secondary">
              {t("help_center.search_results_count", { count: results.length })}
            </p>
          )}
          <ArticleList
            currentLocale={currentLocale}
            articles={results}
            loading={article.searchLoader}
            error={article.searchError}
            onRetry={() => void article.searchArticles(trimmed, currentLocale)}
            emptyLabel={t("help_center.no_results")}
            emptyDescription={t("help_center.no_results_hint")}
            emptyAssetKey="search"
            emptyAction={
              <Button variant="secondary" size="base" onClick={() => handleQueryChange("")}>
                {t("help_center.browse_all_categories")}
              </Button>
            }
            showMatchedLocale
            categoriesMap={category.categoriesMap}
            activeIndex={activeIndex}
            listboxId={RESULTS_LISTBOX_ID}
          />
        </section>
      ) : categoryId ? (
        <section className="mt-6">
          <button
            type="button"
            onClick={() => setSearchParams({})}
            className="mb-4 flex items-center gap-1.5 rounded text-13 text-accent-primary hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent-strong"
          >
            <ArrowLeft className="size-4" />
            {t("help_center.all_categories")}
          </button>
          {/* Category title — keeps user oriented when drilling into a category */}
          {category.categoriesMap[categoryId] && (
            <h2 className="mb-4 text-18 font-semibold text-primary">{category.categoriesMap[categoryId].name}</h2>
          )}
          <ArticleList
            currentLocale={currentLocale}
            articles={article.getArticlesByCategory(categoryId)}
            loading={article.listLoader}
            error={article.listError}
            onRetry={() => void article.fetchArticles({ category: categoryId, locale: currentLocale })}
            emptyLabel={t("help_center.no_articles_yet")}
          />
        </section>
      ) : category.error && categories.length === 0 ? (
        <HelpCenterError onRetry={() => void category.fetchCategories(currentLocale)} />
      ) : category.loader && categories.length === 0 ? (
        <HelpLoading />
      ) : categories.length === 0 ? (
        <HelpCenterEmpty title={t("help_center.no_categories_yet")} />
      ) : (
        <div className="mt-6">
          {/* Featured pins categories[0]; the grid shows the rest to avoid a duplicate. */}
          <HelpCenterFeatured category={categories[0]} onSelect={selectCategory} />
          <CategoryGrid categories={categories.slice(1)} onSelect={selectCategory} />
        </div>
      )}
    </div>
  );
});
