<<<<<<< HEAD
import concat from "lodash/concat";
import pull from "lodash/pull";
import set from "lodash/set";
import union from "lodash/union";
import update from "lodash/update";
import { action, makeObservable, observable, runInAction, computed } from "mobx";
// types
import {
  TIssue,
  TGroupedIssues,
  TSubGroupedIssues,
  TLoader,
  TUnGroupedIssues,
  ViewFlags,
  TBulkOperationsPayload,
} from "@plane/types";
=======
import { action, makeObservable, runInAction, } from "mobx";
// types
import { TIssue, TLoader, ViewFlags, IssuePaginationOptions, TIssuesResponse, TBulkOperationsPayload } from "@plane/types";
>>>>>>> a0e16692dafacf924ab064e23de17f9a4dbaf707
// helpers
// base class
import { BaseIssuesStore, IBaseIssuesStore } from "../helpers/base-issues.store";
// services
import { IIssueRootStore } from "../root.store";
import { IProjectIssuesFilter } from "./filter.store";

export interface IProjectIssues extends IBaseIssuesStore {
  viewFlags: ViewFlags;
  // action
  fetchIssues: (
    workspaceSlug: string,
    projectId: string,
    loadType: TLoader,
    option: IssuePaginationOptions
  ) => Promise<TIssuesResponse | undefined>;
  fetchIssuesWithExistingPagination: (
    workspaceSlug: string,
    projectId: string,
    loadType: TLoader
  ) => Promise<TIssuesResponse | undefined>;
  fetchNextIssues: (
    workspaceSlug: string,
    projectId: string,
    groupId?: string,
    subGroupId?: string
  ) => Promise<TIssuesResponse | undefined>;

  createIssue: (workspaceSlug: string, projectId: string, data: Partial<TIssue>) => Promise<TIssue>;
  updateIssue: (workspaceSlug: string, projectId: string, issueId: string, data: Partial<TIssue>) => Promise<void>;
  archiveIssue: (workspaceSlug: string, projectId: string, issueId: string) => Promise<void>;
  quickAddIssue: (workspaceSlug: string, projectId: string, data: TIssue) => Promise<TIssue | undefined>;
  removeBulkIssues: (workspaceSlug: string, projectId: string, issueIds: string[]) => Promise<void>;
  archiveBulkIssues: (workspaceSlug: string, projectId: string, issueIds: string[]) => Promise<void>;
<<<<<<< HEAD
  subscribeBulkIssues: (workspaceSlug: string, projectId: string, issueIds: string[]) => Promise<void>;
=======
>>>>>>> a0e16692dafacf924ab064e23de17f9a4dbaf707
  bulkUpdateProperties: (workspaceSlug: string, projectId: string, data: TBulkOperationsPayload) => Promise<void>;
}

export class ProjectIssues extends BaseIssuesStore implements IProjectIssues {
  viewFlags = {
    enableQuickAdd: true,
    enableIssueCreation: true,
    enableInlineEditing: true,
  };

  // filter store
  issueFilterStore: IProjectIssuesFilter;

  constructor(_rootStore: IIssueRootStore, issueFilterStore: IProjectIssuesFilter) {
    super(_rootStore, issueFilterStore);
    makeObservable(this, {
      fetchIssues: action,
<<<<<<< HEAD
      createIssue: action,
      updateIssue: action,
      removeIssue: action,
      archiveIssue: action,
      removeBulkIssues: action,
      archiveBulkIssues: action,
      subscribeBulkIssues: action,
      bulkUpdateProperties: action,
=======
      fetchNextIssues: action,
      fetchIssuesWithExistingPagination: action,

>>>>>>> a0e16692dafacf924ab064e23de17f9a4dbaf707
      quickAddIssue: action,
    });
    // filter store
    this.issueFilterStore = issueFilterStore;
  }

  /**
   * Fetches the project details
   * @param workspaceSlug
   * @param projectId
   */
  fetchParentStats = async (workspaceSlug: string, projectId?: string) => {
    projectId && this.rootIssueStore.rootStore.projectRoot.project.fetchProjectDetails(workspaceSlug, projectId);
  };

  /**
   * This method is called to fetch the first issues of pagination
   * @param workspaceSlug
   * @param projectId
   * @param loadType
   * @param options
   * @returns
   */
  fetchIssues = async (
    workspaceSlug: string,
    projectId: string,
    loadType: TLoader = "init-loader",
    options: IssuePaginationOptions
  ) => {
    try {
      // set loader and clear store
      runInAction(() => {
        this.setLoader(loadType);
      });
      this.clear();

      // get params from pagination options
      const params = this.issueFilterStore?.getFilterParams(options, undefined, undefined, undefined);
      // call the fetch issues API with the params
      const response = await this.issueService.getIssues(workspaceSlug, projectId, params);

      // after fetching issues, call the base method to process the response further
      this.onfetchIssues(response, options, workspaceSlug, projectId);
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
   * @param projectId
   * @param groupId
   * @param subGroupId
   * @returns
   */
  fetchNextIssues = async (workspaceSlug: string, projectId: string, groupId?: string, subGroupId?: string) => {
    const cursorObject = this.getPaginationData(groupId, subGroupId);
    // if there are no pagination options and the next page results do not exist the return
    if (!this.paginationOptions || (cursorObject && !cursorObject?.nextPageResults)) return;
    try {
      // set Loader
      this.setLoader("pagination", groupId, subGroupId);

      // get params from stored pagination options
      const params = this.issueFilterStore?.getFilterParams(
        this.paginationOptions,
        cursorObject?.nextCursor,
        groupId,
        subGroupId
      );
      // call the fetch issues API with the params for next page in issues
      const response = await this.issueService.getIssues(workspaceSlug, projectId, params);

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
   * @param projectId
   * @param loadType
   * @returns
   */
  fetchIssuesWithExistingPagination = async (
    workspaceSlug: string,
    projectId: string,
    loadType: TLoader = "mutation"
  ) => {
    if (!this.paginationOptions) return;
    return await this.fetchIssues(workspaceSlug, projectId, loadType, this.paginationOptions);
  };

<<<<<<< HEAD
  removeIssue = async (workspaceSlug: string, projectId: string, issueId: string) => {
    try {
      await this.issueService.deleteIssue(workspaceSlug, projectId, issueId);

      runInAction(() => {
        pull(this.issues[projectId], issueId);
      });

      this.rootStore.issues.removeIssue(issueId);
      this.rootIssueStore.rootStore.projectRoot.project.fetchProjectDetails(workspaceSlug, projectId);
    } catch (error) {
      throw error;
    }
  };

  archiveIssue = async (workspaceSlug: string, projectId: string, issueId: string) => {
    try {
      const response = await this.issueArchiveService.archiveIssue(workspaceSlug, projectId, issueId);

      runInAction(() => {
        this.rootStore.issues.updateIssue(issueId, {
          archived_at: response.archived_at,
        });
        pull(this.issues[projectId], issueId);
      });

      this.rootIssueStore.rootStore.projectRoot.project.fetchProjectDetails(workspaceSlug, projectId);
    } catch (error) {
      throw error;
    }
  };

  quickAddIssue = async (workspaceSlug: string, projectId: string, data: TIssue) => {
    try {
      runInAction(() => {
        this.issues[projectId].push(data.id);
        this.rootStore.issues.addIssue([data]);
      });

      const response = await this.createIssue(workspaceSlug, projectId, data);

      const quickAddIssueIndex = this.issues[projectId].findIndex((_issueId) => _issueId === data.id);

      if (quickAddIssueIndex >= 0) {
        runInAction(() => {
          this.issues[projectId].splice(quickAddIssueIndex, 1);
          this.rootStore.issues.removeIssue(data.id);
        });
      }

      const currentCycleId = data.cycle_id !== "" && data.cycle_id === "None" ? undefined : data.cycle_id;
      const currentModuleIds =
        data.module_ids && data.module_ids.length > 0 ? data.module_ids.filter((moduleId) => moduleId != "None") : [];

      const multipleIssuePromises = [];
      if (currentCycleId) {
        multipleIssuePromises.push(
          this.rootStore.cycleIssues.addCycleToIssue(workspaceSlug, projectId, currentCycleId, response.id)
        );
      }

      if (currentModuleIds.length > 0) {
        multipleIssuePromises.push(
          this.rootStore.moduleIssues.changeModulesInIssue(workspaceSlug, projectId, response.id, currentModuleIds, [])
        );
      }

      if (multipleIssuePromises && multipleIssuePromises.length > 0) {
        await Promise.all(multipleIssuePromises);
      }

      return response;
    } catch (error) {
      this.fetchIssues(workspaceSlug, projectId, "mutation");
      throw error;
    }
  };

  removeBulkIssues = async (workspaceSlug: string, projectId: string, issueIds: string[]) => {
    try {
      runInAction(() => {
        issueIds.forEach((issueId) => {
          pull(this.issues[projectId], issueId);
          this.rootStore.issues.removeIssue(issueId);
        });
      });

      const response = await this.issueService.bulkDeleteIssues(workspaceSlug, projectId, { issue_ids: issueIds });
      this.rootIssueStore.rootStore.projectRoot.project.fetchProjectDetails(workspaceSlug, projectId);

      return response;
    } catch (error) {
      this.fetchIssues(workspaceSlug, projectId, "mutation");
      throw error;
    }
  };

  archiveBulkIssues = async (workspaceSlug: string, projectId: string, issueIds: string[]) => {
    try {
      const response = await this.issueService.bulkArchiveIssues(workspaceSlug, projectId, { issue_ids: issueIds });

      runInAction(() => {
        issueIds.forEach((issueId) => {
          this.rootStore.issues.updateIssue(issueId, {
            archived_at: response.archived_at,
          });
        });
      });
    } catch (error) {
      throw error;
    }
  };

  subscribeBulkIssues = async (workspaceSlug: string, projectId: string, issueIds: string[]) => {
    try {
      await this.issueService.bulkSubscribeIssues(workspaceSlug, projectId, { issue_ids: issueIds });
    } catch (error) {
      throw error;
    }
  };

  /**
   * @description bulk update properties of selected issues
   * @param {TBulkOperationsPayload} data
   */
  bulkUpdateProperties = async (workspaceSlug: string, projectId: string, data: TBulkOperationsPayload) => {
    const issueIds = data.issue_ids;
    try {
      // make request to update issue properties
      await this.issueService.bulkOperations(workspaceSlug, projectId, data);
      // update issues in the store
      runInAction(() => {
        issueIds.forEach((issueId) => {
          const issueDetails = this.rootIssueStore.issues.getIssueById(issueId);
          if (!issueDetails) throw new Error("Issue not found");
          Object.keys(data.properties).forEach((key) => {
            const property = key as keyof TBulkOperationsPayload["properties"];
            const propertyValue = data.properties[property];
            // update root issue map properties
            if (Array.isArray(propertyValue)) {
              // if property value is array, append it to the existing values
              const existingValue = issueDetails[property];
              // convert existing value to an array
              const newExistingValue = Array.isArray(existingValue) ? existingValue : [];
              this.rootIssueStore.issues.updateIssue(issueId, {
                [property]: union(newExistingValue, propertyValue),
              });
            } else {
              // if property value is not an array, simply update the value
              this.rootIssueStore.issues.updateIssue(issueId, {
                [property]: propertyValue,
              });
            }
          });
        });
      });
    } catch (error) {
      throw error;
    }
  };
=======
  archiveBulkIssues = this.bulkArchiveIssues;
  quickAddIssue = this.issueQuickAdd;
>>>>>>> a0e16692dafacf924ab064e23de17f9a4dbaf707
}
