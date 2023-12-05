import { action, makeObservable, observable, runInAction, computed } from "mobx";
// types
import { RootStore } from "store/root";
import { IIssueFilterOptions, TIssueParams } from "./types";
import { handleIssueQueryParamsByLayout } from "./helpers";
import { IssueFilterBaseStore } from "./base-issue-filter.store";

interface IFiltersOptions {
  filters: IIssueFilterOptions;
}

export interface IIssuesFilterStore {
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

export class IssuesFilterStore extends IssueFilterBaseStore implements IIssuesFilterStore {
  // observables
  projectIssueFilters: { [projectId: string]: IFiltersOptions } | undefined = undefined;
  // root store
  rootStore;

  constructor(_rootStore: RootStore) {
    super(_rootStore);

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

  // helpers
  issueDisplayFilters = (projectId: string) => {
    if (!projectId) return undefined;
    return this.projectIssueFilters?.[projectId] || undefined;
  };

  // actions

  updateFilters = async (projectId: string, filters: IIssueFilterOptions) => {
    try {
      let _projectIssueFilters = { ...this.projectIssueFilters };
      if (!_projectIssueFilters) _projectIssueFilters = {};
      if (!_projectIssueFilters[projectId]) _projectIssueFilters[projectId] = { filters: {} };

      const _filters = {
        filters: { ..._projectIssueFilters[projectId].filters },
      };

      _filters.filters = { ..._filters.filters, ...filters };

      _projectIssueFilters[projectId] = {
        filters: _filters.filters,
      };

      runInAction(() => {
        this.projectIssueFilters = _projectIssueFilters;
      });

      return _filters;
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
    const layout = this.rootStore.project?.activeBoard;
    if (!userFilters || !layout) return undefined;

    let filteredRouteParams: any = {
      priority: userFilters?.filters?.priority || undefined,
      state: userFilters?.filters?.state || undefined,
      labels: userFilters?.filters?.labels || undefined,
    };

    const filteredParams = handleIssueQueryParamsByLayout(layout, "issues");
    if (filteredParams) filteredRouteParams = this.computedFilter(filteredRouteParams, filteredParams);

    return filteredRouteParams;
  }
}
