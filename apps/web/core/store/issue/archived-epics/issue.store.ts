/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import { action, makeObservable, runInAction } from "mobx";
import type { TBaseIssue, TIssueResponseResults } from "@plane/types";
import type { TLoader, IssuePaginationOptions, TIssuesResponse, ViewFlags, TBulkOperationsPayload } from "@plane/types";
import { EIssueServiceType } from "@plane/types";
import type { IBaseIssuesStore } from "@/store/work-items/helpers/base-issues.store";
import { BaseIssuesStore } from "@/store/work-items/helpers/base-issues.store";
import type { IIssueRootStore } from "@/store/work-items/root.store";
import type { IArchivedEpicsFilter } from "./filter.store";

export interface IArchivedEpics extends IBaseIssuesStore {
  viewFlags: ViewFlags;
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
  restoreIssue: (workspaceSlug: string, projectId: string, epicId: string) => Promise<void>;
  removeBulkIssues: (workspaceSlug: string, projectId: string, epicIds: string[]) => Promise<void>;
  bulkUpdateProperties: (workspaceSlug: string, projectId: string, data: TBulkOperationsPayload) => Promise<void>;
  updateIssue: undefined;
  archiveIssue: undefined;
  archiveBulkIssues: undefined;
  quickAddIssue: undefined;
}

export class ArchivedEpics extends BaseIssuesStore implements IArchivedEpics {
  issueFilterStore: IArchivedEpicsFilter;

  viewFlags = {
    enableQuickAdd: false,
    enableIssueCreation: false,
    enableInlineEditing: true,
  };

  constructor(_rootStore: IIssueRootStore, issueFilterStore: IArchivedEpicsFilter) {
    super(_rootStore, issueFilterStore, true, EIssueServiceType.EPICS);
    makeObservable(this, {
      fetchIssues: action,
      fetchNextIssues: action,
      fetchIssuesWithExistingPagination: action,
      restoreIssue: action,
    });
    this.issueFilterStore = issueFilterStore;
  }

  fetchParentStats = async (workspaceSlug: string, projectId?: string) => {
    projectId && this.rootIssueStore.rootStore.projectRoot.project.fetchProjectDetails(workspaceSlug, projectId);
  };

  updateParentStats = () => {};

  private transformResponseResults = (results: TIssueResponseResults): TIssueResponseResults => {
    const addIsEpic = (issue: TBaseIssue): TBaseIssue => ({ ...issue, is_epic: true });

    if (Array.isArray(results)) {
      return results.map(addIsEpic);
    }

    const transformedResults: Record<
      string,
      {
        results: TBaseIssue[] | Record<string, { results: TBaseIssue[]; total_results: number }>;
        total_results: number;
      }
    > = {};

    for (const [groupId, groupData] of Object.entries(results)) {
      if (!groupData) continue;
      if (Array.isArray(groupData.results)) {
        transformedResults[groupId] = {
          results: groupData.results.map(addIsEpic),
          total_results: groupData.total_results,
        };
      } else {
        const transformedSubGroups: Record<string, { results: TBaseIssue[]; total_results: number }> = {};
        for (const [subGroupId, subGroupData] of Object.entries(groupData.results)) {
          if (subGroupData) {
            transformedSubGroups[subGroupId] = {
              results: subGroupData.results.map(addIsEpic),
              total_results: subGroupData.total_results,
            };
          }
        }
        transformedResults[groupId] = { results: transformedSubGroups, total_results: groupData.total_results };
      }
    }
    return transformedResults;
  };

  fetchIssues = async (
    workspaceSlug: string,
    projectId: string,
    loadType: TLoader = "init-loader",
    options: IssuePaginationOptions,
    isExistingPaginationOptions: boolean = false
  ) => {
    try {
      runInAction(() => {
        this.setLoader(loadType);
      });
      this.clear(!isExistingPaginationOptions);

      const params = this.issueFilterStore?.getFilterParams(options, projectId, undefined, undefined, undefined);
      const response = await this.issueArchiveService.getArchivedEpics(workspaceSlug, projectId, params, {
        signal: this.controller.signal,
      });

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
      this.setLoader(undefined);
      throw error;
    }
  };

  fetchNextIssues = async (workspaceSlug: string, projectId: string, groupId?: string, subGroupId?: string) => {
    const cursorObject = this.getPaginationData(groupId, subGroupId);
    if (!this.paginationOptions || (cursorObject && !cursorObject?.nextPageResults)) return;
    try {
      this.setLoader("pagination", groupId, subGroupId);

      const params = this.issueFilterStore?.getFilterParams(
        this.paginationOptions,
        projectId,
        this.getNextCursor(groupId, subGroupId),
        groupId,
        subGroupId
      );
      const response = await this.issueArchiveService.getArchivedEpics(workspaceSlug, projectId, params);

      const transformedResults = this.transformResponseResults(response.results);
      this.onfetchNexIssues({ ...response, results: transformedResults }, groupId, subGroupId);
      return response;
    } catch (error) {
      this.setLoader(undefined, groupId, subGroupId);
      throw error;
    }
  };

  fetchIssuesWithExistingPagination = async (
    workspaceSlug: string,
    projectId: string,
    loadType: TLoader = "mutation"
  ) => {
    if (!this.paginationOptions) return;
    return await this.fetchIssues(workspaceSlug, projectId, loadType, this.paginationOptions, true);
  };

  restoreIssue = async (workspaceSlug: string, projectId: string, epicId: string) => {
    await this.issueArchiveService.restoreIssue(workspaceSlug, projectId, epicId);

    runInAction(() => {
      this.rootIssueStore.issues.updateIssue(epicId, {
        archived_at: null,
      });
      this.removeIssueFromList(epicId);
    });
  };

  updateIssue = undefined;
  archiveIssue = undefined;
  archiveBulkIssues = undefined;
  quickAddIssue = undefined;
}
