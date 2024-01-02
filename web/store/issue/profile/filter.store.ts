import { computed, makeObservable, observable, runInAction } from "mobx";
import isEmpty from "lodash/isEmpty";
import set from "lodash/set";
// base class
import { IssueFilterHelperStore } from "../helpers/issue-filter-helper.store";
// helpers
import { handleIssueQueryParamsByLayout } from "helpers/issue.helper";
// types
import { IIssueRootStore } from "../root.store";
import {
  IIssueFilterOptions,
  IIssueDisplayFilterOptions,
  IIssueDisplayProperties,
  IIssueFilters,
  TIssueParams,
} from "@plane/types";
// constants
import { EIssueFilterType, EIssuesStoreType } from "constants/issue";
// services
import { IssueFiltersService } from "services/issue_filter.service";

export interface IProfileIssuesFilter {
  // observables
  userId: string;
  filters: Record<string, IIssueFilters>; // Record defines userId as key and IIssueFilters as value
  // computed
  issueFilters: IIssueFilters | undefined;
  appliedFilters: Partial<Record<TIssueParams, string | boolean>> | undefined;
  // action
  fetchFilters: (workspaceSlug: string, userId: string) => Promise<void>;
  updateFilters: (
    workspaceSlug: string,
    projectId: string | undefined,
    filterType: EIssueFilterType,
    filters: IIssueFilterOptions | IIssueDisplayFilterOptions | IIssueDisplayProperties,
    userId?: string | undefined
  ) => Promise<void>;
}

export class ProfileIssuesFilter extends IssueFilterHelperStore implements IProfileIssuesFilter {
  // observables
  userId: string = "";
  filters: { [userId: string]: IIssueFilters } = {};
  // root store
  rootIssueStore: IIssueRootStore;
  // services
  issueFilterService;

  constructor(_rootStore: IIssueRootStore) {
    super();
    makeObservable(this, {
      // observables
      userId: observable.ref,
      filters: observable,
      // computed
      issueFilters: computed,
      appliedFilters: computed,
    });
    // root store
    this.rootIssueStore = _rootStore;
    // services
    this.issueFilterService = new IssueFiltersService();
  }

  get issueFilters() {
    const userId = this.rootIssueStore.userId;
    if (!userId) return undefined;

    const displayFilters = this.filters[userId] || undefined;
    if (isEmpty(displayFilters)) return undefined;

    const _filters: IIssueFilters = this.computedIssueFilters(displayFilters);

    return _filters;
  }

  get appliedFilters() {
    const userFilters = this.issueFilters;
    if (!userFilters) return undefined;

    const filteredParams = handleIssueQueryParamsByLayout(userFilters?.displayFilters?.layout, "issues");
    if (!filteredParams) return undefined;

    const filteredRouteParams: Partial<Record<TIssueParams, string | boolean>> = this.computedFilteredParams(
      userFilters?.filters as IIssueFilterOptions,
      userFilters?.displayFilters as IIssueDisplayFilterOptions,
      filteredParams
    );

    if (userFilters?.displayFilters?.layout === "gantt_chart") filteredRouteParams.start_target_date = true;

    return filteredRouteParams;
  }

  fetchFilters = async (workspaceSlug: string, userId: string) => {
    try {
      this.userId = userId;
      const _filters = this.handleIssuesLocalFilters.get(EIssuesStoreType.PROFILE, workspaceSlug, userId, undefined);

      const filters: IIssueFilterOptions = this.computedFilters(_filters?.filters);
      const displayFilters: IIssueDisplayFilterOptions = this.computedDisplayFilters(_filters?.display_filters);
      const displayProperties: IIssueDisplayProperties = this.computedDisplayProperties(_filters?.display_properties);

      runInAction(() => {
        set(this.filters, [userId, "filters"], filters);
        set(this.filters, [userId, "displayFilters"], displayFilters);
        set(this.filters, [userId, "displayProperties"], displayProperties);
      });
    } catch (error) {
      throw error;
    }
  };

  updateFilters = async (
    workspaceSlug: string,
    projectId: string | undefined,
    type: EIssueFilterType,
    filters: IIssueFilterOptions | IIssueDisplayFilterOptions | IIssueDisplayProperties,
    userId: string | undefined = undefined
  ) => {
    try {
      if (!userId) throw new Error("user id is required");

      if (isEmpty(this.filters) || isEmpty(this.filters[userId]) || isEmpty(filters)) return;

      const _filters = {
        filters: this.filters[userId].filters as IIssueFilterOptions,
        displayFilters: this.filters[userId].displayFilters as IIssueDisplayFilterOptions,
        displayProperties: this.filters[userId].displayProperties as IIssueDisplayProperties,
      };

      switch (type) {
        case EIssueFilterType.FILTERS:
          const updatedFilters = filters as IIssueFilterOptions;
          _filters.filters = { ..._filters.filters, ...updatedFilters };

          runInAction(() => {
            Object.keys(updatedFilters).forEach((_key) => {
              set(this.filters, [userId, "filters", _key], updatedFilters[_key as keyof IIssueFilterOptions]);
            });
          });

          this.rootIssueStore.projectIssues.fetchIssues(workspaceSlug, userId, "mutation");
          this.handleIssuesLocalFilters.set(EIssuesStoreType.PROFILE, type, workspaceSlug, userId, undefined, {
            filters: _filters.filters,
          });
          break;
        case EIssueFilterType.DISPLAY_FILTERS:
          const updatedDisplayFilters = filters as IIssueDisplayFilterOptions;
          _filters.displayFilters = { ..._filters.displayFilters, ...updatedDisplayFilters };

          // set sub_group_by to null if group_by is set to null
          if (_filters.displayFilters.group_by === null) _filters.displayFilters.sub_group_by = null;
          // set sub_group_by to null if layout is switched to kanban group_by and sub_group_by are same
          if (
            _filters.displayFilters.layout === "kanban" &&
            _filters.displayFilters.group_by === _filters.displayFilters.sub_group_by
          )
            _filters.displayFilters.sub_group_by = null;
          // set group_by to state if layout is switched to kanban and group_by is null
          if (_filters.displayFilters.layout === "kanban" && _filters.displayFilters.group_by === null)
            _filters.displayFilters.group_by = "state";

          runInAction(() => {
            Object.keys(updatedDisplayFilters).forEach((_key) => {
              set(
                this.filters,
                [userId, "displayFilters", _key],
                updatedDisplayFilters[_key as keyof IIssueDisplayFilterOptions]
              );
            });
          });

          this.handleIssuesLocalFilters.set(EIssuesStoreType.PROFILE, type, workspaceSlug, userId, undefined, {
            display_filters: _filters.displayFilters,
          });

          break;
        case EIssueFilterType.DISPLAY_PROPERTIES:
          const updatedDisplayProperties = filters as IIssueDisplayProperties;
          _filters.displayProperties = { ..._filters.displayProperties, ...updatedDisplayProperties };

          runInAction(() => {
            Object.keys(updatedDisplayProperties).forEach((_key) => {
              set(
                this.filters,
                [userId, "displayProperties", _key],
                updatedDisplayProperties[_key as keyof IIssueDisplayProperties]
              );
            });
          });

          this.handleIssuesLocalFilters.set(EIssuesStoreType.PROFILE, type, workspaceSlug, userId, undefined, {
            display_properties: _filters.displayProperties,
          });
          break;
        default:
          break;
      }
    } catch (error) {
      if (userId) this.fetchFilters(workspaceSlug, userId);
      throw error;
    }
  };
}
