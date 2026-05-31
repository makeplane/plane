/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { set } from "lodash-es";
import { action, makeObservable, observable, runInAction } from "mobx";
import { computedFn } from "mobx-utils";
import type { HelpCenterService } from "@/plane-web/services/help-center.service";
import type {
  THelpArticleDetail,
  THelpArticleFilters,
  THelpArticleListItem,
  THelpLocale,
} from "@/plane-web/types/help-center";

export interface IHelpArticleStore {
  articlesMap: Record<string, THelpArticleListItem>;
  articleDetailMap: Record<string, THelpArticleDetail>;
  searchResults: THelpArticleListItem[];
  listLoader: boolean;
  detailLoader: boolean;
  searchLoader: boolean;
  listError: boolean;
  searchError: boolean;
  getArticlesByCategory: (categoryId: string) => THelpArticleListItem[];
  getArticleDetailBySlug: (slug: string) => THelpArticleDetail | null;
  fetchArticles: (filters: THelpArticleFilters) => Promise<THelpArticleListItem[]>;
  fetchArticleById: (articleId: string, locale: THelpLocale) => Promise<THelpArticleDetail>;
  fetchArticleBySlug: (slug: string, locale: THelpLocale) => Promise<THelpArticleDetail>;
  beginSearch: () => void;
  searchArticles: (query: string, locale: THelpLocale) => Promise<THelpArticleListItem[]>;
}

export class HelpArticleStore implements IHelpArticleStore {
  articlesMap: Record<string, THelpArticleListItem> = {};
  articleDetailMap: Record<string, THelpArticleDetail> = {};
  searchResults: THelpArticleListItem[] = [];
  listLoader = false;
  detailLoader = false;
  searchLoader = false;
  // Per-surface fetch-failure flags so the list / search UI can offer a retry
  // instead of rendering a failed request as an empty result set.
  listError = false;
  searchError = false;

  constructor(private service: HelpCenterService) {
    makeObservable(this, {
      articlesMap: observable,
      articleDetailMap: observable,
      searchResults: observable,
      listLoader: observable,
      detailLoader: observable,
      searchLoader: observable,
      listError: observable,
      searchError: observable,
      beginSearch: action,
      fetchArticles: action,
      fetchArticleById: action,
      fetchArticleBySlug: action,
      searchArticles: action,
    });
  }

  getArticlesByCategory = computedFn((categoryId: string) =>
    Object.values(this.articlesMap)
      .filter((article) => article.category === categoryId)
      .sort((a, b) => a.sort_order - b.sort_order)
  );

  getArticleDetailBySlug = computedFn(
    (slug: string) => Object.values(this.articleDetailMap).find((article) => article.slug === slug) ?? null
  );

  fetchArticles = async (filters: THelpArticleFilters) => {
    this.listLoader = true;
    runInAction(() => {
      this.listError = false;
    });
    try {
      const response = await this.service.fetchArticles(filters);
      runInAction(() => response.forEach((article) => set(this.articlesMap, [article.id], article)));
      return response;
    } catch (error) {
      runInAction(() => {
        this.listError = true;
      });
      throw error;
    } finally {
      runInAction(() => {
        this.listLoader = false;
      });
    }
  };

  fetchArticleById = async (articleId: string, locale: THelpLocale) => {
    this.detailLoader = true;
    try {
      const article = await this.service.fetchArticleById(articleId, locale);
      runInAction(() => set(this.articleDetailMap, [article.id], article));
      return article;
    } finally {
      runInAction(() => {
        this.detailLoader = false;
      });
    }
  };

  fetchArticleBySlug = async (slug: string, locale: THelpLocale) => {
    this.detailLoader = true;
    try {
      const article = await this.service.fetchArticleBySlug(slug, locale);
      runInAction(() => set(this.articleDetailMap, [article.id], article));
      return article;
    } finally {
      runInAction(() => {
        this.detailLoader = false;
      });
    }
  };

  // Mark a search as pending immediately (before the debounce fires) so the UI
  // shows a loader instead of the previous query's stale results/count.
  beginSearch = () => {
    this.searchLoader = true;
    this.searchError = false;
    this.searchResults = [];
  };

  searchArticles = async (query: string, locale: THelpLocale) => {
    this.searchLoader = true;
    runInAction(() => {
      this.searchError = false;
    });
    try {
      const response = await this.service.fetchArticles({ search: query, locale });
      runInAction(() => {
        this.searchResults = response;
      });
      return response;
    } catch (error) {
      runInAction(() => {
        this.searchError = true;
      });
      throw error;
    } finally {
      runInAction(() => {
        this.searchLoader = false;
      });
    }
  };
}
