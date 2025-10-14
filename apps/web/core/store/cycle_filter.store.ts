import { set } from "lodash-es";
import { action, computed, observable, makeObservable, runInAction, reaction } from "mobx";
import { computedFn } from "mobx-utils";
// types
import type { TCycleDisplayFilters, TCycleFilters, TCycleFiltersByState } from "@plane/types";
// store
import type { CoreRootStore } from "./root.store";

export interface ICycleFilterStore {
  // observables
  displayFilters: Record<string, TCycleDisplayFilters>;
  filters: Record<string, TCycleFiltersByState>;
  searchQuery: string;
  archivedCyclesSearchQuery: string;
  // computed
  currentProjectDisplayFilters: TCycleDisplayFilters | undefined;
  currentProjectFilters: TCycleFilters | undefined;
  currentProjectArchivedFilters: TCycleFilters | undefined;
  // computed functions
  getDisplayFiltersByProjectId: (projectId: string) => TCycleDisplayFilters | undefined;
  getFiltersByProjectId: (projectId: string) => TCycleFilters | undefined;
  getArchivedFiltersByProjectId: (projectId: string) => TCycleFilters | undefined;
  // actions
  updateDisplayFilters: (projectId: string, displayFilters: TCycleDisplayFilters) => void;
  updateFilters: (projectId: string, filters: TCycleFilters, state?: keyof TCycleFiltersByState) => void;
  updateSearchQuery: (query: string) => void;
  updateArchivedCyclesSearchQuery: (query: string) => void;
  clearAllFilters: (projectId: string, state?: keyof TCycleFiltersByState) => void;
}

export class CycleFilterStore implements ICycleFilterStore {
  // observables
  displayFilters: Record<string, TCycleDisplayFilters> = {};
  filters: Record<string, TCycleFiltersByState> = {};
  searchQuery: string = "";
  archivedCyclesSearchQuery: string = "";
  // root store
  rootStore: CoreRootStore;

  constructor(_rootStore: CoreRootStore) {
    makeObservable(this, {
      // observables
      displayFilters: observable,
      filters: observable,
      searchQuery: observable.ref,
      archivedCyclesSearchQuery: observable.ref,
      // computed
      currentProjectDisplayFilters: computed,
      currentProjectFilters: computed,
      currentProjectArchivedFilters: computed,
      // actions
      updateDisplayFilters: action,
      updateFilters: action,
      updateSearchQuery: action,
      updateArchivedCyclesSearchQuery: action,
      clearAllFilters: action,
    });
    // root store
    this.rootStore = _rootStore;
    // initialize display filters of the current project
    reaction(
      () => this.rootStore.router.projectId,
      (projectId) => {
        if (!projectId) return;
        this.initProjectCycleFilters(projectId);
        this.searchQuery = "";
      }
    );
  }

  /**
   * @description get display filters of the current project
   */
  get currentProjectDisplayFilters() {
    const projectId = this.rootStore.router.projectId;
    if (!projectId) return;
    return this.displayFilters[projectId];
  }

  /**
   * @description get filters of the current project
   */
  get currentProjectFilters() {
    const projectId = this.rootStore.router.projectId;
    if (!projectId) return;
    return this.filters[projectId]?.default ?? {};
  }

  /**
   * @description get archived filters of the current project
   */
  get currentProjectArchivedFilters() {
    const projectId = this.rootStore.router.projectId;
    if (!projectId) return;
    return this.filters[projectId].archived;
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
  getFiltersByProjectId = computedFn((projectId: string) => this.filters[projectId]?.default ?? {});

  /**
   * @description get archived filters of a project by projectId
   * @param {string} projectId
   */
  getArchivedFiltersByProjectId = computedFn((projectId: string) => this.filters[projectId].archived);

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
      this.filters[projectId] = this.filters[projectId] ?? {
        default: {},
        archived: {},
      };
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
  updateFilters = (projectId: string, filters: TCycleFilters, state: keyof TCycleFiltersByState = "default") => {
    runInAction(() => {
      Object.keys(filters).forEach((key) => {
        set(this.filters, [projectId, state, key], filters[key as keyof TCycleFilters]);
      });
    });
  };

  /**
   * @description update search query
   * @param {string} query
   */
  updateSearchQuery = (query: string) => (this.searchQuery = query);

  /**
   * @description update archived search query
   * @param {string} query
   */
  updateArchivedCyclesSearchQuery = (query: string) => (this.archivedCyclesSearchQuery = query);

  /**
   * @description clear all filters of a project
   * @param {string} projectId
   */
  clearAllFilters = (projectId: string, state: keyof TCycleFiltersByState = "default") => {
    runInAction(() => {
      this.filters[projectId][state] = {};
    });
  };
}
