/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { orderBy, set } from "lodash-es";
import { action, makeObservable, observable, runInAction } from "mobx";
import { computedFn } from "mobx-utils";
// plane imports
import { CHECKLIST_DENOMINATOR_EXCLUDED_STATUSES } from "@plane/constants";
import { EChecklistItemStatus } from "@plane/types";
import type {
  TIssueChecklistItem,
  TIssueChecklistItemMap,
  TIssueChecklistItemIdMap,
  TIssueServiceType,
} from "@plane/types";
// services
import { IssueService } from "@/services/issue";
// types
import type { IIssueDetail } from "./root.store";

export type TChecklistProgress = {
  done: number;
  skipped: number;
  total: number;
  /** total minus skipped — the progress denominator (spec FR-012, FR-013) */
  activeTotal: number;
};

export interface IIssueChecklistStoreActions {
  addChecklistItems: (issueId: string, items: TIssueChecklistItem[]) => void;
  fetchChecklistItems: (workspaceSlug: string, projectId: string, issueId: string) => Promise<TIssueChecklistItem[]>;
  createChecklistItem: (
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    data: Partial<TIssueChecklistItem>
  ) => Promise<TIssueChecklistItem>;
  updateChecklistItem: (
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    checklistItemId: string,
    data: Partial<TIssueChecklistItem>
  ) => Promise<TIssueChecklistItem>;
  removeChecklistItem: (
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    checklistItemId: string
  ) => Promise<void>;
  // Not a modal toggle (there is no checklist modal) — this is what lets the
  // "Add checklist item" action button reveal the section for an issue that
  // has zero items yet, since the normal render gate is item-count based.
  startAddingChecklistItem: (issueId: string) => void;
  stopAddingChecklistItem: (issueId: string) => void;
}

export interface IIssueChecklistStore extends IIssueChecklistStoreActions {
  // observables
  checklistItems: TIssueChecklistItemIdMap;
  checklistItemMap: TIssueChecklistItemMap;
  activeAddInputIssueId: string | null;
  // helper methods
  getChecklistItemIdsByIssueId: (issueId: string) => string[] | undefined;
  getChecklistItemById: (checklistItemId: string) => TIssueChecklistItem | undefined;
  getChecklistProgressByIssueId: (issueId: string) => TChecklistProgress;
  isAddingChecklistItem: (issueId: string) => boolean;
}

export class IssueChecklistStore implements IIssueChecklistStore {
  // observables
  checklistItems: TIssueChecklistItemIdMap = {};
  checklistItemMap: TIssueChecklistItemMap = {};
  activeAddInputIssueId: string | null = null;
  // root store
  rootIssueDetailStore: IIssueDetail;
  // services
  issueService;
  serviceType;

  constructor(rootStore: IIssueDetail, serviceType: TIssueServiceType) {
    makeObservable(this, {
      // observables
      checklistItems: observable,
      checklistItemMap: observable,
      activeAddInputIssueId: observable.ref,
      // actions
      addChecklistItems: action.bound,
      fetchChecklistItems: action,
      createChecklistItem: action,
      updateChecklistItem: action,
      removeChecklistItem: action,
      startAddingChecklistItem: action,
      stopAddingChecklistItem: action,
    });
    this.serviceType = serviceType;
    // root store
    this.rootIssueDetailStore = rootStore;
    // services
    this.issueService = new IssueService(serviceType);
  }

  // helper methods
  getChecklistItemIdsByIssueId = computedFn((issueId: string) => {
    if (!issueId) return undefined;
    return this.checklistItems[issueId] ?? undefined;
  });

  getChecklistItemById = (checklistItemId: string) => {
    if (!checklistItemId) return undefined;
    return this.checklistItemMap[checklistItemId] ?? undefined;
  };

  getChecklistProgressByIssueId = computedFn((issueId: string): TChecklistProgress => {
    const ids = this.checklistItems[issueId] ?? [];
    let done = 0;
    let skipped = 0;
    ids.forEach((id) => {
      const item = this.checklistItemMap[id];
      if (!item) return;
      if (item.status === EChecklistItemStatus.DONE) done += 1;
      if (CHECKLIST_DENOMINATOR_EXCLUDED_STATUSES.includes(item.status)) skipped += 1;
    });
    const total = ids.length;
    return { done, skipped, total, activeTotal: total - skipped };
  });

  isAddingChecklistItem = (issueId: string) => this.activeAddInputIssueId === issueId;

  // helper: keep the id array sorted by (sort_order, created_at) after any
  // mutation that touches ordering.
  resortIds = (issueId: string) => {
    const ids = this.checklistItems[issueId];
    if (!ids) return;
    const sorted = orderBy(
      ids.map((id) => this.checklistItemMap[id]).filter((item): item is TIssueChecklistItem => !!item),
      ["sort_order", "created_at"]
    ).map((item) => item.id);
    set(this.checklistItems, issueId, sorted);
  };

  // actions
  addChecklistItems = (issueId: string, items: TIssueChecklistItem[]) => {
    runInAction(() => {
      items.forEach((item) => set(this.checklistItemMap, item.id, item));
      this.checklistItems[issueId] = orderBy(items, ["sort_order", "created_at"]).map((item) => item.id);
    });
  };

  fetchChecklistItems = async (workspaceSlug: string, projectId: string, issueId: string) => {
    const response = await this.issueService.fetchChecklistItems(workspaceSlug, projectId, issueId);
    this.addChecklistItems(issueId, response);
    return response;
  };

  createChecklistItem = async (
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    data: Partial<TIssueChecklistItem>
  ) => {
    const response = await this.issueService.createChecklistItem(workspaceSlug, projectId, issueId, data);
    runInAction(() => {
      set(this.checklistItemMap, response.id, response);
      this.checklistItems[issueId] = [...(this.checklistItems[issueId] ?? []), response.id];
      this.resortIds(issueId);
    });
    // Feed-visible change — refresh activity. Status toggles and reorders do
    // NOT do this (see updateChecklistItem) to avoid hammering the endpoint.
    this.rootIssueDetailStore.activity.fetchActivities(workspaceSlug, projectId, issueId);
    return response;
  };

  updateChecklistItem = async (
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    checklistItemId: string,
    data: Partial<TIssueChecklistItem>
  ) => {
    const initialData = { ...this.checklistItemMap[checklistItemId] };
    try {
      runInAction(() => {
        Object.keys(data).forEach((key) => {
          set(this.checklistItemMap, [checklistItemId, key], data[key as keyof TIssueChecklistItem]);
        });
        if (data.sort_order !== undefined) this.resortIds(issueId);
      });

      const response = await this.issueService.updateChecklistItem(
        workspaceSlug,
        projectId,
        issueId,
        checklistItemId,
        data
      );

      // Reconcile with the server response: completed_at/completed_by are
      // derived server-side from the status *transition*, so an optimistic
      // update cannot predict them — overwrite rather than merge.
      runInAction(() => {
        set(this.checklistItemMap, checklistItemId, response);
        if (data.sort_order !== undefined) this.resortIds(issueId);
      });

      // Only rename changes are feed-visible activity worth an eager refetch;
      // reorders and status changes still write activity server-side (except
      // reorders, which write none) but don't need an immediate refetch here.
      if (data.name !== undefined) {
        this.rootIssueDetailStore.activity.fetchActivities(workspaceSlug, projectId, issueId);
      }
      return response;
    } catch (error) {
      runInAction(() => {
        set(this.checklistItemMap, checklistItemId, initialData);
        this.resortIds(issueId);
      });
      throw error;
    }
  };

  removeChecklistItem = async (workspaceSlug: string, projectId: string, issueId: string, checklistItemId: string) => {
    await this.issueService.deleteChecklistItem(workspaceSlug, projectId, issueId, checklistItemId);

    const itemIndex = this.checklistItems[issueId]?.findIndex((id) => id === checklistItemId) ?? -1;
    if (itemIndex >= 0)
      runInAction(() => {
        this.checklistItems[issueId].splice(itemIndex, 1);
        delete this.checklistItemMap[checklistItemId];
      });

    this.rootIssueDetailStore.activity.fetchActivities(workspaceSlug, projectId, issueId);
  };

  startAddingChecklistItem = (issueId: string) => {
    this.activeAddInputIssueId = issueId;
  };

  stopAddingChecklistItem = (issueId: string) => {
    if (this.activeAddInputIssueId === issueId) this.activeAddInputIssueId = null;
  };
}
