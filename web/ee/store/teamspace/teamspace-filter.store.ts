import set from "lodash/set";
import { observable, action, makeObservable, runInAction, reaction } from "mobx";
// constants
import { ETeamspaceScope } from "@plane/constants";
// types
import { TTeamspaceDisplayFilters, TTeamspaceFilters } from "@plane/types";
// root store
import { RootStore } from "../root.store";

export interface ITeamspaceFilterStore {
  // observables
  scope: ETeamspaceScope;
  displayFilters: TTeamspaceDisplayFilters;
  filters: TTeamspaceFilters;
  searchQuery: string;
  // actions
  updateScope: (scope: ETeamspaceScope) => void;
  updateDisplayFilters: (displayFilters: TTeamspaceDisplayFilters) => void;
  updateFilters: (filters: TTeamspaceFilters) => void;
  updateSearchQuery: (query: string) => void;
  clearAllFilters: () => void;
  clearAllAppliedDisplayFilters: () => void;
}

export class TeamspaceFilterStore implements ITeamspaceFilterStore {
  // observables
  scope: ETeamspaceScope = ETeamspaceScope.YOUR_TEAMS;
  displayFilters: TTeamspaceDisplayFilters = {};
  filters: TTeamspaceFilters = {};
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
    // Reactions to update teamspace scope on workspace change
    reaction(
      () => ({
        workspaceSlug: this.rootStore.router.workspaceSlug,
      }),
      ({ workspaceSlug }) => {
        if (!workspaceSlug) return;
        if (this.scope !== ETeamspaceScope.YOUR_TEAMS) this.updateScope(ETeamspaceScope.YOUR_TEAMS);
      }
    );
  }

  // actions
  /**
   * Updates the scope
   * @param scope
   */
  updateScope = action((scope: ETeamspaceScope) => {
    this.scope = scope;
  });

  /**
   * @description Update display filters
   * @param {TTeamspaceDisplayFilters} displayFilters
   */
  updateDisplayFilters = action((displayFilters: TTeamspaceDisplayFilters) => {
    runInAction(() => {
      Object.keys(displayFilters).forEach((key) => {
        set(this.displayFilters, key, displayFilters[key as keyof TTeamspaceDisplayFilters]);
      });
    });
  });

  /**
   * @description Update filters
   * @param {TTeamspaceFilters} filters
   */
  updateFilters = action((filters: TTeamspaceFilters) => {
    runInAction(() => {
      Object.keys(filters).forEach((key) => {
        set(this.filters, key, filters[key as keyof TTeamspaceFilters]);
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
