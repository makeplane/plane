import { set } from "lodash-es";
import { action, computed, observable, makeObservable, runInAction, reaction } from "mobx";
import { computedFn } from "mobx-utils";
// types
import type { TProjectDisplayFilters, TProjectFilters, TProjectAppliedDisplayFilterKeys } from "@plane/types";
// store
import type { CoreRootStore } from "../root.store";

export interface IProjectFilterStore {
  // observables
  displayFilters: Record<string, TProjectDisplayFilters>;
  filters: Record<string, TProjectFilters>;
  searchQuery: string;
  // computed
  currentWorkspaceDisplayFilters: TProjectDisplayFilters | undefined;
  currentWorkspaceAppliedDisplayFilters: TProjectAppliedDisplayFilterKeys[] | undefined;
  currentWorkspaceFilters: TProjectFilters | undefined;
  // computed functions
  getDisplayFiltersByWorkspaceSlug: (workspaceSlug: string) => TProjectDisplayFilters | undefined;
  getFiltersByWorkspaceSlug: (workspaceSlug: string) => TProjectFilters | undefined;
  // actions
  updateDisplayFilters: (workspaceSlug: string, displayFilters: TProjectDisplayFilters) => void;
  updateFilters: (workspaceSlug: string, filters: TProjectFilters) => void;
  updateSearchQuery: (query: string) => void;
  clearAllFilters: (workspaceSlug: string) => void;
  clearAllAppliedDisplayFilters: (workspaceSlug: string) => void;
}

export class ProjectFilterStore implements IProjectFilterStore {
  // observables
  displayFilters: Record<string, TProjectDisplayFilters> = {};
  filters: Record<string, TProjectFilters> = {};
  searchQuery: string = "";
  // root store
  rootStore: CoreRootStore;

  constructor(_rootStore: CoreRootStore) {
    makeObservable(this, {
      // observables
      displayFilters: observable,
      filters: observable,
      searchQuery: observable.ref,
      // computed
      currentWorkspaceDisplayFilters: computed,
      currentWorkspaceAppliedDisplayFilters: computed,
      currentWorkspaceFilters: computed,
      // actions
      updateDisplayFilters: action,
      updateFilters: action,
      updateSearchQuery: action,
      clearAllFilters: action,
      clearAllAppliedDisplayFilters: action,
    });
    // root store
    this.rootStore = _rootStore;
    // initialize display filters of the current workspace
    reaction(
      () => this.rootStore.router.workspaceSlug,
      (workspaceSlug) => {
        if (!workspaceSlug) return;
        this.initWorkspaceFilters(workspaceSlug);
        this.searchQuery = "";
      }
    );
  }

  /**
   * @description get display filters of the current workspace
   */
  get currentWorkspaceDisplayFilters() {
    const workspaceSlug = this.rootStore.router.workspaceSlug;
    if (!workspaceSlug) return;
    return this.displayFilters[workspaceSlug];
  }

  /**
   * @description get project state applied display filter of the current workspace
   * @returns {TProjectAppliedDisplayFilterKeys[] | undefined} // An array of keys of applied display filters
   */
  // TODO: Figure out a better approach for this
  get currentWorkspaceAppliedDisplayFilters() {
    const workspaceSlug = this.rootStore.router.workspaceSlug;
    if (!workspaceSlug) return;
    const displayFilters = this.displayFilters[workspaceSlug];
    return Object.keys(displayFilters).filter(
      (key): key is TProjectAppliedDisplayFilterKeys =>
        ["my_projects", "archived_projects"].includes(key) && !!displayFilters[key as keyof TProjectDisplayFilters]
    );
  }

  /**
   * @description get filters of the current workspace
   */
  get currentWorkspaceFilters() {
    const workspaceSlug = this.rootStore.router.workspaceSlug;
    if (!workspaceSlug) return;
    return this.filters[workspaceSlug];
  }

  /**
   * @description get display filters of a workspace by workspaceSlug
   * @param {string} workspaceSlug
   */
  getDisplayFiltersByWorkspaceSlug = computedFn((workspaceSlug: string) => this.displayFilters[workspaceSlug]);

  /**
   * @description get filters of a workspace by workspaceSlug
   * @param {string} workspaceSlug
   */
  getFiltersByWorkspaceSlug = computedFn((workspaceSlug: string) => this.filters[workspaceSlug]);

  /**
   * @description initialize display filters and filters of a workspace
   * @param {string} workspaceSlug
   */
  initWorkspaceFilters = (workspaceSlug: string) => {
    const displayFilters = this.getDisplayFiltersByWorkspaceSlug(workspaceSlug);
    runInAction(() => {
      this.displayFilters[workspaceSlug] = {
        order_by: displayFilters?.order_by || "created_at",
      };
      this.filters[workspaceSlug] = this.filters[workspaceSlug] ?? {};
    });
  };

  /**
   * @description update display filters of a workspace
   * @param {string} workspaceSlug
   * @param {TProjectDisplayFilters} displayFilters
   */
  updateDisplayFilters = (workspaceSlug: string, displayFilters: TProjectDisplayFilters) => {
    runInAction(() => {
      Object.keys(displayFilters).forEach((key) => {
        set(this.displayFilters, [workspaceSlug, key], displayFilters[key as keyof TProjectDisplayFilters]);
      });
    });
  };

  /**
   * @description update filters of a workspace
   * @param {string} workspaceSlug
   * @param {TProjectFilters} filters
   */
  updateFilters = (workspaceSlug: string, filters: TProjectFilters) => {
    runInAction(() => {
      Object.keys(filters).forEach((key) => {
        set(this.filters, [workspaceSlug, key], filters[key as keyof TProjectFilters]);
      });
    });
  };

  /**
   * @description update search query
   * @param {string} query
   */
  updateSearchQuery = (query: string) => (this.searchQuery = query);

  /**
   * @description clear all filters of a workspace
   * @param {string} workspaceSlug
   */
  clearAllFilters = (workspaceSlug: string) => {
    runInAction(() => {
      this.filters[workspaceSlug] = {};
    });
  };

  /**
   * @description clear project display filters of a workspace
   * @param {string} workspaceSlug
   */
  clearAllAppliedDisplayFilters = (workspaceSlug: string) => {
    runInAction(() => {
      if (!this.currentWorkspaceAppliedDisplayFilters) return;
      this.currentWorkspaceAppliedDisplayFilters.forEach((key) => {
        set(this.displayFilters, [workspaceSlug, key], false);
      });
    });
  };
}
