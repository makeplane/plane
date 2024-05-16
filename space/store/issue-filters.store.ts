import cloneDeep from "lodash/cloneDeep";
import isEqual from "lodash/isEqual";
import set from "lodash/set";
import { action, makeObservable, observable, runInAction, computed } from "mobx";
import { computedFn } from "mobx-utils";
// constants
import { ISSUE_DISPLAY_FILTERS_BY_LAYOUT } from "@/constants/issue";
// store
import { RootStore } from "@/store/root.store";
// types
import {
  TIssueLayoutOptions,
  TIssueFilters,
  TIssueQueryFilters,
  TIssueQueryFiltersParams,
  TIssueFilterKeys,
} from "@/types/issue";

export interface IIssueFilterStore {
  // observables
  layoutOptions: TIssueLayoutOptions;
  filters: { [projectId: string]: TIssueFilters } | undefined;
  // computed
  issueFilters: TIssueFilters | undefined;
  appliedFilters: TIssueQueryFiltersParams | undefined;
  isIssueFiltersUpdated: (filters: TIssueFilters) => boolean;
  // actions
  updateLayoutOptions: (layout: TIssueLayoutOptions) => void;
  initIssueFilters: (projectId: string, filters: TIssueFilters) => void;
  updateIssueFilters: <K extends keyof TIssueFilters>(
    projectId: string,
    filterKind: K,
    filterKey: keyof TIssueFilters[K],
    filters: TIssueFilters[K][typeof filterKey]
  ) => Promise<void>;
}

export class IssueFilterStore implements IIssueFilterStore {
  // observables
  layoutOptions: TIssueLayoutOptions = {
    list: true,
    kanban: false,
    calendar: false,
    gantt: false,
    spreadsheet: false,
  };
  filters: { [projectId: string]: TIssueFilters } | undefined = undefined;

  constructor(private store: RootStore) {
    makeObservable(this, {
      // observables
      layoutOptions: observable,
      filters: observable,
      // computed
      issueFilters: computed,
      appliedFilters: computed,
      // actions
      updateLayoutOptions: action,
      initIssueFilters: action,
      updateIssueFilters: action,
    });
  }

  // helper methods
  computedFilter = (filters: TIssueQueryFilters, filteredParams: TIssueFilterKeys[]) => {
    const computedFilters: TIssueQueryFiltersParams = {};

    Object.keys(filters).map((key) => {
      const currentFilterKey = key as TIssueFilterKeys;

      if (filters[currentFilterKey] != undefined && filteredParams.includes(currentFilterKey)) {
        if (Array.isArray(filters[currentFilterKey]))
          computedFilters[currentFilterKey] = filters[currentFilterKey]?.join(",");
        else if (filters[currentFilterKey] && typeof filters[currentFilterKey] === "string")
          computedFilters[currentFilterKey] = filters[currentFilterKey]?.toString();
        else if (typeof filters[currentFilterKey] === "boolean")
          computedFilters[currentFilterKey] = filters[currentFilterKey]?.toString();
      }
    });

    return computedFilters;
  };

  // computed
  get issueFilters() {
    const projectId = this.store.project.project?.id;
    if (!projectId) return undefined;

    const currentFilters = this.filters?.[projectId];
    if (!currentFilters) return undefined;

    return currentFilters;
  }

  get appliedFilters() {
    const currentIssueFilters = this.issueFilters;
    if (!currentIssueFilters) return undefined;

    const currentLayout = currentIssueFilters?.display_filters?.layout;
    if (!currentLayout) return undefined;

    const currentFilters: TIssueQueryFilters = {
      priority: currentIssueFilters?.filters?.priority || undefined,
      state: currentIssueFilters?.filters?.state || undefined,
      labels: currentIssueFilters?.filters?.labels || undefined,
    };
    const filteredParams = ISSUE_DISPLAY_FILTERS_BY_LAYOUT?.[currentLayout]?.filters || [];
    const currentFilterQueryParams: TIssueQueryFiltersParams = this.computedFilter(currentFilters, filteredParams);

    return currentFilterQueryParams;
  }

  isIssueFiltersUpdated = computedFn((userFilters: TIssueFilters) => {
    if (!this.issueFilters) return false;
    const currentUserFilters = cloneDeep(userFilters?.filters || {});
    const currentIssueFilters = cloneDeep(this.issueFilters?.filters || {});
    return isEqual(currentUserFilters, currentIssueFilters);
  });

  // actions
  updateLayoutOptions = (options: TIssueLayoutOptions) => set(this, ["layoutOptions"], options);

  initIssueFilters = async (projectId: string, initFilters: TIssueFilters) => {
    try {
      if (!projectId) return;
      if (this.filters === undefined) runInAction(() => (this.filters = {}));
      if (this.filters && initFilters) set(this.filters, [projectId], initFilters);

      const workspaceSlug = this.store.project.workspace?.slug;
      const currentAppliedFilters = this.appliedFilters;

      if (!workspaceSlug) return;
      await this.store.issue.fetchPublicIssues(workspaceSlug, projectId, currentAppliedFilters);
    } catch (error) {
      throw error;
    }
  };

  updateIssueFilters = async <K extends keyof TIssueFilters>(
    projectId: string,
    filterKind: K,
    filterKey: keyof TIssueFilters[K],
    filterValue: TIssueFilters[K][typeof filterKey]
  ) => {
    try {
      if (!projectId || !filterKind || !filterKey || !filterValue) return;
      if (this.filters === undefined) runInAction(() => (this.filters = {}));

      runInAction(() => {
        if (this.filters) set(this.filters, [projectId, filterKind, filterKey], filterValue);
      });

      const workspaceSlug = this.store.project.workspace?.slug;
      const currentAppliedFilters = this.appliedFilters;

      if (!workspaceSlug) return;
      await this.store.issue.fetchPublicIssues(workspaceSlug, projectId, currentAppliedFilters);
    } catch (error) {
      throw error;
    }
  };
}
