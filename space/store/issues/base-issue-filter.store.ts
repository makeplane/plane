// types
import { RootStore } from "store/root";

export interface IIssueFilterBaseStore {
  // helper methods
  computedFilter(filters: any, filteredParams: any): any;
}

export class IssueFilterBaseStore implements IIssueFilterBaseStore {
  // root store
  rootStore;

  constructor(_rootStore: RootStore) {
    // root store
    this.rootStore = _rootStore;
  }

  // helper methods
  computedFilter = (filters: any, filteredParams: any) => {
    const computedFilters: any = {};
    Object.keys(filters).map((key) => {
      if (filters[key] != undefined && filteredParams.includes(key))
        computedFilters[key] =
          typeof filters[key] === "string" || typeof filters[key] === "boolean" ? filters[key] : filters[key].join(",");
    });

    return computedFilters;
  };
}
