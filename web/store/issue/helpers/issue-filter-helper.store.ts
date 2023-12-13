// types
import { IIssueRootStore } from "../root.store";

export interface IIssueFilterHelperStore {
  // helper methods
  computedFilter(filters: any, filteredParams: any): any;
}

export class IssueFilterHelperStore implements IIssueFilterHelperStore {
  // root store
  rootStore;

  constructor(_rootStore: IIssueRootStore) {
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
