import { action, computed, observable, makeObservable, runInAction, reaction } from "mobx";
import { computedFn } from "mobx-utils";
import set from "lodash/set";
// types
import { RootStore } from "@/store/root.store";
import { TCycleDisplayFilters, TCycleFilters } from "@plane/types";

export interface ICycleFilterStore {
  // observables
  displayFilters: Record<string, TCycleDisplayFilters>;
  filters: Record<string, TCycleFilters>;
  searchQuery: string;
  // computed
  currentProjectDisplayFilters: TCycleDisplayFilters | undefined;
  currentProjectFilters: TCycleFilters | undefined;
  // computed functions
  getDisplayFiltersByProjectId: (projectId: string) => TCycleDisplayFilters | undefined;
  getFiltersByProjectId: (projectId: string) => TCycleFilters | undefined;
  // actions
  updateDisplayFilters: (projectId: string, displayFilters: TCycleDisplayFilters) => void;
  updateFilters: (projectId: string, filters: TCycleFilters) => void;
  updateSearchQuery: (query: string) => void;
  clearAllFilters: (projectId: string) => void;
}

export class CycleFilterStore implements ICycleFilterStore {
  // observables
  displayFilters: Record<string, TCycleDisplayFilters> = {};
  filters: Record<string, TCycleFilters> = {};
  searchQuery: string = "";
  // root store
  rootStore: RootStore;

  constructor(_rootStore: RootStore) {
    makeObservable(this, {
      // observables
      displayFilters: observable,
      filters: observable,
      searchQuery: observable.ref,
      // computed
      currentProjectDisplayFilters: computed,
      currentProjectFilters: computed,
      // actions
      updateDisplayFilters: action,
      updateFilters: action,
      updateSearchQuery: action,
      clearAllFilters: action,
    });
    // root store
    this.rootStore = _rootStore;
    // initialize display filters of the current project
    reaction(
      () => this.rootStore.app.router.projectId,
      (projectId) => {
        if (!projectId) return;
        this.initProjectCycleFilters(projectId);
      }
    );
  }

  /**
   * @description get display filters of the current project
   */
  get currentProjectDisplayFilters() {
    const projectId = this.rootStore.app.router.projectId;
    if (!projectId) return;
    return this.displayFilters[projectId];
  }

  /**
   * @description get filters of the current project
   */
  get currentProjectFilters() {
    const projectId = this.rootStore.app.router.projectId;
    if (!projectId) return;
    return this.filters[projectId];
  }

  /**
   * @description get display filters of a project by projectId
   * @param {string} projectId
   */
  getDisplayFiltersByProjectId = computedFn((projectId: string) => this.displayFilters[projectId]);

  /**
   * @description get filters of a project by projectId
   * @param {string} projectId
   */
  getFiltersByProjectId = computedFn((projectId: string) => this.filters[projectId]);

  /**
   * @description initialize display filters and filters of a project
   * @param {string} projectId
   */
  initProjectCycleFilters = (projectId: string) => {
    const displayFilters = this.getDisplayFiltersByProjectId(projectId);
    runInAction(() => {
      this.displayFilters[projectId] = {
        active_tab: displayFilters?.active_tab || "active",
        layout: displayFilters?.layout || "list",
      };
      this.filters[projectId] = this.filters[projectId] ?? {};
    });
  };

  /**
   * @description update display filters of a project
   * @param {string} projectId
   * @param {TCycleDisplayFilters} displayFilters
   */
  updateDisplayFilters = (projectId: string, displayFilters: TCycleDisplayFilters) => {
    runInAction(() => {
      Object.keys(displayFilters).forEach((key) => {
        set(this.displayFilters, [projectId, key], displayFilters[key as keyof TCycleDisplayFilters]);
      });
    });
  };

  /**
   * @description update filters of a project
   * @param {string} projectId
   * @param {TCycleFilters} filters
   */
  updateFilters = (projectId: string, filters: TCycleFilters) => {
    runInAction(() => {
      Object.keys(filters).forEach((key) => {
        set(this.filters, [projectId, key], filters[key as keyof TCycleFilters]);
      });
    });
  };

  /**
   * @description update search query
   * @param {string} query
   */
  updateSearchQuery = (query: string) => (this.searchQuery = query);

  /**
   * @description clear all filters of a project
   * @param {string} projectId
   */
  clearAllFilters = (projectId: string) => {
    runInAction(() => {
      this.filters[projectId] = {};
    });
  };
}
