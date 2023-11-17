import { RootStore } from "store/root";

export interface IIssueFilterBaseStore {
  computedFilter(filters: any, filteredParams: any): any;
}

export class IssueFilterBaseStore implements IIssueFilterBaseStore {
  // root store
  rootStore;

  constructor(_rootStore: RootStore) {
    this.rootStore = _rootStore;
  }

  // issue filter helpers
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
