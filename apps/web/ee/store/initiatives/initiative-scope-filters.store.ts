import { action, makeObservable, observable } from "mobx";
import { computedFn } from "mobx-utils";
import { IInitiativeScopeDisplayFiltersOptions, EIssueLayoutTypes } from "@plane/types";

export interface IInitiativeScopeStore {
  updateDisplayFilters: (initiativeId: string, displayFilters: IInitiativeScopeDisplayFiltersOptions) => void;
  getDisplayFilters: (initiativeId: string) => IInitiativeScopeDisplayFiltersOptions | undefined;
}

export class InitiativeScopeStore implements IInitiativeScopeStore {
  displayFiltersMap: Map<string, IInitiativeScopeDisplayFiltersOptions> = new Map();

  constructor() {
    makeObservable(this, {
      displayFiltersMap: observable,
      updateDisplayFilters: action,
    });
  }

  /**Initialize filters */
  initDisplayFilters = (initiativeId: string) => {
    this.displayFiltersMap.set(initiativeId, {
      activeLayout: EIssueLayoutTypes.LIST,
    });
  };

  /**
   * Get display filters
   * @param initiativeId - The initiative id
   * @returns The display filters
   */
  getDisplayFilters = computedFn((initiativeId: string): IInitiativeScopeDisplayFiltersOptions | undefined => {
    if (!this.displayFiltersMap.has(initiativeId)) {
      this.initDisplayFilters(initiativeId);
    }
    return this.displayFiltersMap.get(initiativeId);
  });

  /**
   * Update display filters
   * @param initiativeId - The initiative id
   * @param displayFilters - The display filters
   */
  updateDisplayFilters = (initiativeId: string, displayFilters: IInitiativeScopeDisplayFiltersOptions) => {
    this.displayFiltersMap.set(initiativeId, displayFilters);
  };
}
