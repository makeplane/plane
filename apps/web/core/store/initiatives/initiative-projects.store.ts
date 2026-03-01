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

import { set } from "lodash-es";
import { action, makeObservable, observable, runInAction } from "mobx";
import { computedFn } from "mobx-utils";
import type { TLoader } from "@plane/types";
import { InitiativeService } from "@/services/initiative.service";
import type { RootStore } from "../../../ee/store/root.store";
import type { IInitiativeProjectsFilterStore } from "./initiative-projects-filter.store";
import { InitiativeProjectsFilterStore } from "./initiative-projects-filter.store";
import type { IInitiativeStore } from "./initiatives.store";

export interface IInitiativeProjectsStore {
  initiativeProjectLoader: Record<string, TLoader>;
  initiativeProjectsMap: Record<string, string[]>;

  // actions
  fetchInitiativeProjects: (workspaceSlug: string, initiativeId: string) => string[] | undefined;
  fetchInitiativeProjectsDetail: (workspaceSlug: string, initiativeId: string) => string[] | undefined;
  getInitiativeProjectsById: (initiativeId: string) => string[];
  removeProjectFromInitiative: (workspaceSlug: string, initiativeId: string, projectId: string) => Promise<void>;
  addProjectsToInitiative: (workspaceSlug: string, initiativeId: string, projectIds: string[]) => Promise<void>;

  filters: IInitiativeProjectsFilterStore;
}

export class InitiativeProjectsStore implements IInitiativeProjectsStore {
  initiativeProjectLoader: Record<string, TLoader> = {};
  initiativeProjectsMap: Record<string, string[]> = {};

  initiativeStore: IInitiativeStore;
  initiativeService: InitiativeService;
  rootStore: RootStore;
  filters: IInitiativeProjectsFilterStore;

  constructor(_rootStore: RootStore, initiativeService: InitiativeService) {
    makeObservable(this, {
      // observables
      initiativeProjectLoader: observable,
      initiativeProjectsMap: observable,
      // actions
      fetchInitiativeProjects: action,
      fetchInitiativeProjectsDetail: action,
      removeProjectFromInitiative: action,
      addProjectsToInitiative: action,
    });

    this.rootStore = _rootStore;
    this.initiativeService = initiativeService;
    this.initiativeStore = this.rootStore.initiativeStore;
    this.filters = new InitiativeProjectsFilterStore(this, initiativeService);
  }

  /**
   * Get the project ids for the initiative
   * @param initiativeId - The initiative id
   * @returns The project ids
   */
  getInitiativeProjectsById = computedFn((initiativeId: string) => this.initiativeProjectsMap?.[initiativeId] ?? []);

  /**
   * Fetch the initiative projects
   * @param workspaceSlug - The workspace slug
   * @param initiativeId - The initiative id
   * @returns The initiative projects
   */
  fetchInitiativeProjects = (workspaceSlug: string, initiativeId: string): string[] | undefined => {
    // Start the async operation
    void this.fetchInitiativeProjectsAsync(workspaceSlug, initiativeId);
    // Return the current value synchronously
    return this.initiativeProjectsMap[initiativeId];
  };

  /**
   * Fetch the initiative projects detail
   * @param workspaceSlug - The workspace slug
   * @param initiativeId - The initiative id
   * @returns The initiative projects
   */
  fetchInitiativeProjectsDetail = (workspaceSlug: string, initiativeId: string): string[] | undefined => {
    // Start the async operation
    void this.fetchInitiativeProjectsAsync(workspaceSlug, initiativeId, true);
    // Return the current value synchronously
    return this.initiativeProjectsMap[initiativeId];
  };

  /**
   * Fetch the initiative projects asynchronously
   * @param workspaceSlug - The workspace slug
   * @param initiativeId - The initiative id
   * @returns The initiative projects
   */
  private fetchInitiativeProjectsAsync = async (
    workspaceSlug: string,
    initiativeId: string,
    fetchDetail: boolean = false
  ) => {
    try {
      runInAction(() => {
        this.initiativeProjectLoader = {
          ...this.initiativeProjectLoader,
          [initiativeId]: "init-loader",
        };
      });

      // fetch the initiative projects
      let response;

      if (fetchDetail) {
        // For detail fetch, get all projects with full details
        response = await this.initiativeService.fetchInitiativeProjects(workspaceSlug, initiativeId);
      } else {
        // Apply filters if available
        const filters = this.filters.getInitiativeProjectsFiltersById(initiativeId)?.richFilters ?? {};
        const params: Record<string, string> = {};
        if (filters && Object.keys(filters).length > 0) {
          params.filters = JSON.stringify(filters);
        }
        response = await this.initiativeService.fetchInitiativeProjects(workspaceSlug, initiativeId, params);
      }

      // Ensure response is an array
      if (!Array.isArray(response)) {
        console.error("Expected array response from fetchInitiativeProjects, got:", response);
        throw new Error("Invalid response format from fetchInitiativeProjects");
      }

      // Response is an array of project IDs (strings)
      const projectIds: string[] = response;

      // Fetch project details for projects not already in the store
      const projectsToFetch = projectIds.filter(
        (projectId) => !this.rootStore.projectRoot.project.projectMap[projectId]
      );

      if (projectsToFetch.length > 0) {
        // Fetch project details in parallel (fire and forget, don't block)
        void Promise.all(
          projectsToFetch.map((projectId) =>
            this.rootStore.projectRoot.project.fetchProjectDetails(workspaceSlug, projectId).catch((error) => {
              console.error(`Error fetching project details for ${projectId}:`, error);
              return null;
            })
          )
        );
      }

      runInAction(() => {
        this.initiativeProjectsMap[initiativeId] = projectIds;
        this.initiativeProjectLoader = {
          ...this.initiativeProjectLoader,
          [initiativeId]: "loaded",
        };
      });

      return projectIds;
    } catch (error) {
      console.error("Error while fetching initiative projects", error);
      runInAction(() => {
        this.initiativeProjectLoader = {
          ...this.initiativeProjectLoader,
          [initiativeId]: undefined,
        };
      });
      return undefined;
    }
  };

  /**
   * Remove the project from the initiative
   * @param workspaceSlug - The workspace slug
   * @param initiativeId - The initiative id
   * @param projectId - The project id
   */
  removeProjectFromInitiative = async (
    workspaceSlug: string,
    initiativeId: string,
    projectId: string
  ): Promise<void> => {
    try {
      await this.initiativeService.deleteProjectsFromInitiative(workspaceSlug, initiativeId, projectId);

      runInAction(() => {
        if (this.initiativeProjectsMap?.[initiativeId]) {
          this.initiativeProjectsMap[initiativeId] = this.initiativeProjectsMap[initiativeId].filter(
            (id) => id !== projectId
          );
        }
      });
      void this.fetchInitiativeAnalytics(workspaceSlug, initiativeId);
      void this.initiativeStore.initiativeCommentActivities.fetchActivities(workspaceSlug, initiativeId);
    } catch (error) {
      console.error("error while removing project from initiative", error);
    }
  };

  /**
   * Add the projects to the initiative
   * @param workspaceSlug - The workspace slug
   * @param initiativeId - The initiative id
   * @param projectIds - The project ids
   */
  addProjectsToInitiative = async (
    workspaceSlug: string,
    initiativeId: string,
    projectIds: string[]
  ): Promise<void> => {
    try {
      const response = await this.initiativeService.addProjectsToInitiative(workspaceSlug, initiativeId, projectIds);

      // Extract project IDs from response
      const responseProjectIds = response.map((initiativeProject) => initiativeProject.project);

      // Fetch project details for newly added projects
      const projectDetailsPromises = responseProjectIds.map((projectId) =>
        this.rootStore.projectRoot.project.fetchProjectDetails(workspaceSlug, projectId).catch((error) => {
          console.error(`Error fetching project details for ${projectId}:`, error);
          return null;
        })
      );

      void Promise.all(projectDetailsPromises);

      runInAction(() => {
        set(this.initiativeProjectsMap, [initiativeId], responseProjectIds);
      });

      try {
        await Promise.all([
          Promise.resolve(this.fetchInitiativeProjects(workspaceSlug, initiativeId)),
          this.fetchInitiativeAnalytics(workspaceSlug, initiativeId),
          this.initiativeStore.initiativeCommentActivities.fetchActivities(workspaceSlug, initiativeId),
        ]);
      } catch (error) {
        console.error("Error fetching initiative stats or analytics:", error);
        // Not throwing here since the main operation (adding projects) was successful
      }
    } catch (error) {
      console.error("Error adding projects to initiative", error);
      throw error;
    }
  };

  /**
   * Fetch the initiative analytics
   * @param workspaceSlug - The workspace slug
   * @param initiativeId - The initiative id
   * @returns The initiative analytics
   */
  fetchInitiativeAnalytics = async (workspaceSlug: string, initiativeId: string) => {
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
}
