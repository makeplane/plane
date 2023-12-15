import { observable, action, makeObservable, runInAction } from "mobx";
// types
import { RootStore } from "../root";
import { IIssueFilterOptions } from "types";

export interface IProjectViewFiltersStore {
  // states
  loader: boolean;
  error: any | null;

  // observables
  storedFilters: {
    [viewId: string]: IIssueFilterOptions;
  };

  // actions
  updateStoredFilters: (viewId: string, filters: Partial<IIssueFilterOptions>) => void;
  deleteStoredFilters: (viewId: string) => void;
}

export class ProjectViewFiltersStore implements IProjectViewFiltersStore {
  // states
  loader: boolean = false;
  error: any | null = null;

  // observables
  storedFilters: {
    [viewId: string]: IIssueFilterOptions;
  } = {};

  // root store
  rootStore;

  constructor(_rootStore: RootStore) {
    makeObservable(this, {
      // states
      loader: observable.ref,
      error: observable.ref,

      // observables
      storedFilters: observable.ref,

      // actions
      updateStoredFilters: action,
      deleteStoredFilters: action,
    });

    this.rootStore = _rootStore;
  }

  updateStoredFilters = (viewId: string, filters: Partial<IIssueFilterOptions>) => {
    runInAction(() => {
      this.storedFilters = {
        ...this.storedFilters,
        [viewId]: { ...this.storedFilters[viewId], ...filters },
      };
    });
  };

  deleteStoredFilters = (viewId: string) => {
    const updatedStoredFilters = { ...this.storedFilters };
    delete updatedStoredFilters[viewId];

    runInAction(() => {
      this.storedFilters = updatedStoredFilters;
    });
  };
}
