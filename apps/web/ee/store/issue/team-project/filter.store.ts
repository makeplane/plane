import isEmpty from "lodash/isEmpty";
import set from "lodash/set";
import { action, computed, makeObservable, observable, runInAction } from "mobx";
// base class
import { computedFn } from "mobx-utils";
// plane constants
import { EIssueFilterType } from "@plane/constants";
import {
  EIssuesStoreType,
  IIssueDisplayFilterOptions,
  IIssueDisplayProperties,
  IIssueFilterOptions,
  IIssueFilters,
  IssuePaginationOptions,
  TIssueKanbanFilters,
  TIssueParams,
} from "@plane/types";
// helpers
import { handleIssueQueryParamsByLayout } from "@plane/utils";
// services
import { TeamspaceWorkItemsService } from "@/plane-web/services/teamspace/teamspace-work-items.service";
// store
import { IBaseIssueFilterStore, IssueFilterHelperStore } from "@/store/issue/helpers/issue-filter-helper.store";
import { IIssueRootStore } from "@/store/issue/root.store";

export interface ITeamProjectWorkItemsFilter extends IBaseIssueFilterStore {
  //helper actions
  getFilterParams: (
    options: IssuePaginationOptions,
    projectId: string,
    cursor: string | undefined,
    groupId: string | undefined,
    subGroupId: string | undefined
  ) => Partial<Record<TIssueParams, string | boolean>>;
  getIssueFilters(projectId: string): IIssueFilters | undefined;
  // action
  fetchFilters: (workspaceSlug: string, teamspaceId: string, projectId: string) => Promise<void>;
  updateFilters: (
    workspaceSlug: string,
    teamspaceId: string,
    filterType: EIssueFilterType,
    filters: IIssueFilterOptions | IIssueDisplayFilterOptions | IIssueDisplayProperties | TIssueKanbanFilters,
    projectId: string
  ) => Promise<void>;
}

export class TeamProjectWorkItemsFilter extends IssueFilterHelperStore implements ITeamProjectWorkItemsFilter {
  // observables
  filters: { [projectId: string]: IIssueFilters } = {};
  // root store
  rootIssueStore;
  // services
  teamspaceWorkItemFilterService;

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
    this.teamspaceWorkItemFilterService = new TeamspaceWorkItemsService();
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
    if (isEmpty(displayFilters)) return undefined;

    const _filters: IIssueFilters = this.computedIssueFilters(displayFilters);

    return _filters;
  }

  getAppliedFilters(projectId: string) {
    const userFilters = this.getIssueFilters(projectId);
    if (!userFilters) return undefined;

    const filteredParams = handleIssueQueryParamsByLayout(
      userFilters?.displayFilters?.layout,
      "team_project_work_items"
    );
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
      return { ...paginationParams, team_project: projectId };
    }
  );

  fetchFilters = async (workspaceSlug: string, teamspaceId: string, projectId: string) => {
    try {
      // current user details
      const currentUserId = this.rootIssueStore.currentUserId;

      // fetching the filters from the local storage
      const _filters = this.handleIssuesLocalFilters.get(
        EIssuesStoreType.TEAM_PROJECT_WORK_ITEMS,
        workspaceSlug,
        projectId,
        currentUserId
      );

      // computed filters
      const filters: IIssueFilterOptions = this.computedFilters(_filters?.filters);
      const displayFilters: IIssueDisplayFilterOptions = this.computedDisplayFilters(_filters?.display_filters);
      const displayProperties: IIssueDisplayProperties = this.computedDisplayProperties(_filters?.display_properties);
      const kanbanFilters = {
        group_by: _filters?.kanban_filters?.group_by || [],
        sub_group_by: _filters?.kanban_filters?.sub_group_by || [],
      };

      runInAction(() => {
        set(this.filters, [projectId, "filters"], filters);
        set(this.filters, [projectId, "displayFilters"], displayFilters);
        set(this.filters, [projectId, "displayProperties"], displayProperties);
        set(this.filters, [projectId, "kanbanFilters"], kanbanFilters);
      });
    } catch (error) {
      console.log("error while fetching teamspace project work items filters", error);
      throw error;
    }
  };

  updateFilters = async (
    workspaceSlug: string,
    teamspaceId: string,
    type: EIssueFilterType,
    filters: IIssueFilterOptions | IIssueDisplayFilterOptions | IIssueDisplayProperties | TIssueKanbanFilters,
    projectId: string
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

          this.rootIssueStore.teamProjectWorkItems.fetchIssuesWithExistingPagination(
            workspaceSlug,
            teamspaceId,
            projectId,
            "mutation"
          );
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
          // set group_by to state_detail.group if layout is switched to kanban and group_by is null
          if (_filters.displayFilters.layout === "kanban" && _filters.displayFilters.group_by === null) {
            _filters.displayFilters.group_by = "state_detail.group";
            updatedDisplayFilters.group_by = "state_detail.group";
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

          if (this.getShouldClearIssues(updatedDisplayFilters)) {
            this.rootIssueStore.teamProjectWorkItems.clear(true, true); // clear issues for local store when some filters like layout changes
          }

          if (this.getShouldReFetchIssues(updatedDisplayFilters)) {
            this.rootIssueStore.teamProjectWorkItems.fetchIssuesWithExistingPagination(
              workspaceSlug,
              teamspaceId,
              projectId,
              "mutation"
            );
          }

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

          break;
        }
        case EIssueFilterType.KANBAN_FILTERS: {
          const updatedKanbanFilters = filters as TIssueKanbanFilters;
          _filters.kanbanFilters = { ..._filters.kanbanFilters, ...updatedKanbanFilters };

          const currentUserId = this.rootIssueStore.currentUserId;
          if (currentUserId)
            this.handleIssuesLocalFilters.set(
              EIssuesStoreType.TEAM_PROJECT_WORK_ITEMS,
              type,
              workspaceSlug,
              projectId,
              currentUserId,
              {
                kanban_filters: _filters.kanbanFilters,
              }
            );

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
      if (projectId) this.fetchFilters(workspaceSlug, teamspaceId, projectId);
      throw error;
    }
  };
}
