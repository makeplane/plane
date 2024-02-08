import { action, computed, makeObservable, observable, runInAction } from "mobx";
import isEmpty from "lodash/isEmpty";
import set from "lodash/set";
import pickBy from "lodash/pickBy";
import isArray from "lodash/isArray";
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
  TIssueKanbanFilters,
  IIssueFilters,
  TIssueParams,
} from "@plane/types";
// constants
import { EIssueFilterType, EIssuesStoreType } from "constants/issue";
// services
import { IssueFiltersService } from "services/issue_filter.service";

export interface ICycleIssuesFilter {
  // observables
  filters: Record<string, IIssueFilters>; // Record defines cycleId as key and IIssueFilters as value
  // computed
  issueFilters: IIssueFilters | undefined;
  appliedFilters: Partial<Record<TIssueParams, string | boolean>> | undefined;
  // action
  fetchFilters: (workspaceSlug: string, projectId: string, cycleId: string) => Promise<void>;
  updateFilters: (
    workspaceSlug: string,
    projectId: string,
    filterType: EIssueFilterType,
    filters: IIssueFilterOptions | IIssueDisplayFilterOptions | IIssueDisplayProperties | TIssueKanbanFilters,
    cycleId?: string | undefined
  ) => Promise<void>;
}

export class CycleIssuesFilter extends IssueFilterHelperStore implements ICycleIssuesFilter {
  // observables
  filters: { [cycleId: string]: IIssueFilters } = {};
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
    const cycleId = this.rootIssueStore.cycleId;
    if (!cycleId) return undefined;

    const displayFilters = this.filters[cycleId] || undefined;
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

    if (userFilters?.displayFilters?.layout === "spreadsheet") filteredRouteParams.sub_issue = false;

    return filteredRouteParams;
  }

  fetchFilters = async (workspaceSlug: string, projectId: string, cycleId: string) => {
    try {
      const _filters = await this.issueFilterService.fetchCycleIssueFilters(workspaceSlug, projectId, cycleId);

      const filters: IIssueFilterOptions = this.computedFilters(_filters?.filters);
      const displayFilters: IIssueDisplayFilterOptions = this.computedDisplayFilters(_filters?.display_filters);
      const displayProperties: IIssueDisplayProperties = this.computedDisplayProperties(_filters?.display_properties);

      // fetching the kanban toggle helpers in the local storage
      const kanbanFilters = {
        group_by: [],
        sub_group_by: [],
      };
      const currentUserId = this.rootIssueStore.currentUserId;
      if (currentUserId) {
        const _kanbanFilters = this.handleIssuesLocalFilters.get(
          EIssuesStoreType.CYCLE,
          workspaceSlug,
          cycleId,
          currentUserId
        );
        kanbanFilters.group_by = _kanbanFilters?.kanban_filters?.group_by || [];
        kanbanFilters.sub_group_by = _kanbanFilters?.kanban_filters?.sub_group_by || [];
      }

      runInAction(() => {
        set(this.filters, [cycleId, "filters"], filters);
        set(this.filters, [cycleId, "displayFilters"], displayFilters);
        set(this.filters, [cycleId, "displayProperties"], displayProperties);
        set(this.filters, [cycleId, "kanbanFilters"], kanbanFilters);
      });
    } catch (error) {
      throw error;
    }
  };

  updateFilters = async (
    workspaceSlug: string,
    projectId: string,
    type: EIssueFilterType,
    filters: IIssueFilterOptions | IIssueDisplayFilterOptions | IIssueDisplayProperties | TIssueKanbanFilters,
    cycleId: string | undefined = undefined
  ) => {
    try {
      if (!cycleId) throw new Error("Cycle id is required");
      if (isEmpty(this.filters) || isEmpty(this.filters[cycleId]) || isEmpty(filters)) return;

      const _filters = {
        filters: this.filters[cycleId].filters as IIssueFilterOptions,
        displayFilters: this.filters[cycleId].displayFilters as IIssueDisplayFilterOptions,
        displayProperties: this.filters[cycleId].displayProperties as IIssueDisplayProperties,
        kanbanFilters: this.filters[cycleId].kanbanFilters as TIssueKanbanFilters,
      };

      switch (type) {
        case EIssueFilterType.FILTERS:
          const updatedFilters = filters as IIssueFilterOptions;
          _filters.filters = { ..._filters.filters, ...updatedFilters };

          runInAction(() => {
            Object.keys(updatedFilters).forEach((_key) => {
              set(this.filters, [cycleId, "filters", _key], updatedFilters[_key as keyof IIssueFilterOptions]);
            });
          });

          const appliedFilters = _filters.filters || {};
          const filteredFilters = pickBy(appliedFilters, (value) => value && isArray(value) && value.length > 0);
          this.rootIssueStore.cycleIssues.fetchIssues(
            workspaceSlug,
            projectId,
            isEmpty(filteredFilters) ? "init-loader" : "mutation",
            cycleId
          );
          await this.issueFilterService.patchCycleIssueFilters(workspaceSlug, projectId, cycleId, {
            filters: _filters.filters,
          });
          break;
        case EIssueFilterType.DISPLAY_FILTERS:
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

          // set sub_issue to false if layout is switched to spreadsheet and sub_issue is true
          if (_filters.displayFilters.layout === "spreadsheet" && _filters.displayFilters.sub_issue === true) {
            _filters.displayFilters.sub_issue = false;
            updatedDisplayFilters.sub_issue = false;
          }

          runInAction(() => {
            Object.keys(updatedDisplayFilters).forEach((_key) => {
              set(
                this.filters,
                [cycleId, "displayFilters", _key],
                updatedDisplayFilters[_key as keyof IIssueDisplayFilterOptions]
              );
            });
          });

          if (this.requiresServerUpdate(updatedDisplayFilters))
            this.rootIssueStore.cycleIssues.fetchIssues(workspaceSlug, projectId, "mutation", cycleId);

          await this.issueFilterService.patchCycleIssueFilters(workspaceSlug, projectId, cycleId, {
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
                [cycleId, "displayProperties", _key],
                updatedDisplayProperties[_key as keyof IIssueDisplayProperties]
              );
            });
          });

          await this.issueFilterService.patchCycleIssueFilters(workspaceSlug, projectId, cycleId, {
            display_properties: _filters.displayProperties,
          });
          break;

        case EIssueFilterType.KANBAN_FILTERS:
          const updatedKanbanFilters = filters as TIssueKanbanFilters;
          _filters.kanbanFilters = { ..._filters.kanbanFilters, ...updatedKanbanFilters };

          const currentUserId = this.rootIssueStore.currentUserId;
          if (currentUserId)
            this.handleIssuesLocalFilters.set(EIssuesStoreType.PROJECT, type, workspaceSlug, cycleId, currentUserId, {
              kanban_filters: _filters.kanbanFilters,
            });

          runInAction(() => {
            Object.keys(updatedKanbanFilters).forEach((_key) => {
              set(
                this.filters,
                [cycleId, "kanbanFilters", _key],
                updatedKanbanFilters[_key as keyof TIssueKanbanFilters]
              );
            });
          });

          break;
        default:
          break;
      }
    } catch (error) {
      if (cycleId) this.fetchFilters(workspaceSlug, projectId, cycleId);
      throw error;
    }
  };
}
