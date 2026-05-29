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
  THelpArticlePayload,
  THelpArticleTranslation,
  THelpLocale,
} from "@/plane-web/types/help-center";
import { computeSortOrder } from "./category.store";

// Content is non-empty when, after stripping tags + whitespace, anything remains.
const hasContent = (html?: string) => !!html && html.replace(/<[^>]*>/g, "").trim() !== "";

export interface IHelpArticleStore {
  articlesMap: Record<string, THelpArticleListItem>;
  articleDetailMap: Record<string, THelpArticleDetail>;
  searchResults: THelpArticleListItem[];
  translationDraftsMap: Record<string, Partial<Record<THelpLocale, THelpArticleTranslation>>>;
  listLoader: boolean;
  detailLoader: boolean;
  searchLoader: boolean;
  getArticlesByCategory: (categoryId: string) => THelpArticleListItem[];
  fetchArticles: (workspaceSlug: string, filters: THelpArticleFilters) => Promise<THelpArticleListItem[]>;
  fetchArticleById: (workspaceSlug: string, articleId: string, locale: THelpLocale) => Promise<THelpArticleDetail>;
  searchArticles: (workspaceSlug: string, query: string, locale: THelpLocale) => Promise<THelpArticleListItem[]>;
  createArticle: (workspaceSlug: string, data: THelpArticlePayload) => Promise<THelpArticleDetail>;
  updateArticle: (workspaceSlug: string, articleId: string, data: THelpArticlePayload) => Promise<THelpArticleDetail>;
  deleteArticle: (workspaceSlug: string, articleId: string) => Promise<void>;
  upsertTranslation: (
    workspaceSlug: string,
    articleId: string,
    locale: THelpLocale,
    payload: Partial<THelpArticleTranslation>
  ) => Promise<THelpArticleDetail>;
  reorderArticle: (
    workspaceSlug: string,
    articleId: string,
    prevSortOrder?: number,
    nextSortOrder?: number
  ) => Promise<THelpArticleDetail>;
  setTranslationDraft: (articleId: string, locale: THelpLocale, draft: THelpArticleTranslation) => void;
  copyLocaleContent: (articleId: string, fromLocale: THelpLocale, toLocale: THelpLocale) => void;
}

export class HelpArticleStore implements IHelpArticleStore {
  articlesMap: Record<string, THelpArticleListItem> = {};
  articleDetailMap: Record<string, THelpArticleDetail> = {};
  searchResults: THelpArticleListItem[] = [];
  translationDraftsMap: Record<string, Partial<Record<THelpLocale, THelpArticleTranslation>>> = {};
  listLoader = false;
  detailLoader = false;
  searchLoader = false;

  constructor(private service: HelpCenterService) {
    makeObservable(this, {
      articlesMap: observable,
      articleDetailMap: observable,
      searchResults: observable,
      translationDraftsMap: observable,
      listLoader: observable,
      detailLoader: observable,
      searchLoader: observable,
      fetchArticles: action,
      fetchArticleById: action,
      searchArticles: action,
      createArticle: action,
      updateArticle: action,
      deleteArticle: action,
      upsertTranslation: action,
      reorderArticle: action,
      setTranslationDraft: action,
      copyLocaleContent: action,
    });
  }

  getArticlesByCategory = computedFn((categoryId: string) =>
    Object.values(this.articlesMap)
      .filter((article) => article.category === categoryId)
      .sort((a, b) => a.sort_order - b.sort_order)
  );

  fetchArticles = async (workspaceSlug: string, filters: THelpArticleFilters) => {
    this.listLoader = true;
    try {
      const response = await this.service.fetchArticles(workspaceSlug, filters);
      runInAction(() => response.forEach((article) => set(this.articlesMap, [article.id], article)));
      return response;
    } finally {
      runInAction(() => {
        this.listLoader = false;
      });
    }
  };

  fetchArticleById = async (workspaceSlug: string, articleId: string, locale: THelpLocale) => {
    this.detailLoader = true;
    try {
      const article = await this.service.fetchArticleById(workspaceSlug, articleId, locale);
      runInAction(() => set(this.articleDetailMap, [article.id], article));
      return article;
    } finally {
      runInAction(() => {
        this.detailLoader = false;
      });
    }
  };

  searchArticles = async (workspaceSlug: string, query: string, locale: THelpLocale) => {
    this.searchLoader = true;
    try {
      const response = await this.service.fetchArticles(workspaceSlug, { search: query, locale });
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

  createArticle = async (workspaceSlug: string, data: THelpArticlePayload) => {
    const article = await this.service.createArticle(workspaceSlug, data);
    runInAction(() => set(this.articleDetailMap, [article.id], article));
    return article;
  };

  updateArticle = async (workspaceSlug: string, articleId: string, data: THelpArticlePayload) => {
    const article = await this.service.updateArticle(workspaceSlug, articleId, data);
    runInAction(() => {
      set(this.articleDetailMap, [article.id], article);
      if (this.articlesMap[article.id])
        set(this.articlesMap, [article.id], { ...this.articlesMap[article.id], ...article });
    });
    return article;
  };

  deleteArticle = async (workspaceSlug: string, articleId: string) => {
    await this.service.deleteArticle(workspaceSlug, articleId);
    runInAction(() => {
      delete this.articlesMap[articleId];
      delete this.articleDetailMap[articleId];
    });
  };

  upsertTranslation = async (
    workspaceSlug: string,
    articleId: string,
    locale: THelpLocale,
    payload: Partial<THelpArticleTranslation>
  ) => {
    const article = await this.service.upsertTranslation(workspaceSlug, articleId, locale, payload);
    runInAction(() => set(this.articleDetailMap, [article.id], article));
    return article;
  };

  reorderArticle = (workspaceSlug: string, articleId: string, prevSortOrder?: number, nextSortOrder?: number) =>
    this.updateArticle(workspaceSlug, articleId, { sort_order: computeSortOrder(prevSortOrder, nextSortOrder) });

  setTranslationDraft = (articleId: string, locale: THelpLocale, draft: THelpArticleTranslation) => {
    runInAction(() => set(this.translationDraftsMap, [articleId, locale], draft));
  };

  // Client-side seed of an empty locale from a filled sibling (D4 copy-between-
  // locales). No-op if the source is absent or the target already has content.
  copyLocaleContent = (articleId: string, fromLocale: THelpLocale, toLocale: THelpLocale) => {
    const drafts = this.translationDraftsMap[articleId];
    const source = drafts?.[fromLocale];
    if (!source) return;
    if (hasContent(drafts?.[toLocale]?.description_html)) return;
    runInAction(() =>
      set(this.translationDraftsMap, [articleId, toLocale], {
        locale: toLocale,
        title: source.title,
        description_html: source.description_html,
        description_json: source.description_json,
      })
    );
  };
}
