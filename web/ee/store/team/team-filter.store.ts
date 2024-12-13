import set from "lodash/set";
import { observable, action, makeObservable, runInAction } from "mobx";
// types
import { TTeamDisplayFilters, TTeamFilters } from "@plane/types";


export interface ITeamFilterStore {
  // observables
  displayFilters: TTeamDisplayFilters;
  filters: TTeamFilters;
  searchQuery: string;
  // actions
  updateDisplayFilters: (displayFilters: TTeamDisplayFilters) => void;
  updateFilters: (filters: TTeamFilters) => void;
  updateSearchQuery: (query: string) => void;
  clearAllFilters: () => void;
  clearAllAppliedDisplayFilters: () => void;
}

export class TeamFilterStore implements ITeamFilterStore {
  // observables
  displayFilters: TTeamDisplayFilters = {};
  filters: TTeamFilters = {};
  searchQuery: string = "";

  constructor() {
    makeObservable(this, {
      // observables
      displayFilters: observable,
      filters: observable,
      searchQuery: observable.ref,
      // actions
      updateDisplayFilters: action,
      updateFilters: action,
      updateSearchQuery: action,
      clearAllFilters: action,
      clearAllAppliedDisplayFilters: action,
    });
  }

  // actions
  /**
   * @description Update display filters
   * @param {TTeamDisplayFilters} displayFilters
   */
  updateDisplayFilters = action((displayFilters: TTeamDisplayFilters) => {
    runInAction(() => {
      Object.keys(displayFilters).forEach((key) => {
        set(this.displayFilters, key, displayFilters[key as keyof TTeamDisplayFilters]);
      });
    });
  });

  /**
   * @description Update filters
   * @param {TTeamFilters} filters
   */
  updateFilters = action((filters: TTeamFilters) => {
    runInAction(() => {
      Object.keys(filters).forEach((key) => {
        set(this.filters, key, filters[key as keyof TTeamFilters]);
      });
    });
  });

  /**
   * @description Update search query
   * @param {string} query
   */
  updateSearchQuery = action((query: string) => {
    this.searchQuery = query;
  });

  /**
   * @description Clear all filters
   */
  clearAllFilters = action(() => {
    this.filters = {};
    this.displayFilters = {};
  });

  /**
   * @description Clear all applied display filters
   */
  clearAllAppliedDisplayFilters = action(() => {
    runInAction(() => {
      this.displayFilters = {};
    });
  });
}
