import { clone } from "lodash";
import { action, makeObservable, runInAction } from "mobx";
// base class
import { IssuePaginationOptions, TIssue, TIssuesResponse, TLoader, ViewFlags } from "@plane/types";
// services
import { WorkspaceDraftService } from "@/services/issue";
// types
import { BaseIssuesStore, IBaseIssuesStore } from "../helpers/base-issues.store";
import { IIssueRootStore } from "../root.store";
import { IWorkspaceDraftIssuesFilter } from "./filter.store";

export interface IWorkspaceDraftIssues extends IBaseIssuesStore {
  // observable
  viewFlags: ViewFlags;
  // actions
  fetchIssues: (
    workspaceSlug: string,
    loadType: TLoader,
    options: IssuePaginationOptions
  ) => Promise<TIssuesResponse | undefined>;
  fetchIssuesWithExistingPagination: (workspaceSlug: string, loadType: TLoader) => Promise<TIssuesResponse | undefined>;
  fetchNextIssues: (
    workspaceSlug: string,
    groupId?: string,
    subGroupId?: string
  ) => Promise<TIssuesResponse | undefined>;

  createWorkspaceDraftIssue: (workspaceSlug: string, data: Partial<TIssue>) => Promise<TIssue>;
  updateWorkspaceDraftIssue: (workspaceSlug: string, issueId: string, data: Partial<TIssue>) => Promise<void>;
  deleteWorkspaceDraftIssue: (workspaceSlug: string, issueId: string) => Promise<void>;
  moveToIssues: (workspaceSlug: string, issueId: string, data: Partial<TIssue>) => Promise<void>;
}

export class WorkspaceDraftIssues extends BaseIssuesStore implements IWorkspaceDraftIssues {
  viewFlags = {
    enableQuickAdd: true,
    enableIssueCreation: true,
    enableInlineEditing: true,
  };
  // service
  workspaceDraftService;
  // filterStore
  issueFilterStore;

  constructor(_rootStore: IIssueRootStore, issueFilterStore: IWorkspaceDraftIssuesFilter) {
    super(_rootStore, issueFilterStore);

    makeObservable(this, {
      // action
      fetchIssues: action,
      fetchNextIssues: action,
      fetchIssuesWithExistingPagination: action,
      createWorkspaceDraftIssue: action,
      updateWorkspaceDraftIssue: action,
      deleteWorkspaceDraftIssue: action,
    });
    // services
    this.workspaceDraftService = new WorkspaceDraftService();
    // filter store
    this.issueFilterStore = issueFilterStore;
  }

  fetchIssues = async (
    workspaceSlug: string,
    loadType: TLoader,
    options: IssuePaginationOptions,
    isExistingPaginationOptions: boolean = false
  ) => {
    try {
      // set loader and clear store
      runInAction(() => {
        this.setLoader(loadType);
      });
      this.clear(!isExistingPaginationOptions);

      // get params from pagination options
      const params = this.issueFilterStore?.getFilterParams(options, workspaceSlug, undefined, undefined, undefined);
      // call the fetch issues API with the params
      const response = await this.workspaceDraftService.getIssues(workspaceSlug, params, {
        signal: this.controller.signal,
      });

      // after fetching issues, call the base method to process the response further
      this.onfetchIssues(response, options, workspaceSlug, undefined, undefined, !isExistingPaginationOptions);
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
   * @param viewId
   * @param groupId
   * @param subGroupId
   * @returns
   */
  fetchNextIssues = async (workspaceSlug: string, groupId?: string, subGroupId?: string) => {
    const cursorObject = this.getPaginationData(groupId, subGroupId);
    // if there are no pagination options and the next page results do not exist the return
    if (!this.paginationOptions || (cursorObject && !cursorObject?.nextPageResults)) return;
    try {
      // set Loader
      this.setLoader("pagination", groupId, subGroupId);

      // get params from stored pagination options
      const params = this.issueFilterStore?.getFilterParams(
        this.paginationOptions,
        workspaceSlug,
        this.getNextCursor(groupId, subGroupId),
        groupId,
        subGroupId
      );
      // call the fetch issues API with the params for next page in issues
      const response = await this.workspaceDraftService.getIssues(workspaceSlug, params);

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
   * @param viewId
   * @param loadType
   * @returns
   */
  fetchIssuesWithExistingPagination = async (workspaceSlug: string, loadType: TLoader) => {
    if (!this.paginationOptions) return;
    return await this.fetchIssues(workspaceSlug, loadType, this.paginationOptions, true);
  };

  createWorkspaceDraftIssue = async (workspaceSlug: string, data: Partial<TIssue>) => {
    const response = await this.workspaceDraftService.createIssue(workspaceSlug, data);
    this.addIssue(response);
    return response;
  };

  updateWorkspaceDraftIssue = async (workspaceSlug: string, issueId: string, data: Partial<TIssue>) => {
    // Store Before state of the issue
    const issueBeforeUpdate = clone(this.rootIssueStore.issues.getIssueById(issueId));
    try {
      // Update the Respective Stores
      this.rootIssueStore.issues.updateIssue(issueId, data);
      this.updateIssueList({ ...issueBeforeUpdate, ...data } as TIssue, issueBeforeUpdate);

      // call API to update the issue
      await this.workspaceDraftService.updateIssue(workspaceSlug, issueId, data);
    } catch (error) {
      // If errored out update store again to revert the change
      this.rootIssueStore.issues.updateIssue(issueId, issueBeforeUpdate ?? {});
      this.updateIssueList(issueBeforeUpdate, { ...issueBeforeUpdate, ...data } as TIssue);
      throw error;
    }
  };

  deleteWorkspaceDraftIssue = async (workspaceSlug: string, issueId: string) => {
    // Male API call
    await this.workspaceDraftService.deleteIssue(workspaceSlug, issueId);
    // Remove from Respective issue Id list
    runInAction(() => {
      this.removeIssueFromList(issueId);
    });
    // Remove issue from main issue Map store
    this.rootIssueStore.issues.removeIssue(issueId);
  };

  moveToIssues = async (workspaceSlug: string, issueId: string, data: Partial<TIssue>) => {
    // Make API call
    await this.workspaceDraftService.moveToIssues(workspaceSlug, issueId, data);
    // Remove from Respective issue Id list
    runInAction(() => {
      this.removeIssueFromList(issueId);
    });
    // Remove issue from main issue Map store
    this.rootIssueStore.issues.removeIssue(issueId);
  };

  fetchParentStats = (workspaceSlug: string, projectId?: string, id?: string) => {
    // Implement the method logic here
    console.log(`Fetching parent stats for workspace: ${workspaceSlug}, project: ${projectId}, id: ${id}`);
  };
  updateParentStats = (prevIssueState?: TIssue, nextIssueState?: TIssue, id?: string) => {
    // Implement the method logic here
    console.log(`Updating parent stats for issue: ${id}`);
  };
}
