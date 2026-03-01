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

import { isEmpty } from "lodash-es";
import { action, makeObservable, observable, runInAction } from "mobx";
import { computedFn } from "mobx-utils";
import type { TEpicStats, TLoader, TIssue } from "@plane/types";
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
  initiativeEpicLoader: Record<string, TLoader>;
  initiativeEpicsMap: Map<string, string[]>; // For scope page (filtered)
  initiativeEpicsDetailMap: Map<string, string[]>; // For detail page (unfiltered)

  // actions
  fetchInitiativeEpics: (workspaceSlug: string, initiativeId: string) => string[] | undefined;
  fetchInitiativeEpicsDetail: (workspaceSlug: string, initiativeId: string) => string[] | undefined;
  getInitiativeEpicsById: (initiativeId: string) => string[] | undefined;
  getInitiativeEpicsDetailById: (initiativeId: string) => string[] | undefined;
  removeEpicFromInitiative: (workspaceSlug: string, initiativeId: string, epicId: string) => Promise<void>;
  addEpicsToInitiative: (workspaceSlug: string, initiativeId: string, epicIds: string[]) => Promise<void>;
  updateIssue: (workspaceSlug: string, projectId: string, issueId: string, data: Partial<TIssue>) => Promise<void>;
  archiveIssue?: (workspaceSlug: string, projectId: string, issueId: string) => Promise<void>;

  fetchInitiativeEpicStats: (workspaceSlug: string, initiativeId: string) => Promise<TEpicStats[] | undefined>;
  filters: IInitiativeEpicsFilterStore;
}

export class InitiativeEpicStore extends BaseIssuesStore implements IInitiativeEpicStore {
  // Custom properties for initiative epics
  initiativeEpicLoader: Record<string, TLoader> = {};
  initiativeEpicsMap: Map<string, string[]> = new Map(); // Scope page (filtered)
  initiativeEpicsDetailMap: Map<string, string[]> = new Map(); // Detail page (unfiltered)

  initiativeStore: IInitiativeStore;
  initiativeService: InitiativeService;
  rootStore: RootStore;
  initiativeEpicsFilterStore: IInitiativeEpicsFilterStore;
  filters: IInitiativeEpicsFilterStore;

  constructor(_rootStore: IIssueRootStore, initiativeEpicsFilterStore: IInitiativeEpicsFilterStore) {
    super(_rootStore, initiativeEpicsFilterStore, false, EIssueServiceType.EPICS);

    makeObservable(this, {
      // BaseIssuesStore observables are already handled by super()
      // Custom observables
      initiativeEpicLoader: observable,
      initiativeEpicsMap: observable,
      initiativeEpicsDetailMap: observable,
      // actions
      fetchInitiativeEpicStats: action,
      fetchInitiativeAnalytics: action,
      fetchInitiativeEpics: action,
      removeEpicFromInitiative: action,
      addEpicsToInitiative: action,
      fetchInitiativeEpicsDetail: action,
      updateIssue: action,
    });

    // filter store
    this.initiativeEpicsFilterStore = initiativeEpicsFilterStore;
    this.filters = initiativeEpicsFilterStore;
    this.rootStore = _rootStore.rootStore;
    this.initiativeService = new InitiativeService();
    this.initiativeStore = this.rootStore.initiativeStore;
  }

  // Implement abstract methods from BaseIssuesStore
  fetchParentStats = (_workspaceSlug: string, _projectId?: string, _id?: string) => {
    // No-op for initiative epics - they don't have a parent project/cycle/module
  };

  updateParentStats = (_prevIssueState?: TIssue, _nextIssueState?: TIssue, _id?: string) => {
    // No-op for initiative epics - they don't update parent stats
  };

  /**
   * Get the epic ids for the initiative (scope page - filtered)
   * @param initiativeId - The initiative id
   * @returns The epic ids
   */
  getInitiativeEpicsById = computedFn((initiativeId: string) => this.initiativeEpicsMap.get(initiativeId));

  /**
   * Get the epic ids for the initiative (detail page - unfiltered)
   * @param initiativeId - The initiative id
   * @returns The epic ids
   */
  getInitiativeEpicsDetailById = computedFn((initiativeId: string) => this.initiativeEpicsDetailMap.get(initiativeId));

  /**
   * Fetch the epic stats for the initiative
   * @param workspaceSlug - The workspace slug
   * @param initiativeId - The initiative id
   * @returns The epic stats
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
   * @param workspaceSlug - The workspace slug
   * @param initiativeId - The initiative id
   * @returns The initiative analytics
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
          [initiativeId]: "loaded",
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
   * Fetch the initiative epics
   * @param workspaceSlug - The workspace slug
   * @param initiativeId - The initiative id
   * @returns The initiative epics
   */
  fetchInitiativeEpics = (workspaceSlug: string, initiativeId: string): string[] | undefined => {
    // Start the async operation

    this.fetchInitiativeEpicsAsync(workspaceSlug, initiativeId);
    // Return the current value synchronously
    return this.initiativeEpicsMap.get(initiativeId);
  };

  /**
   * Fetch the initiative epics detail
   * @param workspaceSlug - The workspace slug
   * @param initiativeId - The initiative id
   * @returns The initiative epics
   */
  fetchInitiativeEpicsDetail = (workspaceSlug: string, initiativeId: string): string[] | undefined => {
    // Start the async operation
    this.fetchInitiativeEpicsAsync(workspaceSlug, initiativeId, true);
    // Return the current value synchronously from detail map
    return this.initiativeEpicsDetailMap.get(initiativeId);
  };

  /**
   * Fetch the initiative epics asynchronously
   * @param workspaceSlug - The workspace slug
   * @param initiativeId - The initiative id
   * @returns The initiative epics
   */
  private fetchInitiativeEpicsAsync = async (
    workspaceSlug: string,
    initiativeId: string,
    fetchDetail: boolean = false
  ) => {
    try {
      runInAction(() => {
        this.initiativeEpicLoader = {
          ...this.initiativeEpicLoader,
          [initiativeId]: "init-loader",
        };
      });

      // fetch the initiative epics
      let response;

      if (fetchDetail) {
        const detailResponse = await this.initiativeService.fetchInitiativeEpicsDetail(workspaceSlug, initiativeId, {
          expand: "issue_relation,issue_related",
        });
        response = detailResponse.results;
      } else {
        const filters = this.initiativeEpicsFilterStore.getInitiativeEpicsFiltersById(initiativeId)?.richFilters ?? {};
        const params: Record<string, string | undefined> = {};
        params.filters = isEmpty(filters) ? undefined : JSON.stringify(filters);

        response = await this.initiativeService.fetchInitiativeEpics(workspaceSlug, initiativeId, params);
      }

      const transformedResponse = response.map((epic) => ({
        ...epic,
        is_epic: true,
      }));

      const responseIds = transformedResponse.map((epic) => epic.id);

      this.rootStore.issue.issues.addIssue(transformedResponse);

      runInAction(() => {
        if (transformedResponse) {
          // Store in appropriate map based on context
          if (fetchDetail) {
            this.initiativeEpicsDetailMap.set(initiativeId, responseIds);
          } else {
            this.initiativeEpicsMap.set(initiativeId, responseIds);
          }
        }
        this.initiativeEpicLoader = {
          ...this.initiativeEpicLoader,
          [initiativeId]: "loaded",
        };
      });

      if (fetchDetail) this.rootStore.issue.issueDetail.relation.extractRelationsFromIssues(transformedResponse);

      this.fetchInitiativeEpicStats(workspaceSlug, initiativeId);
      return responseIds;
    } catch (error) {
      console.error("Error while fetching initiative epics", error);
      runInAction(() => {
        this.initiativeEpicLoader = {
          ...this.initiativeEpicLoader,
          [initiativeId]: undefined,
        };
      });
      return undefined;
    }
  };

  /**
   * Remove the epic from the initiative
   * @param workspaceSlug - The workspace slug
   * @param initiativeId - The initiative id
   * @param epicId - The epic id
   */
  removeEpicFromInitiative = async (workspaceSlug: string, initiativeId: string, epicId: string): Promise<void> => {
    try {
      await this.initiativeService.removeEpicsFromInitiative(workspaceSlug, initiativeId, epicId);

      runInAction(() => {
        // Update both maps when removing an epic
        const epicIds = this.initiativeEpicsMap.get(initiativeId);
        if (epicIds) {
          this.initiativeEpicsMap.set(
            initiativeId,
            epicIds.filter((id) => id !== epicId)
          );
        }
        const epicDetailIds = this.initiativeEpicsDetailMap.get(initiativeId);
        if (epicDetailIds) {
          this.initiativeEpicsDetailMap.set(
            initiativeId,
            epicDetailIds.filter((id) => id !== epicId)
          );
        }
      });
      this.fetchInitiativeAnalytics(workspaceSlug, initiativeId);
      this.initiativeStore.initiativeCommentActivities.fetchActivities(workspaceSlug, initiativeId);
    } catch (error) {
      console.error("error while removing epic from initiative", error);
    }
  };

  /**
   * Add the epic to the initiative
   * @param workspaceSlug - The workspace slug
   * @param initiativeId - The initiative id
   * @param epicIds - The epic ids
   */
  addEpicsToInitiative = async (workspaceSlug: string, initiativeId: string, epicIds: string[]): Promise<void> => {
    try {
      const response = await this.initiativeService.addEpicsToInitiative(workspaceSlug, initiativeId, epicIds);

      const transformedResponse = response.map((epic) => ({
        ...epic,
        is_epic: true,
      }));

      const responseIds = transformedResponse.map((epic) => epic.id);

      this.rootStore.issue.issues.addIssue(transformedResponse);

      runInAction(() => {
        // Update both maps when adding epics
        this.initiativeEpicsMap.set(initiativeId, responseIds);
        this.initiativeEpicsDetailMap.set(initiativeId, responseIds);
      });

      try {
        await Promise.all([
          this.fetchInitiativeEpics(workspaceSlug, initiativeId),
          this.fetchInitiativeEpicsDetail(workspaceSlug, initiativeId),
          this.fetchInitiativeAnalytics(workspaceSlug, initiativeId),
          this.initiativeStore.initiativeCommentActivities.fetchActivities(workspaceSlug, initiativeId),
        ]);
      } catch (error) {
        console.error("Error fetching initiative stats or analytics:", error);
        // Not throwing here since the main operation (adding epics) was successful
      }
    } catch (error) {
      console.error("Error adding epics to initiative", error);
      throw error;
    }
  };

  /**
   * Update an epic issue
   * @param workspaceSlug - The workspace slug
   * @param projectId - The project id
   * @param issueId - The epic issue id
   * @param data - Partial issue data to update
   */
  updateIssue = this.issueUpdate.bind(this);
}
