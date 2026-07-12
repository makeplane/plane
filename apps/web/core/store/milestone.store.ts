/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { set, sortBy } from "lodash-es";
import { action, makeObservable, observable, runInAction } from "mobx";
import { computedFn } from "mobx-utils";
// plane imports
import type { TMilestone, TMilestoneFormData, TMilestoneIssue, TMilestoneWorkItem } from "@plane/types";
// services
import { MilestoneService } from "@/services/milestone.service";
// store
import type { CoreRootStore } from "./root.store";

export type TMilestoneLoader = "init-loader" | "mutation" | undefined;

export interface IMilestoneStore {
  // observables
  milestoneMap: Record<string, TMilestone>;
  milestoneIssuesByMilestoneId: Record<string, TMilestoneIssue[]>;
  fetchStatusByProjectId: Record<string, boolean>;
  loader: TMilestoneLoader;
  // computed getters
  getMilestonesByProjectId: (projectId: string | null | undefined) => TMilestone[];
  getMilestoneById: (milestoneId: string | null | undefined) => TMilestone | undefined;
  getMilestoneIssuesByMilestoneId: (milestoneId: string | null | undefined) => TMilestoneIssue[];
  getIsMilestonesFetchedForProject: (projectId: string | null | undefined) => boolean;
  // fetch actions
  fetchMilestones: (workspaceSlug: string, projectId: string) => Promise<TMilestone[]>;
  fetchMilestoneDetails: (workspaceSlug: string, projectId: string, milestoneId: string) => Promise<TMilestone>;
  fetchMilestoneIssues: (workspaceSlug: string, projectId: string, milestoneId: string) => Promise<TMilestoneIssue[]>;
  // crud actions
  createMilestone: (workspaceSlug: string, projectId: string, data: TMilestoneFormData) => Promise<TMilestone>;
  updateMilestone: (
    workspaceSlug: string,
    projectId: string,
    milestoneId: string,
    data: Partial<TMilestoneFormData>
  ) => Promise<TMilestone>;
  deleteMilestone: (workspaceSlug: string, projectId: string, milestoneId: string) => Promise<void>;
  // work item link actions
  addIssuesToMilestone: (
    workspaceSlug: string,
    projectId: string,
    milestoneId: string,
    issueIds: string[]
  ) => Promise<void>;
  removeIssueFromMilestone: (
    workspaceSlug: string,
    projectId: string,
    milestoneId: string,
    issueId: string
  ) => Promise<void>;
}

export class MilestoneStore implements IMilestoneStore {
  // observables
  milestoneMap: Record<string, TMilestone> = {};
  milestoneIssuesByMilestoneId: Record<string, TMilestoneIssue[]> = {};
  fetchStatusByProjectId: Record<string, boolean> = {};
  loader: TMilestoneLoader = undefined;
  // root store
  rootStore: CoreRootStore;
  // services
  milestoneService: MilestoneService;

  constructor(_rootStore: CoreRootStore) {
    makeObservable(this, {
      // observables
      milestoneMap: observable,
      milestoneIssuesByMilestoneId: observable,
      fetchStatusByProjectId: observable,
      loader: observable.ref,
      // fetch actions
      fetchMilestones: action,
      fetchMilestoneDetails: action,
      fetchMilestoneIssues: action,
      // crud actions
      createMilestone: action,
      updateMilestone: action,
      deleteMilestone: action,
      // work item link actions
      addIssuesToMilestone: action,
      removeIssueFromMilestone: action,
    });
    this.rootStore = _rootStore;
    this.milestoneService = new MilestoneService();
  }

  /**
   * @description the milestone project reference may arrive as `project_id` or `project`
   */
  private normalizeMilestone = (milestone: TMilestone): TMilestone => ({
    ...milestone,
    project_id: milestone.project_id ?? (typeof milestone.project === "string" ? milestone.project : undefined),
  });

  /**
   * @description the linked work item may arrive as an id or expanded inline
   */
  private normalizeMilestoneIssue = (link: TMilestoneIssue): TMilestoneIssue => {
    const rawIssue = link.issue as unknown;
    if (rawIssue && typeof rawIssue === "object") {
      const detail = rawIssue as TMilestoneWorkItem;
      return { ...link, issue: detail.id, issue_detail: link.issue_detail ?? detail };
    }
    return link;
  };

  /**
   * @description returns the milestones of a project, ordered by sort_order then name.
   * Scoped to the given project so ids never leak across projects.
   */
  getMilestonesByProjectId = computedFn((projectId: string | null | undefined) => {
    if (!projectId) return [];
    return sortBy(
      Object.values(this.milestoneMap).filter((milestone) => milestone.project_id === projectId),
      ["sort_order", "name"]
    );
  });

  /**
   * @description returns a milestone by id
   */
  getMilestoneById = computedFn((milestoneId: string | null | undefined) => {
    if (!milestoneId) return undefined;
    return this.milestoneMap[milestoneId] ?? undefined;
  });

  /**
   * @description returns the work item links of a milestone (empty array when none loaded)
   */
  getMilestoneIssuesByMilestoneId = computedFn((milestoneId: string | null | undefined) => {
    if (!milestoneId) return [];
    return this.milestoneIssuesByMilestoneId[milestoneId] ?? [];
  });

  /**
   * @description whether the milestones of a project have been fetched
   */
  getIsMilestonesFetchedForProject = computedFn(
    (projectId: string | null | undefined) =>
      Boolean(projectId) && Boolean(this.fetchStatusByProjectId[projectId as string])
  );

  /**
   * @description fetches the milestones of a project and stores them
   */
  fetchMilestones = async (workspaceSlug: string, projectId: string) => {
    try {
      this.loader = "init-loader";
      const response = await this.milestoneService.getMilestones(workspaceSlug, projectId);
      const milestones = Array.isArray(response) ? response : [];
      runInAction(() => {
        // drop milestones of the project that no longer exist on the server
        const fetchedIds = new Set(milestones.map((milestone) => milestone.id));
        Object.values(this.milestoneMap).forEach((milestone) => {
          if (milestone.project_id === projectId && !fetchedIds.has(milestone.id)) {
            delete this.milestoneMap[milestone.id];
          }
        });
        milestones.forEach((milestone) => {
          set(this.milestoneMap, [milestone.id], this.normalizeMilestone(milestone));
        });
        set(this.fetchStatusByProjectId, [projectId], true);
        this.loader = undefined;
      });
      return milestones;
    } catch (error) {
      runInAction(() => {
        this.loader = undefined;
      });
      throw error;
    }
  };

  /**
   * @description fetches a single milestone (refreshes the annotated counters)
   */
  fetchMilestoneDetails = async (workspaceSlug: string, projectId: string, milestoneId: string) => {
    const response = await this.milestoneService.getMilestoneDetails(workspaceSlug, projectId, milestoneId);
    runInAction(() => {
      set(this.milestoneMap, [milestoneId], this.normalizeMilestone(response));
    });
    return response;
  };

  /**
   * @description fetches the work item links of a milestone
   */
  fetchMilestoneIssues = async (workspaceSlug: string, projectId: string, milestoneId: string) => {
    const response = await this.milestoneService.getMilestoneIssues(workspaceSlug, projectId, milestoneId);
    const links = (Array.isArray(response) ? response : []).map(this.normalizeMilestoneIssue);
    runInAction(() => {
      set(this.milestoneIssuesByMilestoneId, [milestoneId], links);
    });
    return links;
  };

  /**
   * @description creates a milestone in the given project
   */
  createMilestone = async (workspaceSlug: string, projectId: string, data: TMilestoneFormData) => {
    this.loader = "mutation";
    try {
      const response = await this.milestoneService.createMilestone(workspaceSlug, projectId, data);
      runInAction(() => {
        set(
          this.milestoneMap,
          [response.id],
          this.normalizeMilestone({ ...response, project_id: response.project_id ?? projectId })
        );
        this.loader = undefined;
      });
      return response;
    } catch (error) {
      runInAction(() => {
        this.loader = undefined;
      });
      throw error;
    }
  };

  /**
   * @description updates a milestone optimistically, reverting on failure
   */
  updateMilestone = async (
    workspaceSlug: string,
    projectId: string,
    milestoneId: string,
    data: Partial<TMilestoneFormData>
  ) => {
    const originalMilestone = this.milestoneMap[milestoneId];
    try {
      if (originalMilestone) {
        runInAction(() => {
          set(this.milestoneMap, [milestoneId], { ...originalMilestone, ...data });
        });
      }
      const response = await this.milestoneService.updateMilestone(workspaceSlug, projectId, milestoneId, data);
      runInAction(() => {
        set(
          this.milestoneMap,
          [milestoneId],
          this.normalizeMilestone({
            ...originalMilestone,
            ...response,
            project_id: response.project_id ?? originalMilestone?.project_id ?? projectId,
          })
        );
      });
      return response;
    } catch (error) {
      runInAction(() => {
        if (originalMilestone) set(this.milestoneMap, [milestoneId], originalMilestone);
      });
      throw error;
    }
  };

  /**
   * @description deletes a milestone and its cached work item links
   */
  deleteMilestone = async (workspaceSlug: string, projectId: string, milestoneId: string) => {
    await this.milestoneService.deleteMilestone(workspaceSlug, projectId, milestoneId);
    runInAction(() => {
      delete this.milestoneMap[milestoneId];
      delete this.milestoneIssuesByMilestoneId[milestoneId];
    });
  };

  /**
   * @description adds work items to a milestone then refreshes the links and counters
   */
  addIssuesToMilestone = async (workspaceSlug: string, projectId: string, milestoneId: string, issueIds: string[]) => {
    if (issueIds.length === 0) return;
    await this.milestoneService.addIssuesToMilestone(workspaceSlug, projectId, milestoneId, { issues: issueIds });
    await this.fetchMilestoneIssues(workspaceSlug, projectId, milestoneId);
    // silent refresh of the annotated counters
    this.fetchMilestoneDetails(workspaceSlug, projectId, milestoneId).catch(() => undefined);
  };

  /**
   * @description removes a work item from a milestone
   */
  removeIssueFromMilestone = async (workspaceSlug: string, projectId: string, milestoneId: string, issueId: string) => {
    await this.milestoneService.removeIssueFromMilestone(workspaceSlug, projectId, milestoneId, issueId);
    runInAction(() => {
      const links = this.milestoneIssuesByMilestoneId[milestoneId] ?? [];
      set(
        this.milestoneIssuesByMilestoneId,
        [milestoneId],
        links.filter((link) => link.issue !== issueId)
      );
    });
    // silent refresh of the annotated counters
    this.fetchMilestoneDetails(workspaceSlug, projectId, milestoneId).catch(() => undefined);
  };
}
