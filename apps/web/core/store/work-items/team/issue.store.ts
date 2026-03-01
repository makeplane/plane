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

import { action, makeObservable, runInAction } from "mobx";
// types
import type {
  TIssue,
  TLoader,
  ViewFlags,
  IssuePaginationOptions,
  TIssuesResponse,
  TBulkOperationsPayload,
} from "@plane/types";
// services
import { TeamspaceWorkItemsService } from "@/services/teamspace/teamspace-work-items.service";
// base class
import type { IBaseIssuesStore } from "@/store/work-items/helpers/base-issues.store";
import { BaseIssuesStore } from "@/store/work-items/helpers/base-issues.store";
// store
import type { IIssueRootStore } from "@/store/work-items/root.store";
import type { ITeamIssuesFilter } from "./filter.store";

export interface ITeamIssues extends IBaseIssuesStore {
  viewFlags: ViewFlags;
  // action
  fetchIssues: (
    workspaceSlug: string,
    teamspaceId: string,
    loadType: TLoader,
    option: IssuePaginationOptions
  ) => Promise<TIssuesResponse | undefined>;
  fetchIssuesWithExistingPagination: (
    workspaceSlug: string,
    teamspaceId: string,
    loadType: TLoader
  ) => Promise<TIssuesResponse | undefined>;
  fetchNextIssues: (
    workspaceSlug: string,
    teamspaceId: string,
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

export class TeamIssues extends BaseIssuesStore implements ITeamIssues {
  viewFlags = {
    enableQuickAdd: false,
    enableIssueCreation: false,
    enableInlineEditing: true,
  };
  // filter store
  teamspaceWorkItemFilterStore: ITeamIssuesFilter;
  // service
  teamspaceWorkItemsService: TeamspaceWorkItemsService;

  constructor(_rootStore: IIssueRootStore, teamspaceWorkItemFilterStore: ITeamIssuesFilter) {
    super(_rootStore, teamspaceWorkItemFilterStore);
    makeObservable(this, {
      fetchIssues: action,
      archiveBulkIssues: action,
      fetchNextIssues: action,
      fetchIssuesWithExistingPagination: action,
    });
    // filter store
    this.teamspaceWorkItemFilterStore = teamspaceWorkItemFilterStore;
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
      const params = this.teamspaceWorkItemFilterStore?.getFilterParams(
        options,
        teamspaceId,
        undefined,
        undefined,
        undefined
      );
      // call the fetch issues API with the params
      const response = await this.teamspaceWorkItemsService.getWorkItems(workspaceSlug, teamspaceId, params, {
        signal: this.controller.signal,
      });

      // after fetching issues, call the base method to process the response further
      this.onfetchIssues(response, options, workspaceSlug, teamspaceId, undefined, !isExistingPaginationOptions);
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
  fetchNextIssues = async (workspaceSlug: string, teamspaceId: string, groupId?: string, subGroupId?: string) => {
    const cursorObject = this.getPaginationData(groupId, subGroupId);
    // if there are no pagination options and the next page results do not exist the return
    if (!this.paginationOptions || (cursorObject && !cursorObject?.nextPageResults)) return;
    try {
      // set Loader
      this.setLoader("pagination", groupId, subGroupId);

      // get params from stored pagination options
      const params = this.teamspaceWorkItemFilterStore?.getFilterParams(
        this.paginationOptions,
        teamspaceId,
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
    loadType: TLoader = "mutation"
  ) => {
    if (!this.paginationOptions) return;
    return await this.fetchIssues(workspaceSlug, teamspaceId, loadType, this.paginationOptions, true);
  };

  /**
   * Override inherited create issue, to only add issue to the list based on current teamspace issue scope
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
    const teamspaceMemberIds =
      this.rootIssueStore.rootStore.teamspaceRoot.teamspaces.getTeamspaceMemberIds(teamspaceId);
    const shouldUpdateList =
      teamspaceProjectIds?.includes(projectId) &&
      data.assignee_ids?.some((assigneeId) => teamspaceMemberIds?.includes(assigneeId));

    return await super.createIssue(workspaceSlug, projectId, data, undefined, shouldUpdateList);
  };

  // Using aliased names as they cannot be overridden in other stores
  archiveBulkIssues = this.bulkArchiveIssues;
  updateIssue = this.issueUpdate;
  archiveIssue = this.issueArchive;

  // Setting them as undefined as they can not performed on workspace issues
  quickAddIssue = undefined;
}
