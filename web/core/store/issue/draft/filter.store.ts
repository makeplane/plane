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
  TIssueKanbanFilters,
  IIssueFilters,
  TIssueParams,
  IssuePaginationOptions,
} from "@plane/types";
import { EIssueFilterType, EIssuesStoreType } from "@/constants/issue";
import { handleIssueQueryParamsByLayout } from "@/helpers/issue.helper";
import { IssueFiltersService } from "@/services/issue_filter.service";
import { IBaseIssueFilterStore, IssueFilterHelperStore } from "../helpers/issue-filter-helper.store";
// helpers
// types
import { IIssueRootStore } from "../root.store";
// constants
// services

export interface IDraftIssuesFilter extends IBaseIssueFilterStore {
  //helper actions
  getFilterParams: (
    options: IssuePaginationOptions,
    projectId: string,
    cursor: string | undefined,
    groupId: string | undefined,
    subGroupId: string | undefined
  ) => Partial<Record<TIssueParams, string | boolean>>;
  // action
  fetchFilters: (workspaceSlug: string, projectId: string) => Promise<void>;
  updateFilters: (
    workspaceSlug: string,
    projectId: string,
    filterType: EIssueFilterType,
    filters: IIssueFilterOptions | IIssueDisplayFilterOptions | IIssueDisplayProperties | TIssueKanbanFilters
  ) => Promise<void>;
}

export class DraftIssuesFilter extends IssueFilterHelperStore implements IDraftIssuesFilter {
  // observables
  filters: { [projectId: string]: IIssueFilters } = {};
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
    const projectId = this.rootIssueStore.projectId;
    if (!projectId) return undefined;

    return this.getIssueFilters(projectId);
  }

  get appliedFilters() {
    const projectId = this.rootIssueStore.projectId;
    if (!projectId) return undefined;

    return this.getAppliedFilters(projectId);
  }

  getIssueFilters(projectId: string) {
    const displayFilters = this.filters[projectId] || undefined;
    if (!projectId || isEmpty(displayFilters)) return undefined;

    const _filters: IIssueFilters = this.computedIssueFilters(displayFilters);

    return _filters;
  }

  getAppliedFilters(projectId: string) {
    const userFilters = this.getIssueFilters(projectId);
    if (!userFilters) return undefined;

    const filteredParams = handleIssueQueryParamsByLayout(userFilters?.displayFilters?.layout, "issues");
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
      projectId: string,
      cursor: string | undefined,
      groupId: string | undefined,
      subGroupId: string | undefined
    ) => {
      const filterParams = this.getAppliedFilters(projectId);

      const paginationParams = this.getPaginationParams(filterParams, options, cursor, groupId, subGroupId);
      return paginationParams;
    }
  );

  fetchFilters = async (workspaceSlug: string, projectId: string) => {
    const _filters = this.handleIssuesLocalFilters.get(EIssuesStoreType.DRAFT, workspaceSlug, projectId, undefined);

    const filters: IIssueFilterOptions = this.computedFilters(_filters?.filters);
    const displayFilters: IIssueDisplayFilterOptions = this.computedDisplayFilters(_filters?.display_filters);
    const displayProperties: IIssueDisplayProperties = this.computedDisplayProperties(_filters?.display_properties);
    const kanbanFilters = {
      group_by: [],
      sub_group_by: [],
    };
    kanbanFilters.group_by = _filters?.kanban_filters?.group_by || [];
    kanbanFilters.sub_group_by = _filters?.kanban_filters?.sub_group_by || [];

    runInAction(() => {
      set(this.filters, [projectId, "filters"], filters);
      set(this.filters, [projectId, "displayFilters"], displayFilters);
      set(this.filters, [projectId, "displayProperties"], displayProperties);
      set(this.filters, [projectId, "kanbanFilters"], kanbanFilters);
    });
  };

  updateFilters = async (
    workspaceSlug: string,
    projectId: string,
    type: EIssueFilterType,
    filters: IIssueFilterOptions | IIssueDisplayFilterOptions | IIssueDisplayProperties | TIssueKanbanFilters
  ) => {
    try {
      if (isEmpty(this.filters) || isEmpty(this.filters[projectId]) || isEmpty(filters)) return;

      const _filters = {
        filters: this.filters[projectId].filters as IIssueFilterOptions,
        displayFilters: this.filters[projectId].displayFilters as IIssueDisplayFilterOptions,
        displayProperties: this.filters[projectId].displayProperties as IIssueDisplayProperties,
        kanbanFilters: this.filters[projectId].kanbanFilters as TIssueKanbanFilters,
      };

      switch (type) {
        case EIssueFilterType.FILTERS: {
          const updatedFilters = filters as IIssueFilterOptions;
          _filters.filters = { ..._filters.filters, ...updatedFilters };

          runInAction(() => {
            Object.keys(updatedFilters).forEach((_key) => {
              set(this.filters, [projectId, "filters", _key], updatedFilters[_key as keyof IIssueFilterOptions]);
            });
          });
          const appliedFilters = _filters.filters || {};
          const filteredFilters = pickBy(appliedFilters, (value) => value && isArray(value) && value.length > 0);
          this.rootIssueStore.draftIssues.fetchIssuesWithExistingPagination(
            workspaceSlug,
            projectId,
            isEmpty(filteredFilters) ? "init-loader" : "mutation"
          );
          this.handleIssuesLocalFilters.set(EIssuesStoreType.DRAFT, type, workspaceSlug, projectId, undefined, {
            filters: _filters.filters,
          });
          break;
        }
        case EIssueFilterType.DISPLAY_FILTERS: {
          const updatedDisplayFilters = filters as IIssueDisplayFilterOptions;
          _filters.displayFilters = { ..._filters.displayFilters, ...updatedDisplayFilters };

          // set sub_group_by to null if group_by is set to null
          if (_filters.displayFilters.group_by === null) {
            _filters.displayFilters.sub_group_by = null;
            updatedDisplayFilters.sub_group_by = null;
          }
          // set sub_group_by to null if layout is switched to kanban group_by and sub_group_by are same
          if (
            _filters.displayFilters.layout === "kanban" &&
            _filters.displayFilters.group_by === _filters.displayFilters.sub_group_by
          ) {
            _filters.displayFilters.sub_group_by = null;
            updatedDisplayFilters.sub_group_by = null;
          }
          // set group_by to state if layout is switched to kanban and group_by is null
          if (_filters.displayFilters.layout === "kanban" && _filters.displayFilters.group_by === null) {
            _filters.displayFilters.group_by = "state";
            updatedDisplayFilters.group_by = "state";
          }

          runInAction(() => {
            Object.keys(updatedDisplayFilters).forEach((_key) => {
              set(
                this.filters,
                [projectId, "displayFilters", _key],
                updatedDisplayFilters[_key as keyof IIssueDisplayFilterOptions]
              );
            });
          });

          if (this.getShouldReFetchIssues(updatedDisplayFilters)) {
            this.rootIssueStore.draftIssues.fetchIssuesWithExistingPagination(workspaceSlug, projectId, "mutation");
          }

          this.handleIssuesLocalFilters.set(EIssuesStoreType.DRAFT, type, workspaceSlug, projectId, undefined, {
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
                [projectId, "displayProperties", _key],
                updatedDisplayProperties[_key as keyof IIssueDisplayProperties]
              );
            });
          });

          this.handleIssuesLocalFilters.set(EIssuesStoreType.DRAFT, type, workspaceSlug, projectId, undefined, {
            display_properties: _filters.displayProperties,
          });
          break;
        }
        case EIssueFilterType.KANBAN_FILTERS: {
          const updatedKanbanFilters = filters as TIssueKanbanFilters;
          _filters.kanbanFilters = { ..._filters.kanbanFilters, ...updatedKanbanFilters };

          const currentUserId = this.rootIssueStore.currentUserId;
          if (currentUserId)
            this.handleIssuesLocalFilters.set(EIssuesStoreType.DRAFT, type, workspaceSlug, projectId, undefined, {
              kanban_filters: _filters.kanbanFilters,
            });

          runInAction(() => {
            Object.keys(updatedKanbanFilters).forEach((_key) => {
              set(
                this.filters,
                [projectId, "kanbanFilters", _key],
                updatedKanbanFilters[_key as keyof TIssueKanbanFilters]
              );
            });
          });

          break;
        }
        default:
          break;
      }
    } catch (error) {
      this.fetchFilters(workspaceSlug, projectId);
      throw error;
    }
  };
}
