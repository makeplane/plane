import isEmpty from "lodash/isEmpty";
import set from "lodash/set";
import { action, computed, makeObservable, observable, runInAction } from "mobx";
// base class
import { computedFn } from "mobx-utils";
// types
import {
  IIssueFilterOptions,
  IIssueDisplayFilterOptions,
  IIssueDisplayProperties,
  TIssueKanbanFilters,
  IIssueFilters,
  TIssueParams,
  IssuePaginationOptions,
} from "@plane/types";
// constants
import { EIssueFilterType, EIssuesStoreType } from "@/constants/issue";
// helpers
import { handleIssueQueryParamsByLayout } from "@/helpers/issue.helper";
// services
import { TeamIssuesService } from "@/plane-web/services/teams/team-issues.service";
// store
import { IBaseIssueFilterStore, IssueFilterHelperStore } from "@/store/issue/helpers/issue-filter-helper.store";
import { IIssueRootStore } from "@/store/issue/root.store";

export interface ITeamIssuesFilter extends IBaseIssueFilterStore {
  //helper actions
  getFilterParams: (
    options: IssuePaginationOptions,
    teamId: string,
    cursor: string | undefined,
    groupId: string | undefined,
    subGroupId: string | undefined
  ) => Partial<Record<TIssueParams, string | boolean>>;
  getIssueFilters(teamId: string): IIssueFilters | undefined;
  // action
  fetchFilters: (workspaceSlug: string, teamId: string) => Promise<void>;
  updateFilters: (
    workspaceSlug: string,
    teamId: string,
    filterType: EIssueFilterType,
    filters: IIssueFilterOptions | IIssueDisplayFilterOptions | IIssueDisplayProperties | TIssueKanbanFilters
  ) => Promise<void>;
}

export class TeamIssuesFilter extends IssueFilterHelperStore implements ITeamIssuesFilter {
  // observables
  filters: { [teamId: string]: IIssueFilters } = {};
  // root store
  rootIssueStore: IIssueRootStore;
  // services
  teamIssueFilterService;

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
    this.teamIssueFilterService = new TeamIssuesService();
  }

  // computed
  /**
   * @description This method is used to get the issue filters for the team
   * @returns {IIssueFilters | undefined}
   */
  get issueFilters(): IIssueFilters | undefined {
    const teamId = this.rootIssueStore.teamId;
    if (!teamId) return undefined;
    return this.getIssueFilters(teamId);
  }

  /**
   * @description This method is used to get the applied filters for the team
   * @returns {Partial<Record<TIssueParams, string | boolean>> | undefined}
   */
  get appliedFilters(): Partial<Record<TIssueParams, string | boolean>> | undefined {
    const teamId = this.rootIssueStore.teamId;
    if (!teamId) return undefined;
    return this.getAppliedFilters(teamId);
  }

  /**
   * @description This method is used to get the issue filters for the team
   * @returns {IIssueFilters | undefined}
   */
  getIssueFilters(teamId: string): IIssueFilters | undefined {
    const displayFilters = this.filters[teamId] || undefined;
    if (isEmpty(displayFilters)) return undefined;
    return this.computedIssueFilters(displayFilters);
  }

  /**
   * @description This method is used to get the applied filters for the team
   * @returns {Partial<Record<TIssueParams, string | boolean>> | undefined}
   */
  getAppliedFilters(teamId: string): Partial<Record<TIssueParams, string | boolean>> | undefined {
    // get the user filters for the team
    const userFilters = this.getIssueFilters(teamId);
    if (!userFilters) return undefined;
    // get the filtered params based on the layout
    const filteredParams = handleIssueQueryParamsByLayout(userFilters?.displayFilters?.layout, "team_issues");
    if (!filteredParams) return undefined;
    // get the computed filtered params
    const filteredRouteParams: Partial<Record<TIssueParams, string | boolean>> = this.computedFilteredParams(
      userFilters?.filters as IIssueFilterOptions,
      userFilters?.displayFilters as IIssueDisplayFilterOptions,
      filteredParams
    );
    // return the computed filtered params
    return filteredRouteParams;
  }

  /**
   * @description This method is used to get the filter params for the team
   * @returns {Partial<Record<TIssueParams, string | boolean>>}
   */
  getFilterParams = computedFn(
    (
      options: IssuePaginationOptions,
      teamId: string,
      cursor: string | undefined,
      groupId: string | undefined,
      subGroupId: string | undefined
    ) => {
      const filterParams = this.getAppliedFilters(teamId);
      const paginationParams = this.getPaginationParams(filterParams, options, cursor, groupId, subGroupId);
      return paginationParams;
    }
  );

  /**
   * @description This method is used to fetch the filters for the team
   * @returns {Promise<void>}
   */
  fetchFilters = async (workspaceSlug: string, teamId: string): Promise<void> => {
    try {
      // fetch the filters for the team
      const _filters = await this.teamIssueFilterService.fetchTeamIssueFilters(workspaceSlug, teamId);
      // compute the filters
      const filters = this.computedFilters(_filters?.filters);
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
          teamId,
          currentUserId
        );
        kanbanFilters.group_by = _kanbanFilters?.kanban_filters?.group_by || [];
        kanbanFilters.sub_group_by = _kanbanFilters?.kanban_filters?.sub_group_by || [];
      }
      // set the filters
      runInAction(() => {
        set(this.filters, [teamId, "filters"], filters);
        set(this.filters, [teamId, "displayFilters"], displayFilters);
        set(this.filters, [teamId, "displayProperties"], displayProperties);
        set(this.filters, [teamId, "kanbanFilters"], kanbanFilters);
      });
    } catch (error) {
      console.log("error while team fetching filters", error);
      throw error;
    }
  };

  updateFilters = async (
    workspaceSlug: string,
    teamId: string,
    type: EIssueFilterType,
    filters: IIssueFilterOptions | IIssueDisplayFilterOptions | IIssueDisplayProperties | TIssueKanbanFilters
  ) => {
    try {
      // check if the filters are empty
      if (isEmpty(this.filters) || isEmpty(this.filters[teamId]) || isEmpty(filters)) return;
      // get the filters
      const _filters = {
        filters: this.filters[teamId].filters as IIssueFilterOptions,
        displayFilters: this.filters[teamId].displayFilters as IIssueDisplayFilterOptions,
        displayProperties: this.filters[teamId].displayProperties as IIssueDisplayProperties,
        kanbanFilters: this.filters[teamId].kanbanFilters as TIssueKanbanFilters,
      };
      // update the filters based on the type
      switch (type) {
        case EIssueFilterType.FILTERS: {
          const updatedFilters = filters as IIssueFilterOptions;
          _filters.filters = { ..._filters.filters, ...updatedFilters };

          runInAction(() => {
            Object.keys(updatedFilters).forEach((_key) => {
              set(this.filters, [teamId, "filters", _key], updatedFilters[_key as keyof IIssueFilterOptions]);
            });
          });

          this.rootIssueStore.teamIssues.fetchIssuesWithExistingPagination(workspaceSlug, teamId, "mutation");
          await this.teamIssueFilterService.patchTeamIssueFilters(workspaceSlug, teamId, {
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
                [teamId, "displayFilters", _key],
                updatedDisplayFilters[_key as keyof IIssueDisplayFilterOptions]
              );
            });
          });

          if (this.getShouldClearIssues(updatedDisplayFilters)) {
            this.rootIssueStore.teamIssues.clear(true, true); // clear issues for local store when some filters like layout changes
          }

          if (this.getShouldReFetchIssues(updatedDisplayFilters)) {
            this.rootIssueStore.teamIssues.fetchIssuesWithExistingPagination(workspaceSlug, teamId, "mutation");
          }

          await this.teamIssueFilterService.patchTeamIssueFilters(workspaceSlug, teamId, {
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
                [teamId, "displayProperties", _key],
                updatedDisplayProperties[_key as keyof IIssueDisplayProperties]
              );
            });
          });

          await this.teamIssueFilterService.patchTeamIssueFilters(workspaceSlug, teamId, {
            display_properties: _filters.displayProperties,
          });
          break;
        }

        case EIssueFilterType.KANBAN_FILTERS: {
          const updatedKanbanFilters = filters as TIssueKanbanFilters;
          _filters.kanbanFilters = { ..._filters.kanbanFilters, ...updatedKanbanFilters };

          const currentUserId = this.rootIssueStore.currentUserId;
          if (currentUserId)
            this.handleIssuesLocalFilters.set(EIssuesStoreType.TEAM, type, workspaceSlug, teamId, currentUserId, {
              kanban_filters: _filters.kanbanFilters,
            });

          runInAction(() => {
            Object.keys(updatedKanbanFilters).forEach((_key) => {
              set(
                this.filters,
                [teamId, "kanbanFilters", _key],
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
      this.fetchFilters(workspaceSlug, teamId);
      throw error;
    }
  };
}
