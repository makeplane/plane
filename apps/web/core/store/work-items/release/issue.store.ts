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

import { action, makeObservable, observable, override, runInAction } from "mobx";
import { ALL_ISSUES } from "@plane/constants";
import type {
  ReleaseSearchIssueResponse,
  IssuePaginationOptions,
  TBulkOperationsPayload,
  TIssue,
  TIssuesResponse,
  TLoader,
  ViewFlags,
} from "@plane/types";
import type { IBaseIssuesStore } from "../helpers/base-issues.store";
import { BaseIssuesStore } from "../helpers/base-issues.store";
import type { IIssueRootStore } from "../root.store";
import type { IReleaseIssuesFilter } from "./filter.store";
import releaseService from "@/services/release.service";

export interface IReleaseIssues extends IBaseIssuesStore {
  viewFlags: ViewFlags;
  fetchIssues: (
    workspaceSlug: string,
    releaseId: string,
    loadType: TLoader,
    options?: IssuePaginationOptions
  ) => Promise<TIssuesResponse | undefined>;
  fetchNextIssues: (
    workspaceSlug: string,
    releaseId: string,
    groupId?: string,
    subGroupId?: string
  ) => Promise<TIssuesResponse | undefined>;
  addWorkItemsToStore: (items: ReleaseSearchIssueResponse[]) => void;
  // Aliases so peek overview and bulk-op modals can access them on the union type
  updateIssue: (
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    data: Partial<TIssue>,
    shouldSync?: boolean
  ) => Promise<void>;
  archiveIssue: (workspaceSlug: string, projectId: string, issueId: string) => Promise<void>;
  removeBulkIssues: (workspaceSlug: string, projectId: string, issueIds: string[]) => Promise<void>;
  archiveBulkIssues: (workspaceSlug: string, projectId: string, issueIds: string[]) => Promise<void>;
  bulkUpdateProperties: (workspaceSlug: string, projectId: string, data: TBulkOperationsPayload) => Promise<void>;
}

export class ReleaseIssues extends BaseIssuesStore implements IReleaseIssues {
  viewFlags: ViewFlags = {
    enableQuickAdd: false,
    enableIssueCreation: false,
    enableInlineEditing: true,
  };
  // Narrowed type so getFilterParams is accessible without casting
  declare issueFilterStore: IReleaseIssuesFilter;

  constructor(_rootStore: IIssueRootStore, issueFilterStore: IReleaseIssuesFilter) {
    super(_rootStore, issueFilterStore);
    makeObservable(this, {
      viewFlags: observable,
      fetchIssues: action,
      fetchNextIssues: action,
      addWorkItemsToStore: action,
      removeIssue: override,
    });
  }

  fetchParentStats = (_workspaceSlug: string, _projectId?: string, _id?: string) => {};

  updateParentStats = (_prevIssueState?: TIssue, _nextIssueState?: TIssue, _id?: string) => {};

  fetchIssues = async (
    workspaceSlug: string,
    releaseId: string,
    loadType: TLoader,
    options?: IssuePaginationOptions
  ): Promise<TIssuesResponse | undefined> => {
    try {
      runInAction(() => {
        this.setLoader(loadType);
        this.clear(true);
      });
      const paginationOptions: IssuePaginationOptions = options ?? { canGroup: true, perPageCount: 50 };
      const params = this.issueFilterStore.getFilterParams(
        paginationOptions,
        releaseId,
        undefined,
        undefined,
        undefined
      );
      const response = await releaseService.listWorkItems(workspaceSlug, releaseId, params);
      this.onfetchIssues(response, paginationOptions, workspaceSlug, undefined, releaseId, true);
      return response;
    } catch {
      this.setLoader(undefined);
      return undefined;
    }
  };

  fetchNextIssues = async (
    workspaceSlug: string,
    releaseId: string,
    groupId?: string,
    subGroupId?: string
  ): Promise<TIssuesResponse | undefined> => {
    const cursorObject = this.getPaginationData(groupId, subGroupId);
    if (!this.paginationOptions || (cursorObject && !cursorObject?.nextPageResults)) return undefined;
    try {
      this.setLoader("pagination", groupId, subGroupId);
      const params = this.issueFilterStore.getFilterParams(
        this.paginationOptions,
        releaseId,
        this.getNextCursor(groupId, subGroupId),
        groupId,
        subGroupId
      );
      const response = await releaseService.listWorkItems(workspaceSlug, releaseId, params);
      this.onfetchNexIssues(response, groupId, subGroupId);
      return response;
    } catch {
      this.setLoader(undefined, groupId, subGroupId);
      return undefined;
    }
  };

  addWorkItemsToStore = (items: ReleaseSearchIssueResponse[]) => {
    const existingIds = new Set(Object.values(this.groupedIssueIds ?? {}).flat() as string[]);
    const newItems = items.filter((item) => !existingIds.has(item.id));
    if (!newItems.length) return;

    const now = new Date().toISOString();
    runInAction(() => {
      const grouped = { ...(this.groupedIssueIds ?? {}) };

      for (const item of newItems) {
        // Build a minimal TIssue with a real created_at so block-root.tsx renders it
        const partial = {
          id: item.id,
          name: item.name,
          project_id: item.project?.id ?? "",
          sequence_id: item.sequence_id,
          state__group: item.state?.group ?? "unstarted",
          type_id: item.type_id,
          start_date: item.start_date,
          created_at: now,
          updated_at: now,
          last_activity_at: now,
          sort_order: 0,
          priority: null,
          label_ids: [],
          assignee_ids: [],
          release_ids: [],
          estimate_point: null,
          sub_issues_count: 0,
          attachment_count: 0,
          link_count: 0,
          parent_id: null,
          cycle_id: null,
          module_ids: null,
          state_id: null,
          target_date: null,
          completed_at: null,
          archived_at: null,
          created_by: "",
          updated_by: "",
          is_draft: false,
        } as unknown as TIssue;

        // Add to global issues map so getWorkItemById and block-root can find it
        this.rootIssueStore.issues.addIssue([partial]);

        // Use state__group as the bucket key — this matches the client-side grouping
        // in fetchIssues which also keys by state__group via ISSUE_FILTER_DEFAULT_DATA
        const groupKey = String(item.state?.group ?? "None");
        if (!Array.isArray(grouped[groupKey])) grouped[groupKey] = [];
        grouped[groupKey].push(item.id);

        this.groupedIssueCount[groupKey] = (this.groupedIssueCount[groupKey] ?? 0) + 1;
        this.groupedIssueCount[ALL_ISSUES] = (this.groupedIssueCount[ALL_ISSUES] ?? 0) + 1;
      }

      this.groupedIssueIds = grouped;
    });
  };

  async removeIssue(workspaceSlug: string, _projectId: string, issueId: string): Promise<void> {
    const releaseId = this.rootIssueStore.releaseId;
    if (!releaseId) return;
    await releaseService.removeWorkItems(workspaceSlug, releaseId, [issueId]);
    runInAction(() => {
      this.removeIssueFromList(issueId);
    });
  }

  updateIssue = this.issueUpdate;
  archiveIssue = this.issueArchive;
  archiveBulkIssues = this.bulkArchiveIssues;
}
