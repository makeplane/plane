import set from "lodash/set";
import { observable, action, makeObservable, runInAction, reaction } from "mobx";
// constants
import { ETeamScope } from "@plane/constants";
// types
import { TTeamDisplayFilters, TTeamFilters } from "@plane/types";
// root store
import { RootStore } from "../root.store";

export interface ITeamFilterStore {
  // observables
  scope: ETeamScope;
  displayFilters: TTeamDisplayFilters;
  filters: TTeamFilters;
  searchQuery: string;
  // actions
  updateScope: (scope: ETeamScope) => void;
  updateDisplayFilters: (displayFilters: TTeamDisplayFilters) => void;
  updateFilters: (filters: TTeamFilters) => void;
  updateSearchQuery: (query: string) => void;
  clearAllFilters: () => void;
  clearAllAppliedDisplayFilters: () => void;
}

export class TeamFilterStore implements ITeamFilterStore {
  // observables
  scope: ETeamScope = ETeamScope.YOUR_TEAMS;
  displayFilters: TTeamDisplayFilters = {};
  filters: TTeamFilters = {};
  searchQuery: string = "";

  constructor(private rootStore: RootStore) {
    makeObservable(this, {
      // observables
      scope: observable,
      displayFilters: observable,
      filters: observable,
      searchQuery: observable.ref,
      // actions
      updateScope: action,
      updateDisplayFilters: action,
      updateFilters: action,
      updateSearchQuery: action,
      clearAllFilters: action,
      clearAllAppliedDisplayFilters: action,
    });
    // Reactions to update team scope on workspace change
    reaction(
      () => ({
        workspaceSlug: this.rootStore.router.workspaceSlug,
      }),
      ({ workspaceSlug }) => {
        if (!workspaceSlug) return;
        if (this.scope !== ETeamScope.YOUR_TEAMS) this.updateScope(ETeamScope.YOUR_TEAMS);
      }
    );
  }

  // actions
  /**
   * Updates the scope
   * @param scope
   */
  updateScope = action((scope: ETeamScope) => {
    this.scope = scope;
  });

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
