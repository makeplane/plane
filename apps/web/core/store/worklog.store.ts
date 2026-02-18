/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { action, makeObservable, observable, runInAction } from "mobx";
import type { IWorkLog, IWorkLogCreate, IWorkLogUpdate, IWorkLogSummary } from "@plane/types";
import { WorklogService } from "@/services/worklog.service";

export interface IWorklogStore {
  // observables
  worklogsByIssueId: Record<string, IWorkLog[]>;
  isLoading: boolean;
  // helpers
  getWorklogsForIssue(issueId: string): IWorkLog[];
  getTotalMinutesForIssue(issueId: string): number;
  // actions
  fetchWorklogs(workspaceSlug: string, projectId: string, issueId: string): Promise<IWorkLog[]>;
  createWorklog(
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    data: IWorkLogCreate
  ): Promise<IWorkLog>;
  updateWorklog(
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    worklogId: string,
    data: IWorkLogUpdate
  ): Promise<IWorkLog>;
  deleteWorklog(
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    worklogId: string
  ): Promise<void>;
  fetchProjectSummary(
    workspaceSlug: string,
    projectId: string,
    params?: Record<string, string>
  ): Promise<IWorkLogSummary>;
}

export class WorklogStore implements IWorklogStore {
  worklogsByIssueId: Record<string, IWorkLog[]> = {};
  isLoading = false;

  private worklogService: WorklogService;

  constructor() {
    makeObservable(this, {
      worklogsByIssueId: observable,
      isLoading: observable,
      fetchWorklogs: action,
      createWorklog: action,
      updateWorklog: action,
      deleteWorklog: action,
    });
    this.worklogService = new WorklogService();
  }

  getWorklogsForIssue(issueId: string): IWorkLog[] {
    return this.worklogsByIssueId[issueId] ?? [];
  }

  getTotalMinutesForIssue(issueId: string): number {
    const worklogs = this.worklogsByIssueId[issueId];
    if (!worklogs) return 0;
    return worklogs.reduce((sum, w) => sum + w.duration_minutes, 0);
  }

  fetchWorklogs = async (
    workspaceSlug: string,
    projectId: string,
    issueId: string
  ): Promise<IWorkLog[]> => {
    this.isLoading = true;
    try {
      const worklogs = await this.worklogService.listWorklogs(workspaceSlug, projectId, issueId);
      runInAction(() => {
        this.worklogsByIssueId[issueId] = worklogs;
        this.isLoading = false;
      });
      return worklogs;
    } catch (error) {
      runInAction(() => {
        this.isLoading = false;
      });
      throw error;
    }
  };

  createWorklog = async (
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    data: IWorkLogCreate
  ): Promise<IWorkLog> => {
    const worklog = await this.worklogService.createWorklog(workspaceSlug, projectId, issueId, data);
    runInAction(() => {
      const existing = this.worklogsByIssueId[issueId] ?? [];
      this.worklogsByIssueId[issueId] = [worklog, ...existing];
    });
    return worklog;
  };

  updateWorklog = async (
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    worklogId: string,
    data: IWorkLogUpdate
  ): Promise<IWorkLog> => {
    const updated = await this.worklogService.updateWorklog(
      workspaceSlug,
      projectId,
      issueId,
      worklogId,
      data
    );
    runInAction(() => {
      const list = this.worklogsByIssueId[issueId] ?? [];
      const idx = list.findIndex((w) => w.id === worklogId);
      if (idx !== -1) list[idx] = updated;
      this.worklogsByIssueId[issueId] = [...list];
    });
    return updated;
  };

  deleteWorklog = async (
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    worklogId: string
  ): Promise<void> => {
    // Optimistic delete
    const prevList = this.worklogsByIssueId[issueId] ?? [];
    runInAction(() => {
      this.worklogsByIssueId[issueId] = prevList.filter((w) => w.id !== worklogId);
    });
    try {
      await this.worklogService.deleteWorklog(workspaceSlug, projectId, issueId, worklogId);
    } catch (error) {
      // Revert on failure
      runInAction(() => {
        this.worklogsByIssueId[issueId] = prevList;
      });
      throw error;
    }
  };

  fetchProjectSummary = async (
    workspaceSlug: string,
    projectId: string,
    params?: Record<string, string>
  ): Promise<IWorkLogSummary> => this.worklogService.getProjectSummary(workspaceSlug, projectId, params);
}
