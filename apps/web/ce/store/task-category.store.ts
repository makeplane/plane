import { action, computed, makeObservable, observable, runInAction } from "mobx";
// types
import type { IMainTaskCategory, ISubTaskCategory, TLoader } from "@plane/types";
// service
import { TaskCategoryService } from "@plane/services";

export interface ITaskCategoryStore {
  // observables
  loader: TLoader;
  hasFetched: boolean;
  fetchedWorkspaceSlug: string | undefined;
  mainCategories: Record<string, IMainTaskCategory>;
  subCategories: Record<string, ISubTaskCategory>;
  // computed
  mainCategoryIds: string[];
  // actions
  getSubCategoriesByMain: (mainId: string) => ISubTaskCategory[];
  fetchCategories: (workspaceSlug: string) => Promise<void>;
}

export class TaskCategoryStore implements ITaskCategoryStore {
  // observables
  loader: TLoader = undefined;
  hasFetched: boolean = false;
  fetchedWorkspaceSlug: string | undefined = undefined;
  mainCategories: Record<string, IMainTaskCategory> = {};
  subCategories: Record<string, ISubTaskCategory> = {};

  // service
  private service: TaskCategoryService;

  constructor() {
    this.service = new TaskCategoryService();

    makeObservable(this, {
      loader: observable,
      hasFetched: observable,
      fetchedWorkspaceSlug: observable,
      mainCategories: observable,
      subCategories: observable,
      // computed
      mainCategoryIds: computed,
      // actions
      fetchCategories: action,
    });
  }

  /** Returns active main category IDs sorted by sort_order. */
  get mainCategoryIds(): string[] {
    return Object.values(this.mainCategories)
      .filter((c) => c.is_active)
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((c) => c.id);
  }

  /** Returns active sub-categories for a given main category. */
  getSubCategoriesByMain = (mainId: string): ISubTaskCategory[] => {
    return Object.values(this.subCategories).filter((s) => s.is_active && s.main_category === mainId);
  };

  /** Fetch main and sub categories. Re-fetches when workspace changes. */
  fetchCategories = async (workspaceSlug: string): Promise<void> => {
    if (this.hasFetched && this.fetchedWorkspaceSlug === workspaceSlug) return;

    runInAction(() => {
      this.loader = "init-loader";
    });

    try {
      const [mainList, subList] = await Promise.all([
        this.service.listMainForWorkspace(workspaceSlug),
        this.service.listSubForWorkspace(workspaceSlug),
      ]);

      runInAction(() => {
        this.mainCategories = Object.fromEntries(mainList.map((c) => [c.id, c]));
        this.subCategories = Object.fromEntries(subList.map((s) => [s.id, s]));
        this.loader = "loaded";
        this.hasFetched = true;
        this.fetchedWorkspaceSlug = workspaceSlug;
      });
    } catch {
      runInAction(() => {
        this.loader = undefined;
        this.hasFetched = true; // prevent infinite retry
        this.fetchedWorkspaceSlug = workspaceSlug;
      });
    }
  };
}
