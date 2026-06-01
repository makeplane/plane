/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { set } from "lodash-es";
import { action, computed, makeObservable, observable, runInAction } from "mobx";
import type { HelpCenterService } from "@/plane-web/services/help-center.service";
import type { THelpCategory, THelpLocale } from "@/plane-web/types/help-center";

export interface IHelpCategoryStore {
  categoriesMap: Record<string, THelpCategory>;
  loader: boolean;
  error: boolean;
  categoriesSorted: THelpCategory[];
  fetchCategories: (locale: THelpLocale) => Promise<THelpCategory[]>;
}

export class HelpCategoryStore implements IHelpCategoryStore {
  categoriesMap: Record<string, THelpCategory> = {};
  loader = false;
  // True when the last fetch rejected — lets the UI show a retry state instead
  // of masking an outage as an empty "no categories yet".
  error = false;

  constructor(private service: HelpCenterService) {
    makeObservable(this, {
      categoriesMap: observable,
      loader: observable,
      error: observable,
      categoriesSorted: computed,
      fetchCategories: action,
    });
  }

  get categoriesSorted() {
    return Object.values(this.categoriesMap).sort((a, b) => a.sort_order - b.sort_order);
  }

  fetchCategories = async (locale: THelpLocale) => {
    this.loader = true;
    runInAction(() => {
      this.error = false;
    });
    try {
      const response = await this.service.fetchCategories(locale);
      runInAction(() => {
        this.categoriesMap = {};
        response.forEach((category) => set(this.categoriesMap, [category.id], category));
      });
      return response;
    } catch (error) {
      runInAction(() => {
        this.error = true;
      });
      throw error;
    } finally {
      runInAction(() => {
        this.loader = false;
      });
    }
  };
}
