/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import { clone } from "lodash-es";
import { action, makeObservable, runInAction } from "mobx";
// types
import type {
  TIssue,
  TLoader,
  ViewFlags,
  IssuePaginationOptions,
  TIssuesResponse,
  TBulkOperationsPayload,
  TBaseIssue,
  TIssueResponseResults,
} from "@plane/types";
import { EIssueServiceType } from "@plane/types";
// store
import { IssueService } from "@/services/issue";
import type { IBaseIssuesStore } from "@/store/work-items/helpers/base-issues.store";
import { BaseIssuesStore } from "@/store/work-items/helpers/base-issues.store";
import type { IIssueRootStore } from "@/store/work-items/root.store";
// local store
import type { IProjectEpicsFilter } from "./filter.store";

export interface IProjectEpics extends IBaseIssuesStore {
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
  subscribeBulkIssues: (workspaceSlug: string, projectId: string, issueIds: string[]) => Promise<void>;
  bulkUpdateProperties: (workspaceSlug: string, projectId: string, data: TBulkOperationsPayload) => Promise<void>;
}

export class ProjectEpics extends BaseIssuesStore implements IProjectEpics {
  viewFlags = {
    enableQuickAdd: true,
    enableIssueCreation: true,
    enableInlineEditing: true,
  };
  router;

  // services
  issueService;
  // filter store
  issueFilterStore: IProjectEpicsFilter;

  constructor(_rootStore: IIssueRootStore, issueFilterStore: IProjectEpicsFilter) {
    super(_rootStore, issueFilterStore, false, EIssueServiceType.EPICS);
    makeObservable(this, {
      fetchIssues: action,
      subscribeBulkIssues: action,
      archiveBulkIssues: action,
      fetchNextIssues: action,
      fetchIssuesWithExistingPagination: action,
      quickAddIssue: action,
    });
    // services
    this.issueService = new IssueService(EIssueServiceType.EPICS);
    // filter store
    this.issueFilterStore = issueFilterStore;
    this.router = _rootStore.rootStore.router;
  }

  /**
   * Fetches the project details
   * @param workspaceSlug
   * @param projectId
   */
  fetchParentStats = (workspaceSlug: string, projectId?: string) => {
    if (!projectId) return;
    this.rootIssueStore.rootStore.projectRoot.project.fetchProjectDetails(workspaceSlug, projectId).catch((error) => {
      console.error("Error fetching project details for epic store", error);
    });
  };

  /** */
  updateParentStats = () => {};

  private transformResponseResults = (results: TIssueResponseResults): TIssueResponseResults => {
    // Helper function to add is_epic to an issue
    const addIsEpic = (issue: TBaseIssue): TBaseIssue => ({
      ...issue,
      is_epic: true,
    });

    // Handle array case
    if (Array.isArray(results)) {
      return results.map(addIsEpic);
    }

    // Handle grouped case
    const transformedResults: Record<
      string,
      {
        results: TBaseIssue[] | Record<string, { results: TBaseIssue[]; total_results: number }>;
        total_results: number;
      }
    > = {};

    for (const [groupId, groupData] of Object.entries(results)) {
      if (!groupData) continue;

      // Handle simple group with array results
      if (Array.isArray(groupData.results)) {
        transformedResults[groupId] = {
          results: groupData.results.map(addIsEpic),
          total_results: groupData.total_results,
        };
      } else {
        // Handle nested sub-groups
        const transformedSubGroups: Record<string, { results: TBaseIssue[]; total_results: number }> = {};

        for (const [subGroupId, subGroupData] of Object.entries(groupData.results)) {
          if (subGroupData) {
            transformedSubGroups[subGroupId] = {
              results: subGroupData.results.map(addIsEpic),
              total_results: subGroupData.total_results,
            };
          }
        }

        transformedResults[groupId] = {
          results: transformedSubGroups,
          total_results: groupData.total_results,
        };
      }
    }

    return transformedResults;
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
    options: IssuePaginationOptions,
    isExistingPaginationOptions: boolean = false
  ) => {
    try {
      // set loader and clear store
      runInAction(() => {
        this.setLoader(loadType);
        this.clear(!isExistingPaginationOptions); // clear while fetching from server.
      });

      // get params from pagination options
      const params = this.issueFilterStore?.getFilterParams(options, projectId, undefined, undefined, undefined);
      // call the fetch issues API with the params
      const response = await this.issueService.getIssues(workspaceSlug, projectId, params, {
        signal: this.controller.signal,
      });

      // after fetching issues, call the base method to process the response further
      const transformedResults = this.transformResponseResults(response.results);
      this.onfetchIssues(
        { ...response, results: transformedResults },
        options,
        workspaceSlug,
        projectId,
        undefined,
        !isExistingPaginationOptions
      );

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
        projectId,
        this.getNextCursor(groupId, subGroupId),
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
    return await this.fetchIssues(workspaceSlug, projectId, loadType, this.paginationOptions, true);
  };

  /**
   * Override inherited create issue, to update list only if user is on current project
   * @param workspaceSlug
   * @param projectId
   * @param data
   * @returns
   */
  override createIssue = async (workspaceSlug: string, projectId: string, data: Partial<TIssue>) => {
    // perform an API call
    const response = await this.issueService.createIssue(workspaceSlug, projectId, data);
    const shouldUpdateList = projectId === this.router.projectId;

    // add Issue to Store
    this.addIssue({ ...response, is_epic: true }, shouldUpdateList);

    return response;
  };

  /**
   * Updates the Issue, by calling the API and also updating the store
   * @param workspaceSlug
   * @param projectId
   * @param issueId
   * @param data Partial Issue Data to be updated
   * @param shouldSync If False then only issue is to be updated in the store not call API to update
   * @returns
   */
  override async issueUpdate(
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    data: Partial<TIssue>,
    shouldSync = true
  ) {
    // Store Before state of the issue
    const issueBeforeUpdate = clone(this.rootIssueStore.issues.getIssueById(issueId));
    try {
      // Update the Respective Stores
      this.rootIssueStore.issues.updateIssue(issueId, data);
      this.updateIssueList({ ...issueBeforeUpdate, ...data } as TIssue, issueBeforeUpdate);

      // Check if should Sync
      if (!shouldSync) return;

      // call API to update the issue
      await this.issueService.patchIssue(workspaceSlug, projectId, issueId, data);

      // call fetch Parent Stats
      this.fetchParentStats(workspaceSlug, projectId);
    } catch (error) {
      // If errored out update store again to revert the change
      this.rootIssueStore.issues.updateIssue(issueId, issueBeforeUpdate ?? {});
      this.updateIssueList(issueBeforeUpdate, { ...issueBeforeUpdate, ...data } as TIssue);
      throw error;
    }
  }

  /**
   * This method is called to delete an issue
   * @param workspaceSlug
   * @param projectId
   * @param issueId
   */
  override async removeIssue(workspaceSlug: string, projectId: string, issueId: string) {
    // Male API call
    await this.issueService.deleteIssue(workspaceSlug, projectId, issueId);
    // Remove from Respective issue Id list
    runInAction(() => {
      this.removeIssueFromList(issueId);
    });
    // call fetch Parent stats
    this.fetchParentStats(workspaceSlug, projectId);
    // Remove issue from main issue Map store
    this.rootIssueStore.issues.removeIssue(issueId);
  }

  subscribeBulkIssues = async (workspaceSlug: string, projectId: string, issueIds: string[]) => {
    try {
      await this.issueService.bulkSubscribeIssues(workspaceSlug, projectId, { issue_ids: issueIds });
    } catch (error) {
      console.error(error);
      throw error;
    }
  };

  // Using aliased names as they cannot be overridden in other stores
  archiveBulkIssues = this.bulkArchiveIssues;
  quickAddIssue = this.issueQuickAdd.bind(this);
  updateIssue = this.issueUpdate.bind(this);
  archiveIssue = this.issueArchive.bind(this);
}
