import { action, makeObservable, runInAction } from "mobx";
// plane imports
import { ETeamEntityScope } from "@plane/constants";
// types
import {
  TIssue,
  TLoader,
  ViewFlags,
  IssuePaginationOptions,
  TIssuesResponse,
  TBulkOperationsPayload,
} from "@plane/types";
// services
import { TeamIssuesService } from "@/plane-web/services/teams/team-issues.service";
// base class
import { BaseIssuesStore, IBaseIssuesStore } from "@/store/issue/helpers/base-issues.store";
// store
import { IIssueRootStore } from "@/store/issue/root.store";
import { ITeamIssuesFilter } from "./filter.store";

export interface ITeamIssues extends IBaseIssuesStore {
  viewFlags: ViewFlags;
  // action
  fetchIssues: (
    workspaceSlug: string,
    teamId: string,
    loadType: TLoader,
    option: IssuePaginationOptions
  ) => Promise<TIssuesResponse | undefined>;
  fetchIssuesWithExistingPagination: (
    workspaceSlug: string,
    teamId: string,
    loadType: TLoader
  ) => Promise<TIssuesResponse | undefined>;
  fetchNextIssues: (
    workspaceSlug: string,
    teamId: string,
    groupId?: string,
    subGroupId?: string
  ) => Promise<TIssuesResponse | undefined>;
  createIssue: (workspaceSlug: string, projectId: string, data: Partial<TIssue>, teamId: string) => Promise<TIssue>;
  updateIssue: (workspaceSlug: string, projectId: string, issueId: string, data: Partial<TIssue>) => Promise<void>;
  archiveIssue: (workspaceSlug: string, projectId: string, issueId: string) => Promise<void>;
  removeBulkIssues: (workspaceSlug: string, projectId: string, issueIds: string[]) => Promise<void>;
  archiveBulkIssues: (workspaceSlug: string, projectId: string, issueIds: string[]) => Promise<void>;
  bulkUpdateProperties: (workspaceSlug: string, projectId: string, data: TBulkOperationsPayload) => Promise<void>;

  quickAddIssue: undefined;
}

export class TeamIssues extends BaseIssuesStore implements ITeamIssues {
  viewFlags = {
    enableQuickAdd: false,
    enableIssueCreation: false,
    enableInlineEditing: true,
  };
  // filter store
  teamIssueFilterStore: ITeamIssuesFilter;
  // service
  teamIssuesService: TeamIssuesService;

  constructor(_rootStore: IIssueRootStore, teamIssueFilterStore: ITeamIssuesFilter) {
    super(_rootStore, teamIssueFilterStore);
    makeObservable(this, {
      fetchIssues: action,
      archiveBulkIssues: action,
      fetchNextIssues: action,
      fetchIssuesWithExistingPagination: action,
    });
    // filter store
    this.teamIssueFilterStore = teamIssueFilterStore;
    // service
    this.teamIssuesService = new TeamIssuesService();
  }

  fetchParentStats = async () => { };
  updateParentStats = () => { };

  /**
   * This method is called to fetch the first issues of pagination
   * @param workspaceSlug
   * @param teamId
   * @param loadType
   * @param options
   * @returns
   */
  fetchIssues = async (
    workspaceSlug: string,
    teamId: string,
    loadType: TLoader = "init-loader",
    options: IssuePaginationOptions,
    isExistingPaginationOptions: boolean = false
  ) => {
    try {
      // set loader and clear store
      runInAction(() => {
        this.setLoader(loadType);
        this.clear(!isExistingPaginationOptions, false); // clear while fetching from server.
        if (!this.groupBy) this.clear(!isExistingPaginationOptions, true); // clear while using local to have the no load effect.
      });

      // get params from pagination options
      const params = this.teamIssueFilterStore?.getFilterParams(options, teamId, undefined, undefined, undefined);
      // call the fetch issues API with the params
      const response = await this.teamIssuesService.getIssues(workspaceSlug, teamId, params, {
        signal: this.controller.signal,
      });

      // after fetching issues, call the base method to process the response further
      this.onfetchIssues(response, options, workspaceSlug, teamId, undefined, !isExistingPaginationOptions);
      return response;
    } catch (error) {
      // set loader to undefined if errored out
      this.setLoader(undefined);
      throw error;
    }
  };

  /**
   * This method is called subsequent pages of pagination
   * if groupId/subgroupId is provided, only that specific group's next page is fetched
   * else all the groups' next page is fetched
   * @param workspaceSlug
   * @param teamId
   * @param groupId
   * @param subGroupId
   * @returns
   */
  fetchNextIssues = async (workspaceSlug: string, teamId: string, groupId?: string, subGroupId?: string) => {
    const cursorObject = this.getPaginationData(groupId, subGroupId);
    // if there are no pagination options and the next page results do not exist the return
    if (!this.paginationOptions || (cursorObject && !cursorObject?.nextPageResults)) return;
    try {
      // set Loader
      this.setLoader("pagination", groupId, subGroupId);

      // get params from stored pagination options
      const params = this.teamIssueFilterStore?.getFilterParams(
        this.paginationOptions,
        teamId,
        this.getNextCursor(groupId, subGroupId),
        groupId,
        subGroupId
      );
      // call the fetch issues API with the params for next page in issues
      const response = await this.teamIssuesService.getIssues(workspaceSlug, teamId, params);

      // after the next page of issues are fetched, call the base method to process the response
      this.onfetchNexIssues(response, groupId, subGroupId);
      return response;
    } catch (error) {
      // set Loader as undefined if errored out
      this.setLoader(undefined, groupId, subGroupId);
      throw error;
    }
  };

  /**
   * This Method exists to fetch the first page of the issues with the existing stored pagination
   * This is useful for refetching when filters, groupBy, orderBy etc changes
   * @param workspaceSlug
   * @param teamId
   * @param loadType
   * @returns
   */
  fetchIssuesWithExistingPagination = async (workspaceSlug: string, teamId: string, loadType: TLoader = "mutation") => {
    if (!this.paginationOptions) return;
    return await this.fetchIssues(workspaceSlug, teamId, loadType, this.paginationOptions, true);
  };

  /**
   * Override inherited create issue, to only add issue to the list based on current team issue scope
   * @param workspaceSlug
   * @param projectId
   * @param data
   * @param teamId
   * @returns
   */
  override createIssue = async (workspaceSlug: string, projectId: string, data: Partial<TIssue>, teamId: string) => {
    const currentScope = this.teamIssueFilterStore.getTeamScope(teamId);
    const teamProjectIds = this.rootIssueStore.rootStore.teamRoot.team.getTeamProjectIds(teamId);
    const teamMemberIds = this.rootIssueStore.rootStore.teamRoot.team.getTeamMemberIds(teamId);
    const shouldUpdateList =
      teamProjectIds?.includes(projectId) &&
      (currentScope === ETeamEntityScope.TEAM
        ? data.assignee_ids?.some((assigneeId) => teamMemberIds?.includes(assigneeId))
        : true);

    return await super.createIssue(workspaceSlug, projectId, data, undefined, shouldUpdateList);
  };

  // Using aliased names as they cannot be overridden in other stores
  archiveBulkIssues = this.bulkArchiveIssues;
  updateIssue = this.issueUpdate;
  archiveIssue = this.issueArchive;

  // Setting them as undefined as they can not performed on workspace issues
  quickAddIssue = undefined;
}
