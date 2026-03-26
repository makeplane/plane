/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { set } from "lodash-es";
import { action, computed, makeObservable, observable, runInAction } from "mobx";
import { TaskCategoryService } from "@plane/services";
import type {
  IMainTaskCategory,
  IMainTaskCategoryCreate,
  IMainTaskCategoryUpdate,
  ISubTaskCategory,
  ISubTaskCategoryCreate,
  ISubTaskCategoryUpdate,
} from "@plane/types";
import type { TLoader } from "@plane/types";

export interface IInstanceTaskCategoryStore {
  // observables
  loader: TLoader;
  hasFetched: boolean;
  mainCategories: Record<string, IMainTaskCategory>;
  subCategories: Record<string, ISubTaskCategory>;
  // computed
  mainCategoryIds: string[];
  // actions
  getSubCategoriesByMain: (mainId: string) => ISubTaskCategory[];
  fetchCategories: () => Promise<void>;
  createMainCategory: (data: IMainTaskCategoryCreate) => Promise<IMainTaskCategory>;
  updateMainCategory: (id: string, data: IMainTaskCategoryUpdate) => Promise<IMainTaskCategory>;
  deleteMainCategory: (id: string) => Promise<void>;
  createSubCategory: (data: ISubTaskCategoryCreate) => Promise<ISubTaskCategory>;
  updateSubCategory: (id: string, data: ISubTaskCategoryUpdate) => Promise<ISubTaskCategory>;
  deleteSubCategory: (id: string) => Promise<void>;
}

export class InstanceTaskCategoryStore implements IInstanceTaskCategoryStore {
  loader: TLoader = undefined;
  hasFetched: boolean = false;
  mainCategories: Record<string, IMainTaskCategory> = {};
  subCategories: Record<string, ISubTaskCategory> = {};

  private service: TaskCategoryService;

  constructor() {
    this.service = new TaskCategoryService();

    makeObservable(this, {
      loader: observable,
      hasFetched: observable,
      mainCategories: observable,
      subCategories: observable,
      mainCategoryIds: computed,
      fetchCategories: action,
      createMainCategory: action,
      updateMainCategory: action,
      deleteMainCategory: action,
      createSubCategory: action,
      updateSubCategory: action,
      deleteSubCategory: action,
    });
  }

  get mainCategoryIds(): string[] {
    return Object.keys(this.mainCategories);
  }

  getSubCategoriesByMain = (mainId: string): ISubTaskCategory[] =>
    Object.values(this.subCategories).filter((s) => s.main_category === mainId);

  fetchCategories = async (): Promise<void> => {
    this.loader = "init-loader";
    try {
      const [mains, subs] = await Promise.all([this.service.listMain(), this.service.listSub()]);
      runInAction(() => {
        mains.forEach((m) => set(this.mainCategories, m.id, m));
        subs.forEach((s) => set(this.subCategories, s.id, s));
        this.hasFetched = true;
      });
    } finally {
      runInAction(() => {
        this.loader = undefined;
      });
    }
  };

  createMainCategory = async (data: IMainTaskCategoryCreate): Promise<IMainTaskCategory> => {
    const created = await this.service.createMain(data);
    runInAction(() => {
      set(this.mainCategories, created.id, created);
    });
    return created;
  };

  updateMainCategory = async (id: string, data: IMainTaskCategoryUpdate): Promise<IMainTaskCategory> => {
    const updated = await this.service.updateMain(id, data);
    runInAction(() => {
      set(this.mainCategories, id, updated);
    });
    return updated;
  };

  deleteMainCategory = async (id: string): Promise<void> => {
    await this.service.deleteMain(id);
    runInAction(() => {
      delete this.mainCategories[id];
    });
  };

  createSubCategory = async (data: ISubTaskCategoryCreate): Promise<ISubTaskCategory> => {
    const created = await this.service.createSub(data);
    runInAction(() => {
      set(this.subCategories, created.id, created);
    });
    return created;
  };

  updateSubCategory = async (id: string, data: ISubTaskCategoryUpdate): Promise<ISubTaskCategory> => {
    const updated = await this.service.updateSub(id, data);
    runInAction(() => {
      set(this.subCategories, id, updated);
    });
    return updated;
  };

  deleteSubCategory = async (id: string): Promise<void> => {
    await this.service.deleteSub(id);
    runInAction(() => {
      delete this.subCategories[id];
    });
  };
}
