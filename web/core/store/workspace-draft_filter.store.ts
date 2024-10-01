import isArray from "lodash/isArray";
import isEmpty from "lodash/isEmpty";
import pickBy from "lodash/pickBy";
import set from "lodash/set";
import { action, computed, makeObservable, observable, runInAction } from "mobx";
// base class
import { computedFn } from "mobx-utils";
import {
  IIssueFilterOptions,
  IIssueDisplayFilterOptions,
  IIssueDisplayProperties,
  IIssueFilters,
  TIssueParams,
  IssuePaginationOptions,
} from "@plane/types";
import { EIssueFilterType, EIssueLayoutTypes, EIssuesStoreType } from "@/constants/issue";
import { handleIssueQueryParamsByLayout } from "@/helpers/issue.helper";
import { IssueFiltersService } from "@/services/issue_filter.service";
import { IBaseIssueFilterStore, IssueFilterHelperStore } from "./issue/helpers/issue-filter-helper.store";
import { IIssueRootStore } from "./issue/root.store";
// helpers
// types
// constants
// services

export interface IWorkspaceDraftsFilter extends IBaseIssueFilterStore {
  //helper actions
  getFilterParams: (
    options: IssuePaginationOptions,
    workspaceSlug: string,
    groupId: string | undefined,
  ) => Partial<Record<TIssueParams, string | boolean>>;
  // action
  fetchFilters: (workspaceSlug: string) => Promise<void>;
  updateFilters: (
    workspaceSlug: string,
    filterType: EIssueFilterType,
    filters: IIssueFilterOptions | IIssueDisplayFilterOptions | IIssueDisplayProperties
  ) => Promise<void>;
}

export class WorkspaceDraftsFilter extends IssueFilterHelperStore implements IWorkspaceDraftsFilter {
  // observables
  filters: { [workspaceSlug: string]: IIssueFilters } = {};
  // root store
  rootIssueStore: IIssueRootStore;
  // services
  issueFilterService;

  constructor(_rootStore: IIssueRootStore) {
    super();
    makeObservable(this, {
      // observables
      filters: observable,
      // computed
      issueFilters: computed,
      appliedFilters: computed,
      // actions
      fetchFilters: action,
      updateFilters: action,
    });
    // root store
    this.rootIssueStore = _rootStore;
    // services
    this.issueFilterService = new IssueFiltersService();
  }

  get issueFilters() {
    const workspaceSlug = this.rootIssueStore.workspaceSlug;
    if (!workspaceSlug) return undefined;

    return this.getIssueFilters(workspaceSlug);
  }

  get appliedFilters() {
    const workspaceSlug = this.rootIssueStore.workspaceSlug;
    if (!workspaceSlug) return undefined;

    return this.getAppliedFilters(workspaceSlug);
  }

  getIssueFilters(workspaceSlug: string) {
    const displayFilters = this.filters[workspaceSlug] || undefined;
    if (!workspaceSlug || isEmpty(displayFilters)) return undefined;

    const _filters: IIssueFilters = this.computedIssueFilters(displayFilters); // ASK

    return _filters;
  }

  getAppliedFilters(workspaceSlug: string) {
    const userFilters = this.getIssueFilters(workspaceSlug);
    if (!userFilters) return undefined;

    const filteredParams = handleIssueQueryParamsByLayout(EIssueLayoutTypes.LIST, "workspace_drafts");
    if (!filteredParams) return undefined;

    const filteredRouteParams: Partial<Record<TIssueParams, string | boolean>> = this.computedFilteredParams(
      userFilters?.filters as IIssueFilterOptions,
      userFilters?.displayFilters as IIssueDisplayFilterOptions,
      filteredParams
    );

    return filteredRouteParams;
  }

  getFilterParams = computedFn(
    (
      options: IssuePaginationOptions,
      workspaceSlug: string,
      groupId: string | undefined,
    ) => {
      const filterParams = this.getAppliedFilters(workspaceSlug);

      const paginationParams = this.getPaginationParams(filterParams, options, undefined, groupId, undefined);
      return paginationParams;
    }
  );

  fetchFilters = async (workspaceSlug: string) => {
    const _filters = this.handleIssuesLocalFilters.get(EIssuesStoreType.WORKSPACE_DRAFT, workspaceSlug, undefined, undefined);

    const filters: IIssueFilterOptions = this.computedFilters(_filters?.filters);
    const displayFilters: IIssueDisplayFilterOptions = this.computedDisplayFilters(_filters?.display_filters);
    const displayProperties: IIssueDisplayProperties = this.computedDisplayProperties(_filters?.display_properties);

    runInAction(() => {
      set(this.filters, [workspaceSlug, "filters"], filters);
      set(this.filters, [workspaceSlug, "displayFilters"], displayFilters);
      set(this.filters, [workspaceSlug, "displayProperties"], displayProperties);
    });
  };

  updateFilters = async (
    workspaceSlug: string,
    type: EIssueFilterType,
    filters: IIssueFilterOptions | IIssueDisplayFilterOptions | IIssueDisplayProperties
  ) => {
    try {
      if (isEmpty(this.filters) || isEmpty(this.filters[workspaceSlug]) || isEmpty(filters)) return;

      const _filters = {
        filters: this.filters[workspaceSlug].filters as IIssueFilterOptions,
        displayFilters: this.filters[workspaceSlug].displayFilters as IIssueDisplayFilterOptions,
        displayProperties: this.filters[workspaceSlug].displayProperties as IIssueDisplayProperties,
      };

      switch (type) {
        case EIssueFilterType.FILTERS: {
          const updatedFilters = filters as IIssueFilterOptions;
          _filters.filters = { ..._filters.filters, ...updatedFilters };

          runInAction(() => {
            Object.keys(updatedFilters).forEach((_key) => {
              set(
                this.filters,
                [workspaceSlug, "filters", _key],
                updatedFilters[_key as keyof IIssueFilterOptions]);
            });
          });
          const appliedFilters = _filters.filters || {};
          const filteredFilters = pickBy(appliedFilters, (value) => value && isArray(value) && value.length > 0);
          this.rootIssueStore.workspaceDrafts.fetchIssuesWithExistingPagination(
            workspaceSlug,
            isEmpty(filteredFilters) ? "init-loader" : "mutation"
          );
          this.handleIssuesLocalFilters.set(EIssuesStoreType.WORKSPACE_DRAFT, type, workspaceSlug, undefined, undefined, {
            filters: _filters.filters,
          });
          break;
        }
        case EIssueFilterType.DISPLAY_FILTERS: {
          const updatedDisplayFilters = filters as IIssueDisplayFilterOptions;
          _filters.displayFilters = { ..._filters.displayFilters, ...updatedDisplayFilters };

          //Layout switching is not possible here
          // set group_by to state if layout is switched to kanban and group_by is null
            // if (_filters.displayFilters.layout === "kanban" && _filters.displayFilters.group_by === null) {
            //   _filters.displayFilters.group_by = "state";
            //   updatedDisplayFilters.group_by = "state";
            // }

          runInAction(() => {
            Object.keys(updatedDisplayFilters).forEach((_key) => {
              set(
                this.filters,
                [workspaceSlug, "displayFilters", _key],
                updatedDisplayFilters[_key as keyof IIssueDisplayFilterOptions]
              );
            });
          });

          if (this.getShouldReFetchIssues(updatedDisplayFilters)) {
            this.rootIssueStore.workspaceDrafts.fetchIssuesWithExistingPagination(workspaceSlug, "mutation");
          }

          this.handleIssuesLocalFilters.set(EIssuesStoreType.WORKSPACE_DRAFT, type, workspaceSlug, undefined, undefined, {
            display_filters: _filters.displayFilters,
          });

          break;
        }
        case EIssueFilterType.DISPLAY_PROPERTIES: {
          const updatedDisplayProperties = filters as IIssueDisplayProperties;
          _filters.displayProperties = { ..._filters.displayProperties, ...updatedDisplayProperties };

          runInAction(() => {
            Object.keys(updatedDisplayProperties).forEach((_key) => {
              set(
                this.filters,
                [workspaceSlug, "displayProperties", _key],
                updatedDisplayProperties[_key as keyof IIssueDisplayProperties]
              );
            });
          });

          this.handleIssuesLocalFilters.set(EIssuesStoreType.DRAFT, type, workspaceSlug, undefined, undefined, {
            display_properties: _filters.displayProperties,
          });
          break;
        }
        default:
          break;
      }
    } catch (error) {
      this.fetchFilters(workspaceSlug);
      throw error;
    }
  };
}