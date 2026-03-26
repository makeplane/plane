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
  TLoader,
} from "@plane/types";
// root store
import type { RootStore } from "@/store/root.store";

export interface IInstanceTaskCategoryStore {
  // observables
  loader: TLoader;
  mainCategories: Record<string, IMainTaskCategory>;
  subCategories: Record<string, ISubTaskCategory>;
  // computed
  mainCategoryIds: string[];
  // actions
  getSubCategoriesByMain: (mainId: string) => ISubTaskCategory[];
  fetchMainCategories: () => Promise<IMainTaskCategory[]>;
  fetchSubCategories: () => Promise<ISubTaskCategory[]>;
  createMainCategory: (data: IMainTaskCategoryCreate) => Promise<IMainTaskCategory>;
  updateMainCategory: (id: string, data: IMainTaskCategoryUpdate) => Promise<IMainTaskCategory>;
  deleteMainCategory: (id: string) => Promise<void>;
  createSubCategory: (data: ISubTaskCategoryCreate) => Promise<ISubTaskCategory>;
  updateSubCategory: (id: string, data: ISubTaskCategoryUpdate) => Promise<ISubTaskCategory>;
  deleteSubCategory: (id: string) => Promise<void>;
}

export class InstanceTaskCategoryStore implements IInstanceTaskCategoryStore {
  // observables
  loader: TLoader = "init-loader";
  mainCategories: Record<string, IMainTaskCategory> = {};
  subCategories: Record<string, ISubTaskCategory> = {};

  private service: TaskCategoryService;

  constructor(_store: RootStore) {
    makeObservable(this, {
      loader: observable,
      mainCategories: observable,
      subCategories: observable,
      // computed
      mainCategoryIds: computed,
      // actions
      fetchMainCategories: action,
      fetchSubCategories: action,
      createMainCategory: action,
      updateMainCategory: action,
      deleteMainCategory: action,
      createSubCategory: action,
      updateSubCategory: action,
      deleteSubCategory: action,
    });
    this.service = new TaskCategoryService();
  }

  get mainCategoryIds(): string[] {
    return Object.values(this.mainCategories)
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((c) => c.id);
  }

  getSubCategoriesByMain = (mainId: string): ISubTaskCategory[] => {
    return Object.values(this.subCategories).filter((s) => s.main_category === mainId);
  };

  fetchMainCategories = async (): Promise<IMainTaskCategory[]> => {
    try {
      this.loader = Object.keys(this.mainCategories).length > 0 ? "mutation" : "init-loader";
      const data = await this.service.listMain();
      runInAction(() => {
        this.mainCategories = {};
        data.forEach((cat) => {
          set(this.mainCategories, [cat.id], cat);
        });
      });
      return data;
    } catch (error) {
      console.error("Error fetching main task categories", error);
      throw error;
    } finally {
      runInAction(() => {
        this.loader = "loaded";
      });
    }
  };

  fetchSubCategories = async (): Promise<ISubTaskCategory[]> => {
    try {
      const data = await this.service.listSub();
      runInAction(() => {
        this.subCategories = {};
        data.forEach((cat) => {
          set(this.subCategories, [cat.id], cat);
        });
      });
      return data;
    } catch (error) {
      console.error("Error fetching sub task categories", error);
      throw error;
    }
  };

  createMainCategory = async (data: IMainTaskCategoryCreate): Promise<IMainTaskCategory> => {
    try {
      this.loader = "mutation";
      const cat = await this.service.createMain(data);
      runInAction(() => {
        set(this.mainCategories, [cat.id], cat);
      });
      return cat;
    } catch (error) {
      console.error("Error creating main task category", error);
      throw error;
    } finally {
      runInAction(() => {
        this.loader = "loaded";
      });
    }
  };

  updateMainCategory = async (id: string, data: IMainTaskCategoryUpdate): Promise<IMainTaskCategory> => {
    try {
      const cat = await this.service.updateMain(id, data);
      runInAction(() => {
        set(this.mainCategories, [cat.id], cat);
      });
      return cat;
    } catch (error) {
      console.error("Error updating main task category", error);
      throw error;
    }
  };

  deleteMainCategory = async (id: string): Promise<void> => {
    try {
      await this.service.deleteMain(id);
      runInAction(() => {
        delete this.mainCategories[id];
        // also remove orphaned sub-categories
        Object.keys(this.subCategories).forEach((subId) => {
          if (this.subCategories[subId].main_category === id) {
            delete this.subCategories[subId];
          }
        });
      });
    } catch (error) {
      console.error("Error deleting main task category", error);
      throw error;
    }
  };

  createSubCategory = async (data: ISubTaskCategoryCreate): Promise<ISubTaskCategory> => {
    try {
      this.loader = "mutation";
      const cat = await this.service.createSub(data);
      runInAction(() => {
        set(this.subCategories, [cat.id], cat);
      });
      return cat;
    } catch (error) {
      console.error("Error creating sub task category", error);
      throw error;
    } finally {
      runInAction(() => {
        this.loader = "loaded";
      });
    }
  };

  updateSubCategory = async (id: string, data: ISubTaskCategoryUpdate): Promise<ISubTaskCategory> => {
    try {
      const cat = await this.service.updateSub(id, data);
      runInAction(() => {
        set(this.subCategories, [cat.id], cat);
      });
      return cat;
    } catch (error) {
      console.error("Error updating sub task category", error);
      throw error;
    }
  };

  deleteSubCategory = async (id: string): Promise<void> => {
    try {
      await this.service.deleteSub(id);
      runInAction(() => {
        delete this.subCategories[id];
      });
    } catch (error) {
      console.error("Error deleting sub task category", error);
      throw error;
    }
  };
}
