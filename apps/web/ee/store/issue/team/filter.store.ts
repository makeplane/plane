import isEmpty from "lodash/isEmpty";
import set from "lodash/set";
import { action, computed, makeObservable, observable, runInAction } from "mobx";
// base class
import { computedFn } from "mobx-utils";
// plane constants
import { EIssueFilterType, TSupportedFilterTypeForUpdate } from "@plane/constants";
// types
import {
  EIssuesStoreType,
  IIssueDisplayFilterOptions,
  IIssueDisplayProperties,
  IIssueFilters,
  IssuePaginationOptions,
  TIssueKanbanFilters,
  TIssueParams,
  TSupportedFilterForUpdate,
  TWorkItemFilterExpression,
} from "@plane/types";
// helpers
import { handleIssueQueryParamsByLayout } from "@plane/utils";
// services
import { TeamspaceWorkItemsService } from "@/plane-web/services/teamspace/teamspace-work-items.service";
// store
import { IBaseIssueFilterStore, IssueFilterHelperStore } from "@/store/issue/helpers/issue-filter-helper.store";
import { IIssueRootStore } from "@/store/issue/root.store";

export interface ITeamIssuesFilter extends IBaseIssueFilterStore {
  //helper actions
  getFilterParams: (
    options: IssuePaginationOptions,
    teamspaceId: string,
    cursor: string | undefined,
    groupId: string | undefined,
    subGroupId: string | undefined
  ) => Partial<Record<TIssueParams, string | boolean>>;
  getIssueFilters(teamspaceId: string): IIssueFilters | undefined;
  // action
  fetchFilters: (workspaceSlug: string, teamspaceId: string) => Promise<void>;
  updateFilterExpression: (
    workspaceSlug: string,
    teamspaceId: string,
    filters: TWorkItemFilterExpression
  ) => Promise<void>;
  updateFilters: (
    workspaceSlug: string,
    teamspaceId: string,
    filterType: TSupportedFilterTypeForUpdate,
    filters: TSupportedFilterForUpdate
  ) => Promise<void>;
}

export class TeamIssuesFilter extends IssueFilterHelperStore implements ITeamIssuesFilter {
  // observables
  filters: { [teamspaceId: string]: IIssueFilters } = {};
  // root store
  rootIssueStore: IIssueRootStore;
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

  // computed
  /**
   * @description This method is used to get the issue filters for the teamspace
   * @returns {IIssueFilters | undefined}
   */
  get issueFilters(): IIssueFilters | undefined {
    const teamspaceId = this.rootIssueStore.teamspaceId;
    if (!teamspaceId) return undefined;
    return this.getIssueFilters(teamspaceId);
  }

  /**
   * @description This method is used to get the applied filters for the teamspace
   * @returns {Partial<Record<TIssueParams, string | boolean>> | undefined}
   */
  get appliedFilters(): Partial<Record<TIssueParams, string | boolean>> | undefined {
    const teamspaceId = this.rootIssueStore.teamspaceId;
    if (!teamspaceId) return undefined;
    return this.getAppliedFilters(teamspaceId);
  }

  // helpers
  /**
   * @description This method is used to get the issue filters for the teamspace
   * @returns {IIssueFilters | undefined}
   */
  getIssueFilters(teamspaceId: string): IIssueFilters | undefined {
    const displayFilters = this.filters[teamspaceId] || undefined;
    if (isEmpty(displayFilters)) return undefined;
    return this.computedIssueFilters(displayFilters);
  }

  /**
   * @description This method is used to get the applied filters for the teamspace
   * @returns {Partial<Record<TIssueParams, string | boolean>> | undefined}
   */
  getAppliedFilters(teamspaceId: string): Partial<Record<TIssueParams, string | boolean>> | undefined {
    // get the user filters for the teamspace
    const userFilters = this.getIssueFilters(teamspaceId);
    if (!userFilters) return undefined;
    // get the filtered params based on the layout
    const filteredParams = handleIssueQueryParamsByLayout(userFilters?.displayFilters?.layout, "team_issues");
    if (!filteredParams) return undefined;
    // get the computed filtered params
    const filteredRouteParams: Partial<Record<TIssueParams, string | boolean>> = this.computedFilteredParams(
      userFilters?.richFilters,
      userFilters?.displayFilters,
      filteredParams
    );
    // return the computed filtered params
    return filteredRouteParams;
  }

  /**
   * @description This method is used to get the filter params for the teamspace
   * @returns {Partial<Record<TIssueParams, string | boolean>>}
   */
  getFilterParams = computedFn(
    (
      options: IssuePaginationOptions,
      teamspaceId: string,
      cursor: string | undefined,
      groupId: string | undefined,
      subGroupId: string | undefined
    ) => {
      const filterParams = this.getAppliedFilters(teamspaceId);
      const paginationParams = this.getPaginationParams(filterParams, options, cursor, groupId, subGroupId);
      return paginationParams;
    }
  );

  /**
   * @description This method is used to fetch the filters for the teamspace
   * @returns {Promise<void>}
   */
  fetchFilters = async (workspaceSlug: string, teamspaceId: string): Promise<void> => {
    try {
      // fetch the filters for the teamspace
      const _filters = await this.teamspaceWorkItemFilterService.fetchTeamspaceWorkItemFilters(
        workspaceSlug,
        teamspaceId
      );
      // compute the filters
      const richFilters = _filters?.rich_filters;
      const displayFilters = this.computedDisplayFilters(_filters?.display_filters);
      const displayProperties = this.computedDisplayProperties(_filters?.display_properties);
      // fetching the kanban toggle helpers in the local storage
      const kanbanFilters = {
        group_by: [],
        sub_group_by: [],
      };
      const currentUserId = this.rootIssueStore.currentUserId;
      if (currentUserId) {
        const _kanbanFilters = this.handleIssuesLocalFilters.get(
          EIssuesStoreType.TEAM,
          workspaceSlug,
          teamspaceId,
          currentUserId
        );
        kanbanFilters.group_by = _kanbanFilters?.kanban_filters?.group_by || [];
        kanbanFilters.sub_group_by = _kanbanFilters?.kanban_filters?.sub_group_by || [];
      }
      // set the filters
      runInAction(() => {
        set(this.filters, [teamspaceId, "richFilters"], richFilters);
        set(this.filters, [teamspaceId, "displayFilters"], displayFilters);
        set(this.filters, [teamspaceId, "displayProperties"], displayProperties);
        set(this.filters, [teamspaceId, "kanbanFilters"], kanbanFilters);
      });
    } catch (error) {
      console.log("error while teamspace fetching filters", error);
      throw error;
    }
  };

  /**
   * NOTE: This method is designed as a fallback function for the work item filter store.
   * Only use this method directly when initializing filter instances.
   * For regular filter updates, use this method as a fallback function for the work item filter store methods instead.
   */
  updateFilterExpression: ITeamIssuesFilter["updateFilterExpression"] = async (workspaceSlug, teamspaceId, filters) => {
    try {
      runInAction(() => {
        set(this.filters, [teamspaceId, "richFilters"], filters);
      });

      this.rootIssueStore.teamIssues.fetchIssuesWithExistingPagination(workspaceSlug, teamspaceId, "mutation");
      await this.teamspaceWorkItemFilterService.patchTeamspaceWorkItemFilters(workspaceSlug, teamspaceId, {
        rich_filters: filters,
      });
    } catch (error) {
      console.log("error while updating rich filters", error);
      throw error;
    }
  };

  updateFilters: ITeamIssuesFilter["updateFilters"] = async (workspaceSlug, teamspaceId, type, filters) => {
    try {
      // check if the filters are empty
      if (isEmpty(this.filters) || isEmpty(this.filters[teamspaceId])) return;
      // get the filters
      const _filters = {
        richFilters: this.filters[teamspaceId].richFilters as TWorkItemFilterExpression,
        displayFilters: this.filters[teamspaceId].displayFilters as IIssueDisplayFilterOptions,
        displayProperties: this.filters[teamspaceId].displayProperties as IIssueDisplayProperties,
        kanbanFilters: this.filters[teamspaceId].kanbanFilters as TIssueKanbanFilters,
      };
      // update the filters based on the type
      switch (type) {
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
                [teamspaceId, "displayFilters", _key],
                updatedDisplayFilters[_key as keyof IIssueDisplayFilterOptions]
              );
            });
          });

          if (this.getShouldClearIssues(updatedDisplayFilters)) {
            this.rootIssueStore.teamIssues.clear(true, true); // clear issues for local store when some filters like layout changes
          }

          if (this.getShouldReFetchIssues(updatedDisplayFilters)) {
            this.rootIssueStore.teamIssues.fetchIssuesWithExistingPagination(workspaceSlug, teamspaceId, "mutation");
          }

          await this.teamspaceWorkItemFilterService.patchTeamspaceWorkItemFilters(workspaceSlug, teamspaceId, {
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
                [teamspaceId, "displayProperties", _key],
                updatedDisplayProperties[_key as keyof IIssueDisplayProperties]
              );
            });
          });

          await this.teamspaceWorkItemFilterService.patchTeamspaceWorkItemFilters(workspaceSlug, teamspaceId, {
            display_properties: _filters.displayProperties,
          });
          break;
        }

        case EIssueFilterType.KANBAN_FILTERS: {
          const updatedKanbanFilters = filters as TIssueKanbanFilters;
          _filters.kanbanFilters = { ..._filters.kanbanFilters, ...updatedKanbanFilters };

          const currentUserId = this.rootIssueStore.currentUserId;
          if (currentUserId)
            this.handleIssuesLocalFilters.set(EIssuesStoreType.TEAM, type, workspaceSlug, teamspaceId, currentUserId, {
              kanban_filters: _filters.kanbanFilters,
            });

          runInAction(() => {
            Object.keys(updatedKanbanFilters).forEach((_key) => {
              set(
                this.filters,
                [teamspaceId, "kanbanFilters", _key],
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
      this.fetchFilters(workspaceSlug, teamspaceId);
      throw error;
    }
  };
}
