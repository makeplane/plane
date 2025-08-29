import { action, makeObservable, runInAction } from "mobx";
// base class
import { TIssue, TLoader, IssuePaginationOptions, TIssuesResponse, TBulkOperationsPayload } from "@plane/types";
// services
import { TeamspaceWorkItemsService } from "@/plane-web/services/teamspace/teamspace-work-items.service";
// base class
import { BaseIssuesStore, IBaseIssuesStore } from "@/store/issue/helpers/base-issues.store";
// store
import { IIssueRootStore } from "@/store/issue/root.store";
import { ITeamProjectWorkItemsFilter } from "./filter.store";

export interface ITeamProjectWorkItems extends IBaseIssuesStore {
  // actions
  fetchIssues: (
    workspaceSlug: string,
    teamspaceId: string,
    projectId: string,
    loadType: TLoader,
    options: IssuePaginationOptions
  ) => Promise<TIssuesResponse | undefined>;
  fetchIssuesWithExistingPagination: (
    workspaceSlug: string,
    teamspaceId: string,
    projectId: string,
    loadType: TLoader
  ) => Promise<TIssuesResponse | undefined>;
  fetchNextIssues: (
    workspaceSlug: string,
    teamspaceId: string,
    projectId: string,
    groupId?: string,
    subGroupId?: string
  ) => Promise<TIssuesResponse | undefined>;

  createIssue: (
    workspaceSlug: string,
    projectId: string,
    data: Partial<TIssue>,
    teamspaceId: string
  ) => Promise<TIssue>;
  updateIssue: (workspaceSlug: string, projectId: string, issueId: string, data: Partial<TIssue>) => Promise<void>;
  archiveIssue: (workspaceSlug: string, projectId: string, issueId: string) => Promise<void>;
  removeBulkIssues: (workspaceSlug: string, projectId: string, issueIds: string[]) => Promise<void>;
  archiveBulkIssues: (workspaceSlug: string, projectId: string, issueIds: string[]) => Promise<void>;
  bulkUpdateProperties: (workspaceSlug: string, projectId: string, data: TBulkOperationsPayload) => Promise<void>;

  quickAddIssue: undefined;
}

export class TeamProjectWorkItems extends BaseIssuesStore implements ITeamProjectWorkItems {
  // filter store
  teamspaceProjectWorkItemsFilterStore: ITeamProjectWorkItemsFilter;
  // service
  teamspaceWorkItemsService: TeamspaceWorkItemsService;

  constructor(_rootStore: IIssueRootStore, teamspaceProjectWorkItemsFilterStore: ITeamProjectWorkItemsFilter) {
    super(_rootStore, teamspaceProjectWorkItemsFilterStore);
    makeObservable(this, {
      // action
      fetchIssues: action,
      fetchNextIssues: action,
      fetchIssuesWithExistingPagination: action,
    });
    // filter store
    this.teamspaceProjectWorkItemsFilterStore = teamspaceProjectWorkItemsFilterStore;
    // service
    this.teamspaceWorkItemsService = new TeamspaceWorkItemsService();
  }

  fetchParentStats = async () => {};
  updateParentStats = () => {};

  /**
   * This method is called to fetch the first issues of pagination
   * @param workspaceSlug
   * @param teamspaceId
   * @param loadType
   * @param options
   * @returns
   */
  fetchIssues = async (
    workspaceSlug: string,
    teamspaceId: string,
    projectId: string,
    loadType: TLoader,
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
      const params = this.teamspaceProjectWorkItemsFilterStore?.getFilterParams(
        options,
        projectId,
        undefined,
        undefined,
        undefined
      );
      // call the fetch issues API with the params
      const response = await this.teamspaceWorkItemsService.getWorkItems(workspaceSlug, teamspaceId, params, {
        signal: this.controller.signal,
      });

      // after fetching issues, call the base method to process the response further
      this.onfetchIssues(response, options, workspaceSlug, teamspaceId, projectId, !isExistingPaginationOptions);
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
   * @param teamspaceId
   * @param groupId
   * @param subGroupId
   * @returns
   */
  fetchNextIssues = async (
    workspaceSlug: string,
    teamspaceId: string,
    projectId: string,
    groupId?: string,
    subGroupId?: string
  ) => {
    const cursorObject = this.getPaginationData(groupId, subGroupId);
    // if there are no pagination options and the next page results do not exist the return
    if (!this.paginationOptions || (cursorObject && !cursorObject?.nextPageResults)) return;
    try {
      // set Loader
      this.setLoader("pagination", groupId, subGroupId);

      // get params from stored pagination options
      const params = this.teamspaceProjectWorkItemsFilterStore?.getFilterParams(
        this.paginationOptions,
        projectId,
        this.getNextCursor(groupId, subGroupId),
        groupId,
        subGroupId
      );
      // call the fetch issues API with the params for next page in issues
      const response = await this.teamspaceWorkItemsService.getWorkItems(workspaceSlug, teamspaceId, params);

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
   * @param teamspaceId
   * @param loadType
   * @returns
   */
  fetchIssuesWithExistingPagination = async (
    workspaceSlug: string,
    teamspaceId: string,
    projectId: string,
    loadType: TLoader
  ) => {
    if (!this.paginationOptions) return;
    return await this.fetchIssues(workspaceSlug, teamspaceId, projectId, loadType, this.paginationOptions, true);
  };

  /**
   * Override inherited create issue, to only add issue to the list if the project is part of the teamspace
   * @param workspaceSlug
   * @param projectId
   * @param data
   * @param teamspaceId
   * @returns
   */
  override createIssue = async (
    workspaceSlug: string,
    projectId: string,
    data: Partial<TIssue>,
    teamspaceId: string
  ) => {
    const teamspaceProjectIds =
      this.rootIssueStore.rootStore.teamspaceRoot.teamspaces.getTeamspaceProjectIds(teamspaceId);
    return await super.createIssue(workspaceSlug, projectId, data, undefined, teamspaceProjectIds?.includes(projectId));
  };

  // Using aliased names as they cannot be overridden in other stores
  archiveBulkIssues = this.bulkArchiveIssues;
  updateIssue = this.issueUpdate;
  archiveIssue = this.issueArchive;

  // Setting them as undefined as they can not performed on teamspace views
  quickAddIssue = undefined;
}
