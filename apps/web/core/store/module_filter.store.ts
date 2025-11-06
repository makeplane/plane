import { set } from "lodash-es";
import { action, computed, observable, makeObservable, runInAction, reaction } from "mobx";
import { computedFn } from "mobx-utils";
// types
import type { TModuleDisplayFilters, TModuleFilters, TModuleFiltersByState } from "@plane/types";
// helpers
import { storage } from "@/lib/local-storage";
// store
import type { CoreRootStore } from "./root.store";

// localStorage keys
const MODULE_DISPLAY_FILTERS_KEY = "module_display_filters";
const MODULE_FILTERS_KEY = "module_filters";

export interface IModuleFilterStore {
  // observables
  displayFilters: Record<string, TModuleDisplayFilters>;
  filters: Record<string, TModuleFiltersByState>;
  searchQuery: string;
  archivedModulesSearchQuery: string;
  // computed
  currentProjectDisplayFilters: TModuleDisplayFilters | undefined;
  currentProjectFilters: TModuleFilters | undefined;
  currentProjectArchivedFilters: TModuleFilters | undefined;
  // computed functions
  getDisplayFiltersByProjectId: (projectId: string) => TModuleDisplayFilters | undefined;
  getFiltersByProjectId: (projectId: string) => TModuleFilters | undefined;
  getArchivedFiltersByProjectId: (projectId: string) => TModuleFilters | undefined;
  // actions
  updateDisplayFilters: (projectId: string, displayFilters: TModuleDisplayFilters) => void;
  updateFilters: (projectId: string, filters: TModuleFilters, state?: keyof TModuleFiltersByState) => void;
  updateSearchQuery: (query: string) => void;
  updateArchivedModulesSearchQuery: (query: string) => void;
  clearAllFilters: (projectId: string, state?: keyof TModuleFiltersByState) => void;
}

export class ModuleFilterStore implements IModuleFilterStore {
  // observables
  displayFilters: Record<string, TModuleDisplayFilters> = {};
  filters: Record<string, TModuleFiltersByState> = {};
  searchQuery: string = "";
  archivedModulesSearchQuery: string = "";
  // root store
  rootStore: CoreRootStore;

  constructor(_rootStore: CoreRootStore) {
    makeObservable(this, {
      // observables
      displayFilters: observable,
      filters: observable,
      searchQuery: observable.ref,
      archivedModulesSearchQuery: observable.ref,
      // computed
      currentProjectDisplayFilters: computed,
      currentProjectFilters: computed,
      currentProjectArchivedFilters: computed,
      // actions
      updateDisplayFilters: action,
      updateFilters: action,
      updateSearchQuery: action,
      updateArchivedModulesSearchQuery: action,
      clearAllFilters: action,
    });
    // root store
    this.rootStore = _rootStore;

    // initialize display filters of the current project
    reaction(
      () => this.rootStore.router.projectId,
      (projectId) => {
        if (!projectId) return;
        this.initProjectModuleFilters(projectId);
        this.searchQuery = "";
      }
    );

    // Load initial data from localStorage after reactions are set up
    this.loadFromLocalStorage();
  }

  /**
   * @description Load filters from localStorage
   */
  loadFromLocalStorage = () => {
    try {
      const displayFiltersData = storage.get(MODULE_DISPLAY_FILTERS_KEY);
      const filtersData = storage.get(MODULE_FILTERS_KEY);

      runInAction(() => {
        if (displayFiltersData) {
          const parsed = JSON.parse(displayFiltersData);
          if (typeof parsed === "object" && parsed !== null) {
            this.displayFilters = parsed;
          }
        }
        if (filtersData) {
          const parsed = JSON.parse(filtersData);
          if (typeof parsed === "object" && parsed !== null) {
            this.filters = parsed;
          }
        }
      });
    } catch (error) {
      console.error("Failed to load module filters from localStorage:", error);
      // Reset to defaults on error
      runInAction(() => {
        this.displayFilters = {};
        this.filters = {};
      });
    }
  };

  /**
   * @description Save display filters to localStorage (debounced)
   */
  saveDisplayFiltersToLocalStorage = () => {
    storage.set(MODULE_DISPLAY_FILTERS_KEY, this.displayFilters);
  };

  /**
   * @description Save filters to localStorage (debounced)
   */
  saveFiltersToLocalStorage = () => {
    storage.set(MODULE_FILTERS_KEY, this.filters);
  };

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
  initProjectModuleFilters = (projectId: string) => {
    const displayFilters = this.getDisplayFiltersByProjectId(projectId);
    runInAction(() => {
      this.displayFilters[projectId] = {
        favorites: displayFilters?.favorites || false,
        layout: displayFilters?.layout || "list",
        order_by: displayFilters?.order_by || "name",
      };
      this.filters[projectId] = this.filters[projectId] ?? {
        default: {},
        archived: {},
      };
    });
    this.saveDisplayFiltersToLocalStorage();
    this.saveFiltersToLocalStorage();
  };

  /**
   * @description update display filters of a project
   * @param {string} projectId
   * @param {TModuleDisplayFilters} displayFilters
   */
  updateDisplayFilters = (projectId: string, displayFilters: TModuleDisplayFilters) => {
    runInAction(() => {
      Object.keys(displayFilters).forEach((key) => {
        set(this.displayFilters, [projectId, key], displayFilters[key as keyof TModuleDisplayFilters]);
      });
    });
    this.saveDisplayFiltersToLocalStorage();
  };

  /**
   * @description update filters of a project
   * @param {string} projectId
   * @param {TModuleFilters} filters
   */
  updateFilters = (projectId: string, filters: TModuleFilters, state: keyof TModuleFiltersByState = "default") => {
    runInAction(() => {
      Object.keys(filters).forEach((key) => {
        set(this.filters, [projectId, state, key], filters[key as keyof TModuleFilters]);
      });
    });
    this.saveFiltersToLocalStorage();
  };

  /**
   * @description update search query
   * @param {string} query
   */
  updateSearchQuery = (query: string) => {
    this.searchQuery = query;
  };

  /**
   * @description update archived search query
   * @param {string} query
   */
  updateArchivedModulesSearchQuery = (query: string) => {
    this.archivedModulesSearchQuery = query;
  };

  /**
   * @description clear all filters of a project
   * @param {string} projectId
   */
  clearAllFilters = (projectId: string, state: keyof TModuleFiltersByState = "default") => {
    runInAction(() => {
      this.filters[projectId][state] = {};
      this.displayFilters[projectId].favorites = false;
    });
    this.saveFiltersToLocalStorage();
    this.saveDisplayFiltersToLocalStorage();
  };
}
