import { action, makeObservable, observable, runInAction, computed } from "mobx";
// constants
import { ISSUE_DISPLAY_FILTERS_BY_LAYOUT } from "@/constants/issue";
// store
import { RootStore } from "@/store/root.store";
// types
import { TIssueBoardKeys, IIssueFilterOptions, TIssueParams } from "@/types/issue";

interface IFiltersOptions {
  filters: IIssueFilterOptions;
}

export interface IIssueFilterStore {
  // observables
  projectIssueFilters: { [projectId: string]: IFiltersOptions } | undefined;
  // computed
  issueFilters: IFiltersOptions | undefined;
  appliedFilters: TIssueParams[] | undefined;
  // helpers
  issueDisplayFilters: (projectId: string) => IFiltersOptions | undefined;
  // actions
  updateFilters: (projectId: string, filters: IIssueFilterOptions) => Promise<IFiltersOptions>;
}

export class IssueFilterStore implements IIssueFilterStore {
  // observables
  projectIssueFilters: { [projectId: string]: IFiltersOptions } | undefined = undefined;
  // root store
  rootStore;

  constructor(_rootStore: RootStore) {
    makeObservable(this, {
      // observables
      projectIssueFilters: observable.ref,
      // computed
      issueFilters: computed,
      appliedFilters: computed,
      // actions
      updateFilters: action,
    });
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

  // helpers
  issueDisplayFilters = (projectId: string) => {
    if (!projectId) return undefined;
    return this.projectIssueFilters?.[projectId] || undefined;
  };

  handleIssueQueryParamsByLayout = (layout: TIssueBoardKeys | undefined, viewType: "issues"): TIssueParams[] | null => {
    const queryParams: TIssueParams[] = [];

    if (!layout) return null;

    const layoutOptions = ISSUE_DISPLAY_FILTERS_BY_LAYOUT[viewType][layout];

    // add filters query params
    layoutOptions.filters.forEach((option: any) => {
      queryParams.push(option);
    });

    return queryParams;
  };

  // actions
  updateFilters = async (projectId: string, filters: IIssueFilterOptions) => {
    try {
      let issueFilters = { ...this.projectIssueFilters };
      if (!issueFilters) issueFilters = {};
      if (!issueFilters[projectId]) issueFilters[projectId] = { filters: {} };

      const newFilters = {
        filters: { ...issueFilters[projectId].filters },
      };

      newFilters.filters = { ...newFilters.filters, ...filters };

      issueFilters[projectId] = {
        filters: newFilters.filters,
      };

      runInAction(() => {
        this.projectIssueFilters = issueFilters;
      });

      return newFilters;
    } catch (error) {
      throw error;
    }
  };

  get issueFilters() {
    const projectId = this.rootStore.project.project?.id;
    if (!projectId) return undefined;

    const issueFilters = this.issueDisplayFilters(projectId);
    if (!issueFilters) return undefined;

    return issueFilters;
  }

  get appliedFilters() {
    const userFilters = this.issueFilters;
    const layout = this.rootStore.project?.activeLayout;
    if (!userFilters || !layout) return undefined;

    let filteredRouteParams: any = {
      priority: userFilters?.filters?.priority || undefined,
      state: userFilters?.filters?.state || undefined,
      labels: userFilters?.filters?.labels || undefined,
    };

    const filteredParams = this.handleIssueQueryParamsByLayout(layout, "issues");
    if (filteredParams) filteredRouteParams = this.computedFilter(filteredRouteParams, filteredParams);

    return filteredRouteParams;
  }
}
