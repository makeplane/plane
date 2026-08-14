/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { set } from "lodash-es";
import { action, makeObservable, observable, runInAction } from "mobx";
import type { TIssueServiceType, TIssueWorklog, TIssueWorklogIdMap, TIssueWorklogMap } from "@plane/types";
import { IssueService } from "@/services/issue";
import type { IIssueDetail } from "./root.store";

export interface IIssueWorklogStoreActions {
  fetchWorklogs: (workspaceSlug: string, projectId: string, issueId: string) => Promise<TIssueWorklog[]>;
  createWorklog: (
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    data: Partial<TIssueWorklog>
  ) => Promise<TIssueWorklog>;
  updateWorklog: (
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    worklogId: string,
    data: Partial<TIssueWorklog>
  ) => Promise<TIssueWorklog>;
  removeWorklog: (workspaceSlug: string, projectId: string, issueId: string, worklogId: string) => Promise<void>;
}

export interface IIssueWorklogStore extends IIssueWorklogStoreActions {
  worklogs: TIssueWorklogIdMap;
  worklogMap: TIssueWorklogMap;
  loader: Record<string, boolean>;
  error: Record<string, string | null>;
  getWorklogsByIssueId: (issueId: string) => TIssueWorklog[];
  getWorklogById: (worklogId: string) => TIssueWorklog | undefined;
}

export class IssueWorklogStore implements IIssueWorklogStore {
  worklogs: TIssueWorklogIdMap = {};
  worklogMap: TIssueWorklogMap = {};
  loader: Record<string, boolean> = {};
  error: Record<string, string | null> = {};
  rootIssueDetailStore: IIssueDetail;
  issueService;

  constructor(rootStore: IIssueDetail, serviceType: TIssueServiceType) {
    makeObservable(this, {
      worklogs: observable,
      worklogMap: observable,
      loader: observable,
      error: observable,
      fetchWorklogs: action,
      createWorklog: action,
      updateWorklog: action,
      removeWorklog: action,
    });
    this.rootIssueDetailStore = rootStore;
    this.issueService = new IssueService(serviceType);
  }

  getWorklogsByIssueId = (issueId: string) => {
    const ids = this.worklogs[issueId] ?? [];
    return ids.map((id) => this.worklogMap[id]).filter((worklog): worklog is TIssueWorklog => Boolean(worklog));
  };

  getWorklogById = (worklogId: string) => this.worklogMap[worklogId];

  private syncTotal = (issueId: string, total: number) => {
    this.rootIssueDetailStore.rootIssueStore.issues.updateIssue(issueId, {
      total_logged_time: total,
    });
  };

  fetchWorklogs = async (workspaceSlug: string, projectId: string, issueId: string) => {
    runInAction(() => {
      this.loader[issueId] = true;
      this.error[issueId] = null;
    });
    try {
      const response = await this.issueService.fetchIssueWorklogs(workspaceSlug, projectId, issueId);
      runInAction(() => {
        this.worklogs[issueId] = response.results.map((worklog) => worklog.id);
        response.results.forEach((worklog) => set(this.worklogMap, worklog.id, worklog));
        this.loader[issueId] = false;
      });
      this.syncTotal(issueId, response.extra_stats?.total_logged_time ?? 0);
      return response.results;
    } catch (error) {
      runInAction(() => {
        this.loader[issueId] = false;
        this.error[issueId] = "failed";
      });
      throw error;
    }
  };

  createWorklog = async (workspaceSlug: string, projectId: string, issueId: string, data: Partial<TIssueWorklog>) => {
    const response = await this.issueService.createIssueWorklog(workspaceSlug, projectId, issueId, data);
    const current = this.getWorklogsByIssueId(issueId);
    const previousTotal = this.rootIssueDetailStore.issue.getIssueById(issueId)?.total_logged_time ?? 0;
    runInAction(() => {
      this.worklogs[issueId] = [
        response.id,
        ...current.map((worklog) => worklog.id).filter((id) => id !== response.id),
      ];
      set(this.worklogMap, response.id, response);
    });
    this.syncTotal(issueId, previousTotal + (response.duration ?? 0));
    this.rootIssueDetailStore.activity.fetchActivities(workspaceSlug, projectId, issueId);
    return response;
  };

  updateWorklog = async (
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    worklogId: string,
    data: Partial<TIssueWorklog>
  ) => {
    const previous = this.worklogMap[worklogId];
    const response = await this.issueService.updateIssueWorklog(workspaceSlug, projectId, issueId, worklogId, data);
    const previousTotal = this.rootIssueDetailStore.issue.getIssueById(issueId)?.total_logged_time ?? 0;
    const delta = (response.duration ?? 0) - (previous?.duration ?? 0);
    runInAction(() => {
      set(this.worklogMap, worklogId, response);
    });
    this.syncTotal(issueId, Math.max(0, previousTotal + delta));
    this.rootIssueDetailStore.activity.fetchActivities(workspaceSlug, projectId, issueId);
    return response;
  };

  removeWorklog = async (workspaceSlug: string, projectId: string, issueId: string, worklogId: string) => {
    const previous = this.worklogMap[worklogId];
    await this.issueService.deleteIssueWorklog(workspaceSlug, projectId, issueId, worklogId);
    const previousTotal = this.rootIssueDetailStore.issue.getIssueById(issueId)?.total_logged_time ?? 0;
    runInAction(() => {
      this.worklogs[issueId] = (this.worklogs[issueId] ?? []).filter((id) => id !== worklogId);
      delete this.worklogMap[worklogId];
    });
    this.syncTotal(issueId, Math.max(0, previousTotal - (previous?.duration ?? 0)));
    this.rootIssueDetailStore.activity.fetchActivities(workspaceSlug, projectId, issueId);
  };
}
