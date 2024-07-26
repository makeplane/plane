import cloneDeep from "lodash/cloneDeep";
import isEqual from "lodash/isEqual";
import set from "lodash/set";
import { action, makeObservable, observable, runInAction } from "mobx";
import { computedFn } from "mobx-utils";
// plane types
import { IssuePaginationOptions, TIssueParams } from "@plane/types";
// constants
import { ISSUE_DISPLAY_FILTERS_BY_LAYOUT } from "@/constants/issue";
// store
import { CoreRootStore } from "@/store/root.store";
// types
import {
  TIssueLayoutOptions,
  TIssueFilters,
  TIssueQueryFilters,
  TIssueQueryFiltersParams,
  TIssueFilterKeys,
} from "@/types/issue";
import { getPaginationParams } from "./helpers/filter.helpers";

export interface IIssueFilterStore {
  // observables
  layoutOptions: TIssueLayoutOptions;
  filters: { [anchor: string]: TIssueFilters } | undefined;
  // computed
  isIssueFiltersUpdated: (anchor: string, filters: TIssueFilters) => boolean;
  // helpers
  getIssueFilters: (anchor: string) => TIssueFilters | undefined;
  getAppliedFilters: (anchor: string) => TIssueQueryFiltersParams | undefined;
  // actions
  updateLayoutOptions: (layout: TIssueLayoutOptions) => void;
  initIssueFilters: (anchor: string, filters: TIssueFilters, shouldFetchIssues?: boolean) => void;
  updateIssueFilters: <K extends keyof TIssueFilters>(
    anchor: string,
    filterKind: K,
    filterKey: keyof TIssueFilters[K],
    filters: TIssueFilters[K][typeof filterKey]
  ) => Promise<void>;
  getFilterParams: (
    options: IssuePaginationOptions,
    anchor: string,
    cursor: string | undefined,
    groupId: string | undefined,
    subGroupId: string | undefined
  ) => Partial<Record<TIssueParams, string | boolean>>;
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
  filters: { [anchor: string]: TIssueFilters } | undefined = undefined;

  constructor(private store: CoreRootStore) {
    makeObservable(this, {
      // observables
      layoutOptions: observable,
      filters: observable,
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
  getIssueFilters = computedFn((anchor: string) => {
    const currentFilters = this.filters?.[anchor];
    return currentFilters;
  });

  getAppliedFilters = computedFn((anchor: string) => {
    const issueFilters = this.getIssueFilters(anchor);
    if (!issueFilters) return undefined;

    const currentLayout = issueFilters?.display_filters?.layout;
    if (!currentLayout) return undefined;

    const currentFilters: TIssueQueryFilters = {
      priority: issueFilters?.filters?.priority || undefined,
      state: issueFilters?.filters?.state || undefined,
      labels: issueFilters?.filters?.labels || undefined,
    };
    const filteredParams = ISSUE_DISPLAY_FILTERS_BY_LAYOUT?.[currentLayout]?.filters || [];
    const currentFilterQueryParams: TIssueQueryFiltersParams = this.computedFilter(currentFilters, filteredParams);

    return currentFilterQueryParams;
  });

  isIssueFiltersUpdated = computedFn((anchor: string, userFilters: TIssueFilters) => {
    const issueFilters = this.getIssueFilters(anchor);
    if (!issueFilters) return false;
    const currentUserFilters = cloneDeep(userFilters?.filters || {});
    const currentIssueFilters = cloneDeep(issueFilters?.filters || {});
    return isEqual(currentUserFilters, currentIssueFilters);
  });

  // actions
  updateLayoutOptions = (options: TIssueLayoutOptions) => set(this, ["layoutOptions"], options);

  initIssueFilters = async (anchor: string, initFilters: TIssueFilters, shouldFetchIssues: boolean = false) => {
    if (this.filters === undefined) runInAction(() => (this.filters = {}));
    if (this.filters && initFilters) set(this.filters, [anchor], initFilters);

    if (shouldFetchIssues) await this.store.issue.fetchPublicIssuesWithExistingPagination(anchor, "mutation");
  };

  getFilterParams = computedFn(
    (
      options: IssuePaginationOptions,
      anchor: string,
      cursor: string | undefined,
      groupId: string | undefined,
      subGroupId: string | undefined
    ) => {
      const filterParams = this.getAppliedFilters(anchor);
      const paginationParams = getPaginationParams(filterParams, options, cursor, groupId, subGroupId);
      return paginationParams;
    }
  );

  updateIssueFilters = async <K extends keyof TIssueFilters>(
    anchor: string,
    filterKind: K,
    filterKey: keyof TIssueFilters[K],
    filterValue: TIssueFilters[K][typeof filterKey]
  ) => {
    if (!filterKind || !filterKey || !filterValue) return;
    if (this.filters === undefined) runInAction(() => (this.filters = {}));

    runInAction(() => {
      if (this.filters) set(this.filters, [anchor, filterKind, filterKey], filterValue);
    });

    if (filterKey !== "layout") await this.store.issue.fetchPublicIssuesWithExistingPagination(anchor, "mutation");
  };
}
