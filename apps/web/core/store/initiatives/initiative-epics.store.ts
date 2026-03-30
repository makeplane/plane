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

import { action, makeObservable, observable, runInAction } from "mobx";
import { computedFn } from "mobx-utils";
import type {
  TEpicStats,
  TLoader,
  TIssue,
  TBaseIssue,
  TBulkOperationsPayload,
  TIssueResponseResults,
  TIssuesResponse,
  IssuePaginationOptions,
  ViewFlags,
} from "@plane/types";
import { EIssueServiceType } from "@plane/types";
import { InitiativeService } from "@/services/initiative.service";
import type { TInitiativeAnalytics } from "@/types/initiative";
import type { RootStore } from "@/plane-web/store/root.store";
import type { IInitiativeEpicsFilterStore } from "./initiative-epics-filter.store";
import type { IInitiativeStore } from "./initiatives.store";
// BaseIssuesStore imports
import type { IBaseIssuesStore } from "@/store/work-items/helpers/base-issues.store";
import { BaseIssuesStore } from "@/store/work-items/helpers/base-issues.store";
import type { IIssueRootStore } from "@/store/work-items/root.store";

export interface IInitiativeEpicStore extends IBaseIssuesStore {
  viewFlags: ViewFlags;
  initiativeEpicsDetailMap: Map<string, string[]>; // For detail page (unfiltered + expanded relations)

  // actions
  fetchIssues: (
    workspaceSlug: string,
    initiativeId: string,
    loadType: TLoader,
    options: IssuePaginationOptions
  ) => Promise<TIssuesResponse | undefined>;
  fetchIssuesWithExistingPagination: (
    workspaceSlug: string,
    initiativeId: string,
    loadType?: TLoader,
    skipInitialClear?: boolean
  ) => Promise<TIssuesResponse | undefined>;
  fetchNextIssues: (
    workspaceSlug: string,
    initiativeId: string,
    groupId?: string,
    subGroupId?: string
  ) => Promise<TIssuesResponse | undefined>;

  fetchInitiativeEpicsDetail: (workspaceSlug: string, initiativeId: string) => Promise<string[] | undefined>;
  getInitiativeEpicsDetailById: (initiativeId: string) => string[] | undefined;
  removeEpicFromInitiative: (workspaceSlug: string, initiativeId: string, epicId: string) => Promise<void>;
  addEpicsToInitiative: (workspaceSlug: string, initiativeId: string, epicIds: string[]) => Promise<void>;
  updateIssue: (workspaceSlug: string, projectId: string, issueId: string, data: Partial<TIssue>) => Promise<void>;
  archiveIssue: (workspaceSlug: string, projectId: string, issueId: string) => Promise<void>;

  fetchInitiativeEpicStats: (workspaceSlug: string, initiativeId: string) => Promise<TEpicStats[] | undefined>;
  filters: IInitiativeEpicsFilterStore;
  archiveBulkIssues: (workspaceSlug: string, projectId: string, issueIds: string[]) => Promise<void>;
  removeBulkIssues: (workspaceSlug: string, projectId: string, issueIds: string[]) => Promise<void>;
  bulkUpdateProperties: (workspaceSlug: string, projectId: string, data: TBulkOperationsPayload) => Promise<void>;
}

export class InitiativeEpicStore extends BaseIssuesStore implements IInitiativeEpicStore {
  viewFlags: ViewFlags = {
    enableQuickAdd: false,
    enableIssueCreation: false,
    enableInlineEditing: true,
  };

  initiativeEpicsDetailMap: Map<string, string[]> = new Map(); // Detail page (unfiltered)

  initiativeService: InitiativeService;
  rootStore: RootStore;
  filters: IInitiativeEpicsFilterStore;

  constructor(_rootStore: IIssueRootStore, initiativeEpicsFilterStore: IInitiativeEpicsFilterStore) {
    super(_rootStore, initiativeEpicsFilterStore, false, EIssueServiceType.EPICS);

    makeObservable(this, {
      // observables
      initiativeEpicsDetailMap: observable,
      // actions
      fetchIssues: action,
      fetchNextIssues: action,
      fetchIssuesWithExistingPagination: action,
      fetchInitiativeEpicStats: action,
      fetchInitiativeAnalytics: action,
      fetchInitiativeEpicsDetail: action,
      removeEpicFromInitiative: action,
      addEpicsToInitiative: action,
    });

    this.filters = initiativeEpicsFilterStore;
    this.rootStore = _rootStore.rootStore;
    this.initiativeService = new InitiativeService();
  }

  /** Lazily read: `initiativeStore` is assigned on RootStore after `InitiativeStore` constructs `scope.epics`. */
  private get initiativeStore(): IInitiativeStore {
    return this.rootStore.initiativeStore;
  }

  /** Same source order as scope modals: `initiative.epic_ids` if present, else cached detail ids. */
  private getCurrentLinkedEpicIds(initiativeId: string): string[] {
    const initiative = this.initiativeStore.initiativesMap?.[initiativeId];
    const fromInitiative = initiative?.epic_ids?.map(String) ?? [];
    const fromDetail = this.initiativeEpicsDetailMap.get(initiativeId)?.map(String) ?? [];
    if (fromInitiative.length > 0) return [...new Set(fromInitiative)];
    if (fromDetail.length > 0) return [...new Set(fromDetail)];
    return [];
  }

  /** Returns true when all linked epic ids already have enough local data for the selection UI. */
  private hasHydratedEpicDetails(epicIds: string[]): boolean {
    if (epicIds.length === 0) return true;

    return epicIds.every((epicId) => {
      const epic = this.rootStore.issue.issues.getIssueById(epicId);
      if (!epic?.project_id || !epic.state_id || !epic.type_id) return false;

      return Boolean(
        this.rootStore.projectRoot.project.getProjectById(epic.project_id) &&
        this.rootStore.state.getStateById(epic.state_id)
      );
    });
  }

  archiveBulkIssues = this.bulkArchiveIssues;

  // Implement abstract methods from BaseIssuesStore
  fetchParentStats = (_workspaceSlug: string, _projectId?: string, _id?: string) => {
    // No-op for initiative epics - they don't have a parent project/cycle/module
  };

  updateParentStats = (_prevIssueState?: TIssue, _nextIssueState?: TIssue, _id?: string) => {
    // No-op for initiative epics - they don't update parent stats
  };

  /**
   * Adds is_epic: true to all issues in the response, handling both flat and grouped structures
   */
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
        transformedResults[groupId] = {
          results: transformedSubGroups,
          total_results: groupData.total_results,
        };
      }
    }

    return transformedResults;
  };

  /**
   * Fetch the first page of initiative epics with pagination support
   */
  fetchIssues = async (
    workspaceSlug: string,
    initiativeId: string,
    loadType: TLoader = "init-loader",
    options: IssuePaginationOptions,
    isExistingPaginationOptions: boolean = false,
    skipInitialClear: boolean = false
  ): Promise<TIssuesResponse | undefined> => {
    try {
      runInAction(() => {
        this.setLoader(loadType);
        if (!skipInitialClear) {
          this.clear(!isExistingPaginationOptions);
        }
      });

      const params = this.filters.getFilterParams(options, initiativeId, undefined, undefined, undefined);
      const response = await this.initiativeService.fetchInitiativeEpics(workspaceSlug, initiativeId, params);

      const transformedResults = this.transformResponseResults(response.results);
      this.onfetchIssues(
        { ...response, results: transformedResults },
        options,
        workspaceSlug,
        undefined,
        initiativeId,
        !isExistingPaginationOptions
      );

      this.fetchInitiativeEpicStats(workspaceSlug, initiativeId);
      return response;
    } catch (error) {
      this.setLoader(undefined);
      throw error;
    }
  };

  /**
   * Fetch the next page of initiative epics (pagination)
   */
  fetchNextIssues = async (
    workspaceSlug: string,
    initiativeId: string,
    groupId?: string,
    subGroupId?: string
  ): Promise<TIssuesResponse | undefined> => {
    const cursorObject = this.getPaginationData(groupId, subGroupId);
    if (!this.paginationOptions || (cursorObject && !cursorObject?.nextPageResults)) return;
    try {
      this.setLoader("pagination", groupId, subGroupId);

      const params = this.filters.getFilterParams(
        this.paginationOptions,
        initiativeId,
        this.getNextCursor(groupId, subGroupId),
        groupId,
        subGroupId
      );
      const response = await this.initiativeService.fetchInitiativeEpics(workspaceSlug, initiativeId, params);

      this.onfetchNexIssues(response, groupId, subGroupId);
      return response;
    } catch (error) {
      this.setLoader(undefined, groupId, subGroupId);
      throw error;
    }
  };

  /**
   * Re-fetch the first page with the existing stored pagination options.
   * Useful when filters, groupBy, or orderBy change.
   */
  fetchIssuesWithExistingPagination = async (
    workspaceSlug: string,
    initiativeId: string,
    loadType: TLoader = "mutation",
    skipInitialClear: boolean = false
  ): Promise<TIssuesResponse | undefined> => {
    if (!this.paginationOptions) return;
    return this.fetchIssues(workspaceSlug, initiativeId, loadType, this.paginationOptions, true, skipInitialClear);
  };

  /**
   * Get the epic ids for the initiative (detail page - unfiltered with expanded relations)
   */
  getInitiativeEpicsDetailById = computedFn((initiativeId: string) => this.initiativeEpicsDetailMap.get(initiativeId));

  /**
   * Fetch the epic stats for the initiative
   */
  fetchInitiativeEpicStats = async (workspaceSlug: string, initiativeId: string): Promise<TEpicStats[] | undefined> => {
    try {
      const response = await this.initiativeService.fetchInitiativeEpicStats(workspaceSlug, initiativeId);

      runInAction(() => {
        if (!response) return;

        if (!this.rootStore.epicAnalytics.epicStatsMap) this.rootStore.epicAnalytics.epicStatsMap = {};

        response.forEach((stats) => {
          if (!stats) return;

          this.rootStore.epicAnalytics.epicStatsMap[stats.epic_id] = stats;
        });
      });

      return response;
    } catch (error) {
      console.error("error while fetching initiatives stats", error);
      throw error;
    }
  };

  /**
   * Fetch the initiative analytics
   */
  fetchInitiativeAnalytics = async (
    workspaceSlug: string,
    initiativeId: string
  ): Promise<TInitiativeAnalytics | undefined> => {
    try {
      runInAction(() => {
        this.initiativeStore.initiativeAnalyticsLoader = {
          ...this.initiativeStore.initiativeAnalyticsLoader,
          [initiativeId]: "init-loader",
        };
      });

      const response = await this.initiativeService.fetchInitiativeAnalytics(workspaceSlug, initiativeId);

      runInAction(() => {
        if (response) {
          this.initiativeStore.initiativeAnalyticsMap[initiativeId] = response;
        }
        this.initiativeStore.initiativeAnalyticsLoader = {
          ...this.initiativeStore.initiativeAnalyticsLoader,
          [initiativeId]: undefined,
        };
      });

      return response;
    } catch (error) {
      console.error("Error while fetching initiative analytics", error);
      runInAction(() => {
        this.initiativeStore.initiativeAnalyticsLoader = {
          ...this.initiativeStore.initiativeAnalyticsLoader,
          [initiativeId]: undefined,
        };
      });
      return undefined;
    }
  };

  /**
   * Ensures linked initiative epics are hydrated for the selection UI, fetching only when local data is incomplete.
   */
  fetchInitiativeEpicsDetail = async (workspaceSlug: string, initiativeId: string): Promise<string[] | undefined> => {
    const currentEpicIds = this.getCurrentLinkedEpicIds(initiativeId);

    if (this.hasHydratedEpicDetails(currentEpicIds)) {
      if (currentEpicIds.length > 0 && !this.initiativeEpicsDetailMap.has(initiativeId)) {
        runInAction(() => {
          this.initiativeEpicsDetailMap.set(initiativeId, currentEpicIds);
        });
      }

      return this.initiativeEpicsDetailMap.get(initiativeId) ?? currentEpicIds;
    }

    await this.fetchInitiativeEpicsDetailAsync(workspaceSlug, initiativeId);
    return this.initiativeEpicsDetailMap.get(initiativeId);
  };

  /**
   * Async implementation for detail page fetch
   */
  private fetchInitiativeEpicsDetailAsync = async (workspaceSlug: string, initiativeId: string): Promise<void> => {
    try {
      const detailResponse = await this.initiativeService.fetchInitiativeEpicsDetail(workspaceSlug, initiativeId, {
        expand: "issue_relation,issue_related",
      });
      const response = detailResponse.results ?? [];
      const transformedResponse = response.map((epic) => ({ ...epic, is_epic: true }));
      const responseIds = transformedResponse.map((epic) => epic.id);

      this.rootStore.issue.issues.addIssue(transformedResponse);

      const projectIds = [
        ...new Set(
          transformedResponse
            .map((epic) => epic.project_id)
            .filter((projectId): projectId is string => Boolean(projectId))
        ),
      ];
      if (projectIds.length > 0) {
        await Promise.all(
          projectIds.map((projectId) => this.rootStore.state.fetchProjectStates(workspaceSlug, projectId))
        );
      }

      runInAction(() => {
        this.initiativeEpicsDetailMap.set(initiativeId, responseIds);
      });

      this.rootStore.issue.issueDetail.relation.extractRelationsFromIssues(transformedResponse);
      this.fetchInitiativeEpicStats(workspaceSlug, initiativeId);
    } catch (error) {
      console.error("Error while fetching initiative epics detail", error);
    }
  };

  /**
   * Remove the epic from the initiative
   */
  removeEpicFromInitiative = async (workspaceSlug: string, initiativeId: string, epicId: string): Promise<void> => {
    try {
      await this.initiativeService.removeEpicsFromInitiative(workspaceSlug, initiativeId, epicId);

      runInAction(() => {
        this.removeIssueFromList(epicId);
        const epicDetailIds = this.initiativeEpicsDetailMap.get(initiativeId);
        if (epicDetailIds) {
          this.initiativeEpicsDetailMap.set(
            initiativeId,
            epicDetailIds.filter((id) => String(id) !== String(epicId))
          );
        }
        const init = this.initiativeStore.initiativesMap?.[initiativeId];
        if (init?.epic_ids?.length) {
          this.initiativeStore.initiativesMap![initiativeId] = {
            ...init,
            epic_ids: init.epic_ids.filter((id) => String(id) !== String(epicId)),
          };
        }
      });
      this.fetchInitiativeAnalytics(workspaceSlug, initiativeId);
      this.initiativeStore.initiativeCommentActivities.fetchActivities(workspaceSlug, initiativeId);
    } catch (error) {
      console.error("error while removing epic from initiative", error);
    }
  };

  /**
   * Sync initiative epics to the submitted id list. POST sends the full desired `epic_ids` set;
   * the API adds missing links and removes links not in the payload.
   */
  addEpicsToInitiative = async (workspaceSlug: string, initiativeId: string, epicIds: string[]): Promise<void> => {
    try {
      const desired = [...new Set(epicIds.map(String))];
      const current = this.getCurrentLinkedEpicIds(initiativeId);
      const currentSet = new Set(current);
      const desiredSet = new Set(desired);
      const unchanged = currentSet.size === desiredSet.size && [...desiredSet].every((id) => currentSet.has(id));
      if (unchanged) {
        return;
      }

      const toRemove = current.filter((id) => !desiredSet.has(id));

      const response = await this.initiativeService.syncInitiativeEpics(workspaceSlug, initiativeId, desired);

      const transformedResponse = response.map((epic) => ({
        ...epic,
        is_epic: true,
      }));

      if (transformedResponse.length > 0) {
        this.rootStore.issue.issues.addIssue(transformedResponse);
      }

      runInAction(() => {
        const init = this.initiativeStore.initiativesMap?.[initiativeId];
        if (init) {
          this.initiativeStore.initiativesMap![initiativeId] = { ...init, epic_ids: desired };
        }
        this.initiativeEpicsDetailMap.set(initiativeId, desired);
        for (const id of toRemove) {
          this.removeIssueFromList(id);
        }
      });

      try {
        const scopeListRefetch =
          this.paginationOptions != null
            ? this.fetchIssuesWithExistingPagination(workspaceSlug, initiativeId, "mutation", true)
            : this.fetchIssues(
                workspaceSlug,
                initiativeId,
                "mutation",
                { canGroup: true, perPageCount: 100 },
                false,
                true
              );

        await Promise.all([
          scopeListRefetch,
          this.fetchInitiativeEpicsDetailAsync(workspaceSlug, initiativeId),
          this.fetchInitiativeAnalytics(workspaceSlug, initiativeId),
          this.initiativeStore.initiativeCommentActivities.fetchActivities(workspaceSlug, initiativeId),
        ]);
      } catch (error) {
        console.error("Error fetching initiative stats or analytics:", error);
      }
    } catch (error) {
      console.error("Error syncing initiative epics", error);
      throw error;
    }
  };

  // Bindings matching the IBaseIssuesStore pattern
  updateIssue = this.issueUpdate.bind(this);
  archiveIssue = this.issueArchive.bind(this);
}
