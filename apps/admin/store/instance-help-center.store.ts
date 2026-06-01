/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { set } from "lodash-es";
import { action, computed, makeObservable, observable, runInAction } from "mobx";
import { InstanceHelpCenterService } from "@plane/services";
import type {
  IHelpArticle,
  IHelpArticleCreate,
  IHelpArticleTranslationUpsert,
  IHelpArticleUpdate,
  IHelpCategory,
  IHelpCategoryCreate,
  IHelpCategoryUpdate,
  THelpBundleImportResult,
  THelpLocale,
  TLoader,
} from "@plane/types";

export interface IInstanceHelpCenterStore {
  // observables
  loader: TLoader;
  hasFetched: boolean;
  categories: Record<string, IHelpCategory>;
  articles: Record<string, IHelpArticle>;
  // computed
  categoryIds: string[];
  // getters
  getArticlesByCategory: (categoryId: string | null) => IHelpArticle[];
  getArticleById: (id: string) => IHelpArticle | undefined;
  // actions
  fetchAll: () => Promise<void>;
  createCategory: (data: IHelpCategoryCreate) => Promise<IHelpCategory>;
  updateCategory: (id: string, data: IHelpCategoryUpdate) => Promise<IHelpCategory>;
  deleteCategory: (id: string) => Promise<void>;
  createArticle: (data: IHelpArticleCreate) => Promise<IHelpArticle>;
  updateArticle: (id: string, data: IHelpArticleUpdate) => Promise<IHelpArticle>;
  deleteArticle: (id: string) => Promise<void>;
  upsertTranslation: (
    articleId: string,
    locale: THelpLocale,
    data: IHelpArticleTranslationUpsert
  ) => Promise<IHelpArticle>;
  uploadArticleImage: (articleId: string, file: File) => Promise<string>;
  exportBundle: () => Promise<Blob>;
  importBundle: (file: File) => Promise<THelpBundleImportResult>;
}

const bySortOrder = (a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order;

export class InstanceHelpCenterStore implements IInstanceHelpCenterStore {
  loader: TLoader = undefined;
  hasFetched: boolean = false;
  categories: Record<string, IHelpCategory> = {};
  articles: Record<string, IHelpArticle> = {};

  private service: InstanceHelpCenterService;

  constructor() {
    this.service = new InstanceHelpCenterService();

    makeObservable(this, {
      loader: observable,
      hasFetched: observable,
      categories: observable,
      articles: observable,
      categoryIds: computed,
      fetchAll: action,
      createCategory: action,
      updateCategory: action,
      deleteCategory: action,
      createArticle: action,
      updateArticle: action,
      deleteArticle: action,
      upsertTranslation: action,
      uploadArticleImage: action,
      exportBundle: action,
      importBundle: action,
    });
  }

  get categoryIds(): string[] {
    return Object.values(this.categories)
      .sort(bySortOrder)
      .map((c) => c.id);
  }

  getArticlesByCategory = (categoryId: string | null): IHelpArticle[] =>
    Object.values(this.articles)
      .filter((a) => (categoryId ? a.category === categoryId : !a.category))
      .sort(bySortOrder);

  getArticleById = (id: string): IHelpArticle | undefined => this.articles[id];

  fetchAll = async (): Promise<void> => {
    this.loader = "init-loader";
    try {
      const [categories, articles] = await Promise.all([this.service.listCategories(), this.service.listArticles()]);
      runInAction(() => {
        this.categories = {};
        this.articles = {};
        categories.forEach((c) => set(this.categories, c.id, c));
        articles.forEach((a) => set(this.articles, a.id, a));
        this.hasFetched = true;
      });
    } finally {
      runInAction(() => {
        this.loader = undefined;
      });
    }
  };

  createCategory = async (data: IHelpCategoryCreate): Promise<IHelpCategory> => {
    const created = await this.service.createCategory(data);
    runInAction(() => set(this.categories, created.id, created));
    return created;
  };

  updateCategory = async (id: string, data: IHelpCategoryUpdate): Promise<IHelpCategory> => {
    const updated = await this.service.updateCategory(id, data);
    runInAction(() => set(this.categories, id, updated));
    return updated;
  };

  deleteCategory = async (id: string): Promise<void> => {
    await this.service.deleteCategory(id);
    runInAction(() => {
      delete this.categories[id];
    });
  };

  createArticle = async (data: IHelpArticleCreate): Promise<IHelpArticle> => {
    const created = await this.service.createArticle(data);
    runInAction(() => set(this.articles, created.id, created));
    return created;
  };

  updateArticle = async (id: string, data: IHelpArticleUpdate): Promise<IHelpArticle> => {
    const updated = await this.service.updateArticle(id, data);
    runInAction(() => set(this.articles, id, updated));
    return updated;
  };

  deleteArticle = async (id: string): Promise<void> => {
    await this.service.deleteArticle(id);
    runInAction(() => {
      delete this.articles[id];
    });
  };

  upsertTranslation = async (
    articleId: string,
    locale: THelpLocale,
    data: IHelpArticleTranslationUpsert
  ): Promise<IHelpArticle> => {
    const updated = await this.service.upsertTranslation(articleId, locale, data);
    runInAction(() => set(this.articles, articleId, updated));
    return updated;
  };

  uploadArticleImage = async (articleId: string, file: File): Promise<string> =>
    this.service.uploadArticleImage(articleId, file);

  exportBundle = async (): Promise<Blob> => this.service.exportBundle();

  importBundle = async (file: File): Promise<THelpBundleImportResult> => {
    this.loader = "mutation";
    try {
      const result = await this.service.importBundle(file);
      await this.fetchAll();
      return result;
    } finally {
      runInAction(() => {
        this.loader = undefined;
      });
    }
  };
}
