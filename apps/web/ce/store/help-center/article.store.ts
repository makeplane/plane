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
  getArticlesByCategory: (categoryId: string) => THelpArticleListItem[];
  fetchArticles: (filters: THelpArticleFilters) => Promise<THelpArticleListItem[]>;
  fetchArticleById: (articleId: string, locale: THelpLocale) => Promise<THelpArticleDetail>;
  searchArticles: (query: string, locale: THelpLocale) => Promise<THelpArticleListItem[]>;
}

export class HelpArticleStore implements IHelpArticleStore {
  articlesMap: Record<string, THelpArticleListItem> = {};
  articleDetailMap: Record<string, THelpArticleDetail> = {};
  searchResults: THelpArticleListItem[] = [];
  listLoader = false;
  detailLoader = false;
  searchLoader = false;

  constructor(private service: HelpCenterService) {
    makeObservable(this, {
      articlesMap: observable,
      articleDetailMap: observable,
      searchResults: observable,
      listLoader: observable,
      detailLoader: observable,
      searchLoader: observable,
      fetchArticles: action,
      fetchArticleById: action,
      searchArticles: action,
    });
  }

  getArticlesByCategory = computedFn((categoryId: string) =>
    Object.values(this.articlesMap)
      .filter((article) => article.category === categoryId)
      .sort((a, b) => a.sort_order - b.sort_order)
  );

  fetchArticles = async (filters: THelpArticleFilters) => {
    this.listLoader = true;
    try {
      const response = await this.service.fetchArticles(filters);
      runInAction(() => response.forEach((article) => set(this.articlesMap, [article.id], article)));
      return response;
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

  searchArticles = async (query: string, locale: THelpLocale) => {
    this.searchLoader = true;
    try {
      const response = await this.service.fetchArticles({ search: query, locale });
      runInAction(() => {
        this.searchResults = response;
      });
      return response;
    } finally {
      runInAction(() => {
        this.searchLoader = false;
      });
    }
  };
}
