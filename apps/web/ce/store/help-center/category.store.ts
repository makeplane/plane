/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { set } from "lodash-es";
import { action, computed, makeObservable, observable, runInAction } from "mobx";
import type { HelpCenterService } from "@/plane-web/services/help-center.service";
import type { THelpCategory, THelpCategoryPayload, THelpLocale } from "@/plane-web/types/help-center";

// Place a row between two neighbours (mirrors label.store updateLabelPosition):
// midpoint, half the next, or +10000 past the previous.
export const computeSortOrder = (prev?: number, next?: number): number => {
  if (prev != null && next != null) return (prev + next) / 2;
  if (next != null) return next / 2;
  if (prev != null) return prev + 10000;
  return 65535;
};

export interface IHelpCategoryStore {
  categoriesMap: Record<string, THelpCategory>;
  loader: boolean;
  categoriesSorted: THelpCategory[];
  fetchCategories: (workspaceSlug: string, locale: THelpLocale) => Promise<THelpCategory[]>;
  createCategory: (workspaceSlug: string, data: THelpCategoryPayload) => Promise<THelpCategory>;
  updateCategory: (workspaceSlug: string, categoryId: string, data: THelpCategoryPayload) => Promise<THelpCategory>;
  deleteCategory: (workspaceSlug: string, categoryId: string) => Promise<void>;
  reorderCategory: (
    workspaceSlug: string,
    categoryId: string,
    prevSortOrder?: number,
    nextSortOrder?: number
  ) => Promise<THelpCategory>;
}

export class HelpCategoryStore implements IHelpCategoryStore {
  categoriesMap: Record<string, THelpCategory> = {};
  loader = false;

  constructor(private service: HelpCenterService) {
    makeObservable(this, {
      categoriesMap: observable,
      loader: observable,
      categoriesSorted: computed,
      fetchCategories: action,
      createCategory: action,
      updateCategory: action,
      deleteCategory: action,
      reorderCategory: action,
    });
  }

  get categoriesSorted() {
    return Object.values(this.categoriesMap).sort((a, b) => a.sort_order - b.sort_order);
  }

  fetchCategories = async (workspaceSlug: string, locale: THelpLocale) => {
    this.loader = true;
    try {
      const response = await this.service.fetchCategories(workspaceSlug, locale);
      runInAction(() => {
        this.categoriesMap = {};
        response.forEach((category) => set(this.categoriesMap, [category.id], category));
      });
      return response;
    } finally {
      runInAction(() => {
        this.loader = false;
      });
    }
  };

  createCategory = async (workspaceSlug: string, data: THelpCategoryPayload) => {
    const category = await this.service.createCategory(workspaceSlug, data);
    runInAction(() => set(this.categoriesMap, [category.id], category));
    return category;
  };

  updateCategory = async (workspaceSlug: string, categoryId: string, data: THelpCategoryPayload) => {
    const category = await this.service.updateCategory(workspaceSlug, categoryId, data);
    runInAction(() => set(this.categoriesMap, [category.id], category));
    return category;
  };

  deleteCategory = async (workspaceSlug: string, categoryId: string) => {
    await this.service.deleteCategory(workspaceSlug, categoryId);
    runInAction(() => {
      delete this.categoriesMap[categoryId];
    });
  };

  reorderCategory = (workspaceSlug: string, categoryId: string, prevSortOrder?: number, nextSortOrder?: number) =>
    this.updateCategory(workspaceSlug, categoryId, { sort_order: computeSortOrder(prevSortOrder, nextSortOrder) });
}
