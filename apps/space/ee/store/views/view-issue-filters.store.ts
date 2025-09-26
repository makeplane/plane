import { set } from "lodash-es";
import { action, makeObservable, observable, runInAction } from "mobx";
import { computedFn } from "mobx-utils";
// plane types
import { IIssueFilterOptions, IssuePaginationOptions, TIssueParams } from "@plane/types";
// store
// types
import { getPaginationParams } from "@/store/helpers/filter.helpers";
import { RootStore } from "../root.store";

export interface IViewIssueFilterStore {
  // observables
  filters: IIssueFilterOptions | undefined;
  // helpers
  getIssueFilters: (anchor: string) => IIssueFilterOptions | undefined;
  getAppliedFilters: (anchor: string) => Partial<Record<TIssueParams, string | boolean>> | undefined;
  // actions
  initIssueFilters: (anchor: string, filters: IIssueFilterOptions, shouldFetchIssues?: boolean) => void;
  updateIssueFilters: (
    anchor: string,
    filterKey: keyof IIssueFilterOptions,
    filterValue: string[] | null
  ) => Promise<void>;
  getFilterParams: (
    options: IssuePaginationOptions,
    cursor: string | undefined,
    groupId: string | undefined,
    subGroupId: string | undefined
  ) => Partial<Record<TIssueParams, string | boolean>>;
}

export class ViewIssueFilterStore implements IViewIssueFilterStore {
  // observables
  filters: IIssueFilterOptions | undefined = undefined;

  constructor(private store: RootStore) {
    makeObservable(this, {
      // observables
      filters: observable,
      // actions
      initIssueFilters: action,
      updateIssueFilters: action,
    });
  }

  // computed
  getIssueFilters = computedFn(() => this.filters);

  getAppliedFilters = computedFn(() => {
    const issueFilters = this.filters;
    if (!issueFilters) return undefined;

    const currentFilterQueryParams: Partial<Record<TIssueParams, string | boolean>> =
      this.computedFilteredParams(issueFilters);

    return currentFilterQueryParams;
  });

  initIssueFilters = async (anchor: string, initFilters: IIssueFilterOptions, shouldFetchIssues: boolean = false) => {
    if (this.filters === undefined) runInAction(() => (this.filters = {}));
    if (this.filters && initFilters) runInAction(() => (this.filters = initFilters));

    if (shouldFetchIssues) await this.store.viewIssues.fetchPublicIssuesWithExistingPagination(anchor, "mutation");
  };

  getFilterParams = computedFn(
    (
      options: IssuePaginationOptions,
      cursor: string | undefined,
      groupId: string | undefined,
      subGroupId: string | undefined
    ) => {
      const filterParams = this.getAppliedFilters();
      const paginationParams = getPaginationParams(filterParams, options, cursor, groupId, subGroupId);
      return paginationParams;
    }
  );

  updateIssueFilters = async (anchor: string, filterKey: keyof IIssueFilterOptions, filterValue: string[] | null) => {
    if (!filterKey || !filterValue) return;
    if (this.filters === undefined) runInAction(() => (this.filters = {}));

    runInAction(() => {
      if (this.filters) set(this.filters, [filterKey], filterValue);
    });

    await this.store.viewIssues.fetchPublicIssuesWithExistingPagination(anchor, "mutation");
  };

  computedFilteredParams = (filters: IIssueFilterOptions) => {
    const computedFilters: Partial<Record<TIssueParams, undefined | string[] | boolean | string>> = {
      // issue filters
      priority: filters?.priority || undefined,
      state_group: filters?.state_group || undefined,
      state: filters?.state || undefined,
      assignees: filters?.assignees || undefined,
      mentions: filters?.mentions || undefined,
      created_by: filters?.created_by || undefined,
      labels: filters?.labels || undefined,
      cycle: filters?.cycle || undefined,
      module: filters?.module || undefined,
      start_date: filters?.start_date || undefined,
      target_date: filters?.target_date || undefined,
      project: filters?.project || undefined,
      subscriber: filters?.subscriber || undefined,
    };

    const issueFiltersParams: Partial<Record<TIssueParams, boolean | string>> = {};
    Object.keys(computedFilters).forEach((key) => {
      const _key = key as TIssueParams;
      const _value: string | boolean | string[] | undefined = computedFilters[_key];
      const nonEmptyArrayValue = Array.isArray(_value) && _value.length === 0 ? undefined : _value;
      if (nonEmptyArrayValue != undefined)
        issueFiltersParams[_key] = Array.isArray(nonEmptyArrayValue)
          ? nonEmptyArrayValue.join(",")
          : nonEmptyArrayValue;
    });

    return issueFiltersParams;
  };
}
