import { clone, concat, get, isNil, pull, uniq } from "lodash";
import { action, makeObservable, runInAction } from "mobx";
// base class
import {
  IssuePaginationOptions,
  TIssue,
  TIssuesResponse,
  TLoader,
  ViewFlags,
} from "@plane/types";
// services
import { getDistributionPathsPostUpdate } from "@/helpers/distribution-update.helper";
import { WorkspaceDraftService } from "@/services/workspace-draft.service";
import { IBaseIssuesStore, BaseIssuesStore } from "./issue/helpers/base-issues.store";
import { IIssueRootStore } from "./issue/root.store";
import { IWorkspaceDraftsFilter } from "./workspace-draft_filter.store";
// types

export interface IWorkspaceDrafts extends IBaseIssuesStore {
  // observable
  viewFlags: ViewFlags;
  // actions
  fetchIssues: (
    workspaceSlug: string,
    loadType: TLoader,
    options: IssuePaginationOptions
  ) => Promise<TIssuesResponse | undefined>;
  fetchIssuesWithExistingPagination: (
    workspaceSlug: string,
    loadType: TLoader
  ) => Promise<TIssuesResponse | undefined>;
  fetchNextIssues: (
    workspaceSlug: string,
    viewId: string,
    groupId?: string,
  ) => Promise<TIssuesResponse | undefined>;
  createDraft: (workspaceSlug: string, data: Partial<TIssue>) => Promise<TIssue>;
  updateDraft: (workspaceSlug: string, issueId: string, data: Partial<TIssue>) => Promise<void>;
  quickAddIssue: undefined;
  clear(): void;
  deleteDraft: (workspaceSlug: string, issueId: string) => Promise<void>;
  changeModulesInIssue(
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    addModuleIds: string[],
    removeModuleIds: string[]
  ): Promise<void>;
}

export class WorkspaceDrafts extends BaseIssuesStore implements IWorkspaceDrafts {
  viewFlags = {
    enableQuickAdd: true,
    enableIssueCreation: true,
    enableInlineEditing: true,
  };
  // service
  workspaceDraftService;
  // filterStore
  workspaceDraftFilterStore;

  constructor(_rootStore: IIssueRootStore, workspaceDraftFilterStore: IWorkspaceDraftsFilter) {
    super(_rootStore, workspaceDraftFilterStore);

    makeObservable(this, {
      // action
      fetchIssues: action,
      fetchNextIssues: action,
      fetchIssuesWithExistingPagination: action,
    });
    // services
    this.workspaceDraftService = new WorkspaceDraftService();
    // filter store
    this.workspaceDraftFilterStore = workspaceDraftFilterStore;
  }

  fetchParentStats = async (workspaceSlug: string, projectId?: string) => {
    projectId && this.rootIssueStore.rootStore.projectRoot.project.fetchProjectDetails(workspaceSlug, projectId);
  };

  /** */
  // updateParentStats = () => {};
    updateParentStats = (prevIssueState?: TIssue, nextIssueState?: TIssue, id?: string | undefined) => {
    try {
      const distributionUpdates = getDistributionPathsPostUpdate(
        prevIssueState,
        nextIssueState,
        this.rootIssueStore.rootStore.state.stateMap,
        this.rootIssueStore.rootStore.projectEstimate?.currentActiveEstimate?.estimatePointById
      );

      const cycleId = id ?? this.cycleId;

      cycleId && this.rootIssueStore.rootStore.cycle.updateCycleDistribution(distributionUpdates, cycleId);
    } catch (e) {
      console.warn("could not update cycle statistics");
    }
  };

  /**
   * This method is called to fetch the first issues of pagination
   * @param workspaceSlug
   * @param viewId
   * @param loadType
   * @param options
   * @returns
   */
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
      const params = this.workspaceDraftFilterStore?.getFilterParams(options, workspaceSlug, undefined);
      // call the fetch issues API with the params

      //response is TIssueResponse, which expects TBaseIssue
      const response = await this.workspaceDraftService.getDraftIssues(workspaceSlug, params, {
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
   * if groupId is provided, only that specific group's next page is fetched
   * else all the groups' next page is fetched
   * @param workspaceSlug
   * @param viewId
   * @param groupId
   * @returns
   */
  fetchNextIssues = async (workspaceSlug: string, viewId: string, groupId?: string) => {
    const cursorObject = this.getPaginationData(groupId, undefined);
    // if there are no pagination options and the next page results do not exist the return
    if (!this.paginationOptions || (cursorObject && !cursorObject?.nextPageResults)) return;
    try {
      // set Loader
      this.setLoader("pagination", groupId);

      // get params from stored pagination options
      const params = this.workspaceDraftFilterStore?.getFilterParams(
        this.paginationOptions,
        viewId,
        //this.getNextCursor(groupId, undefined)
        groupId
      );
      // call the fetch issues API with the params for next page in issues
      const response = await this.workspaceDraftService.getDraftIssues(workspaceSlug, params, {
        signal: this.controller.signal,
      });

      // after the next page of issues are fetched, call the base method to process the response
      this.onfetchNexIssues(response, groupId);
      return response;
    } catch (error) {
      // set Loader as undefined if errored out
      this.setLoader(undefined, groupId);
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

  // Setting them as undefined as they can not performed on workspace issues
  quickAddIssue = undefined;

  createDraft = async (workspaceSlug: string, data: Partial<TIssue>) => {
    const response = await this.workspaceDraftService.createDraftIssue(workspaceSlug,data);

    this.addIssue(response);
    return response;
  }

  updateDraft = async (workspaceSlug: string,issueId: string, data: Partial<TIssue>) => {
    // Store Before state of the issue
    const issueBeforeUpdate = clone(this.rootIssueStore.issues.getIssueById(issueId));
    try {
      // Update the Respective Stores
      this.rootIssueStore.issues.updateIssue(issueId, data);
      this.updateIssueList({ ...issueBeforeUpdate, ...data } as TIssue, issueBeforeUpdate);

      // call API to update the issue
      await this.workspaceDraftService.updateDraftIssue(workspaceSlug, issueId, data);

      // call Fetch parent stats
      this.fetchParentStats(workspaceSlug);

      // If the issue is updated to not a draft issue anymore remove from the store list
      if (!isNil(data.is_draft) && !data.is_draft) this.removeIssueFromList(issueId);
    } catch (error) {
      // If errored out update store again to revert the change
      this.rootIssueStore.issues.updateIssue(issueId, issueBeforeUpdate ?? {});
      this.updateIssueList(issueBeforeUpdate, { ...issueBeforeUpdate, ...data } as TIssue);
      throw error;
    }
  }

  deleteDraft = async(workspaceSlug: string, issueId: string) => {
    // Male API call
    await this.workspaceDraftService.deleteDraftIssue(workspaceSlug, issueId);
    // Remove from Respective issue Id list
    runInAction(() => {
      this.removeIssueFromList(issueId);
    });
    // Remove issue from main issue Map store
    this.rootIssueStore.issues.removeIssue(issueId);
  }


  /*
   * change modules array in issue
   * @param workspaceSlug
   * @param projectId
   * @param issueId
   * @param addModuleIds array of modules to be added
   * @param removeModuleIds array of modules to be removed
   */
  async changeModulesInIssue(
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    addModuleIds: string[],
    removeModuleIds: string[]
  ) {
    // keep a copy of the original module ids
    const issueBeforeChanges = clone(this.rootIssueStore.issues.getIssueById(issueId));
    const originalModuleIds = get(this.rootIssueStore.issues.issuesMap, [issueId, "module_ids"]) ?? [];
    try {
      runInAction(() => {
        // get current Module Ids of the issue
        let currentModuleIds = [...originalModuleIds];
        // remove the new issue id to the module issues
        removeModuleIds.forEach((moduleId) => {
          // If module Id is equal to current module Id, them remove Issue from List
          this.moduleId === moduleId && this.removeIssueFromList(issueId);
          currentModuleIds = pull(currentModuleIds, moduleId);
        });

        // If current Module Id is included in the modules list, then add Issue to List
        if (addModuleIds.includes(this.moduleId ?? "")) this.addIssueToList(issueId);
        currentModuleIds = uniq(concat([...currentModuleIds], addModuleIds));

        // For current Issue, update module Ids by calling current store's update Issue, without making an API call
        this.updateDraft(workspaceSlug, issueId, { module_ids: currentModuleIds });
      });

      const issueAfterChanges = clone(this.rootIssueStore.issues.getIssueById(issueId));

      // update parent stats optimistically
      if (addModuleIds.includes(this.moduleId || "") || removeModuleIds.includes(this.moduleId || "")) {
        this.updateParentStats(issueBeforeChanges, issueAfterChanges, this.moduleId);
      }

      //Perform API call
      await this.workspaceDraftService.updateDraftIssue(workspaceSlug, issueId, {
        modules: addModuleIds,
        removed_modules: removeModuleIds,
      });

      if (addModuleIds.includes(this.moduleId || "") || removeModuleIds.includes(this.moduleId || "")) {
        this.fetchParentStats(workspaceSlug, projectId);
      }
    } catch (error) {
      // revert the issue back to its original module ids
      runInAction(() => {
        // If current Module Id is included in the add modules list, then remove Issue from List
        if (addModuleIds.includes(this.moduleId ?? "")) this.removeIssueFromList(issueId);
        // If current Module Id is included in the removed modules list, then add Issue to List
        if (removeModuleIds.includes(this.moduleId ?? "")) this.addIssueToList(issueId);

        // For current Issue, update module Ids by calling current store's update Issue, without making an API call
        this.updateDraft(workspaceSlug, issueId, { module_ids: originalModuleIds });
      });

      throw error;
    }
  }

}
