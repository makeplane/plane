/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { set } from "lodash-es";
import { action, makeObservable, observable, runInAction } from "mobx";
import { computedFn } from "mobx-utils";
// plane imports
import type { TIssueWorklog, TWorklogFormData } from "@plane/types";
// services
import { WorklogService } from "@/services/worklog.service";
// store
import type { CoreRootStore } from "./root.store";

export type TWorklogLoader = "fetch" | "mutate" | undefined;

export interface IWorklogStore {
  // observables
  worklogsByIssueId: Record<string, TIssueWorklog[]>;
  worklogSummaryByIssueId: Record<string, number>;
  // loaders
  fetchStatusByIssueId: Record<string, boolean>;
  loader: TWorklogLoader;
  // computed getters
  getWorklogsByIssueId: (issueId: string | null | undefined) => TIssueWorklog[];
  getTotalMinutesByIssueId: (issueId: string | null | undefined) => number;
  getIsWorklogsFetchedForIssue: (issueId: string | null | undefined) => boolean;
  // fetch actions
  fetchWorklogs: (workspaceSlug: string, projectId: string, issueId: string) => Promise<TIssueWorklog[]>;
  fetchProjectWorklogSummary: (workspaceSlug: string, projectId: string) => Promise<void>;
  // crud actions
  createWorklog: (
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    data: TWorklogFormData
  ) => Promise<TIssueWorklog>;
  updateWorklog: (
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    worklogId: string,
    data: Partial<TWorklogFormData>
  ) => Promise<TIssueWorklog>;
  deleteWorklog: (workspaceSlug: string, projectId: string, issueId: string, worklogId: string) => Promise<void>;
}

export class WorklogStore implements IWorklogStore {
  // observables
  worklogsByIssueId: Record<string, TIssueWorklog[]> = {};
  worklogSummaryByIssueId: Record<string, number> = {};
  // loaders
  fetchStatusByIssueId: Record<string, boolean> = {};
  loader: TWorklogLoader = undefined;
  // root store
  rootStore: CoreRootStore;
  // services
  worklogService: WorklogService;

  constructor(_rootStore: CoreRootStore) {
    makeObservable(this, {
      // observables
      worklogsByIssueId: observable,
      worklogSummaryByIssueId: observable,
      fetchStatusByIssueId: observable,
      loader: observable.ref,
      // fetch actions
      fetchWorklogs: action,
      fetchProjectWorklogSummary: action,
      // crud actions
      createWorklog: action,
      updateWorklog: action,
      deleteWorklog: action,
    });
    this.rootStore = _rootStore;
    this.worklogService = new WorklogService();
  }

  /**
   * @description returns the worklog entries of a work item (empty array when none loaded)
   */
  getWorklogsByIssueId = computedFn((issueId: string | null | undefined) => {
    if (!issueId) return [];
    return this.worklogsByIssueId[issueId] ?? [];
  });

  /**
   * @description returns the total logged minutes of a work item.
   * Prefers the loaded worklog entries, falling back to the aggregated summary.
   */
  getTotalMinutesByIssueId = computedFn((issueId: string | null | undefined) => {
    if (!issueId) return 0;
    const worklogs = this.worklogsByIssueId[issueId];
    if (worklogs) return worklogs.reduce((total, worklog) => total + (worklog.duration ?? 0), 0);
    return this.worklogSummaryByIssueId[issueId] ?? 0;
  });

  /**
   * @description whether the worklog entries of a work item have been fetched
   */
  getIsWorklogsFetchedForIssue = computedFn(
    (issueId: string | null | undefined) => Boolean(issueId) && Boolean(this.fetchStatusByIssueId[issueId as string])
  );

  /**
   * @description fetches the worklog entries of a work item and stores them
   */
  fetchWorklogs = async (workspaceSlug: string, projectId: string, issueId: string) => {
    try {
      this.loader = "fetch";
      const response = await this.worklogService.getWorklogs(workspaceSlug, projectId, issueId);
      runInAction(() => {
        set(this.worklogsByIssueId, [issueId], response);
        set(this.worklogSummaryByIssueId, [issueId], this.sumDurations(response));
        set(this.fetchStatusByIssueId, [issueId], true);
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
   * @description fetches the aggregated logged time for every work item of a project
   */
  fetchProjectWorklogSummary = async (workspaceSlug: string, projectId: string) => {
    const response = await this.worklogService.getProjectWorklogSummary(workspaceSlug, projectId);
    runInAction(() => {
      response.forEach((summary) => {
        set(this.worklogSummaryByIssueId, [summary.issue_id], summary.duration);
      });
    });
  };

  /**
   * @description creates a worklog entry and prepends it to the work item's list
   */
  createWorklog = async (workspaceSlug: string, projectId: string, issueId: string, data: TWorklogFormData) => {
    this.loader = "mutate";
    try {
      const response = await this.worklogService.createWorklog(workspaceSlug, projectId, issueId, data);
      runInAction(() => {
        const worklogs = this.worklogsByIssueId[issueId] ?? [];
        set(this.worklogsByIssueId, [issueId], [response, ...worklogs]);
        set(this.worklogSummaryByIssueId, [issueId], this.sumDurations(this.worklogsByIssueId[issueId]));
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
   * @description updates a worklog entry in place, reverting the optimistic write on failure
   */
  updateWorklog = async (
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    worklogId: string,
    data: Partial<TWorklogFormData>
  ) => {
    const originalWorklogs = this.worklogsByIssueId[issueId] ?? [];
    try {
      runInAction(() => {
        set(
          this.worklogsByIssueId,
          [issueId],
          originalWorklogs.map((worklog) => (worklog.id === worklogId ? { ...worklog, ...data } : worklog))
        );
        set(this.worklogSummaryByIssueId, [issueId], this.sumDurations(this.worklogsByIssueId[issueId]));
      });
      const response = await this.worklogService.updateWorklog(workspaceSlug, projectId, issueId, worklogId, data);
      runInAction(() => {
        set(
          this.worklogsByIssueId,
          [issueId],
          (this.worklogsByIssueId[issueId] ?? []).map((worklog) => (worklog.id === worklogId ? response : worklog))
        );
        set(this.worklogSummaryByIssueId, [issueId], this.sumDurations(this.worklogsByIssueId[issueId]));
      });
      return response;
    } catch (error) {
      runInAction(() => {
        set(this.worklogsByIssueId, [issueId], originalWorklogs);
        set(this.worklogSummaryByIssueId, [issueId], this.sumDurations(originalWorklogs));
      });
      throw error;
    }
  };

  /**
   * @description deletes a worklog entry from a work item's list
   */
  deleteWorklog = async (workspaceSlug: string, projectId: string, issueId: string, worklogId: string) => {
    await this.worklogService.deleteWorklog(workspaceSlug, projectId, issueId, worklogId);
    runInAction(() => {
      const worklogs = this.worklogsByIssueId[issueId] ?? [];
      set(
        this.worklogsByIssueId,
        [issueId],
        worklogs.filter((worklog) => worklog.id !== worklogId)
      );
      set(this.worklogSummaryByIssueId, [issueId], this.sumDurations(this.worklogsByIssueId[issueId]));
    });
  };

  /**
   * @description sums the durations (in minutes) of a list of worklog entries
   */
  private sumDurations = (worklogs: TIssueWorklog[] | undefined): number =>
    (worklogs ?? []).reduce((total, worklog) => total + (worklog.duration ?? 0), 0);
}
