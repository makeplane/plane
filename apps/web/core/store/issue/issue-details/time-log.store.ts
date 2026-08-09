/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { pull, concat, update, uniq, set } from "lodash-es";
import { action, makeObservable, observable, runInAction } from "mobx";
// Plane Imports
import type { TTimeLog, TTimeLogIdMap, TTimeLogMap } from "@plane/types";
// services
import { IssueTimeLogService } from "@/services/issue/issue_time_log.service";
// types
import type { IIssueDetail } from "./root.store";

export type TTimeLogLoader = "fetch" | "create" | "update" | "delete" | "mutate" | undefined;

export interface IIssueTimeLogStoreActions {
  fetchTimeLogs: (workspaceSlug: string, projectId: string, issueId: string) => Promise<TTimeLog[]>;
  createTimeLog: (
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    data: Partial<TTimeLog>
  ) => Promise<TTimeLog>;
  updateTimeLog: (
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    timeLogId: string,
    data: Partial<TTimeLog>
  ) => Promise<TTimeLog>;
  removeTimeLog: (workspaceSlug: string, projectId: string, issueId: string, timeLogId: string) => Promise<void>;
}

export interface IIssueTimeLogStore extends IIssueTimeLogStoreActions {
  // observables
  loader: TTimeLogLoader;
  timeLogs: TTimeLogIdMap;
  timeLogMap: TTimeLogMap;
  // helper methods
  getTimeLogsByIssueId: (issueId: string) => string[] | undefined;
  getTimeLogById: (timeLogId: string) => TTimeLog | undefined;
  getTotalMinutesByIssueId: (issueId: string) => number;
}

export class IssueTimeLogStore implements IIssueTimeLogStore {
  // observables
  loader: TTimeLogLoader = "fetch";
  timeLogs: TTimeLogIdMap = {};
  timeLogMap: TTimeLogMap = {};
  // root store
  rootIssueDetail: IIssueDetail;
  // services
  issueTimeLogService;

  constructor(rootStore: IIssueDetail) {
    makeObservable(this, {
      // observables
      loader: observable.ref,
      timeLogs: observable,
      timeLogMap: observable,
      // actions
      fetchTimeLogs: action,
      createTimeLog: action,
      updateTimeLog: action,
      removeTimeLog: action,
    });
    this.rootIssueDetail = rootStore;
    this.issueTimeLogService = new IssueTimeLogService();
  }

  // helper methods
  getTimeLogsByIssueId = (issueId: string) => {
    if (!issueId) return undefined;
    return this.timeLogs[issueId] ?? undefined;
  };

  getTimeLogById = (timeLogId: string) => {
    if (!timeLogId) return undefined;
    return this.timeLogMap[timeLogId] ?? undefined;
  };

  /** Locally-derived total, so the sidebar updates instantly without refetching the issue. */
  getTotalMinutesByIssueId = (issueId: string) => {
    const ids = this.getTimeLogsByIssueId(issueId) ?? [];
    return ids.reduce((total, id) => total + (this.getTimeLogById(id)?.duration_minutes ?? 0), 0);
  };

  fetchTimeLogs = async (workspaceSlug: string, projectId: string, issueId: string) => {
    this.loader = "fetch";
    const timeLogs = await this.issueTimeLogService.getTimeLogs(workspaceSlug, projectId, issueId);

    runInAction(() => {
      set(
        this.timeLogs,
        issueId,
        timeLogs.map((timeLog) => timeLog.id)
      );
      timeLogs.forEach((timeLog) => set(this.timeLogMap, timeLog.id, timeLog));
      this.loader = undefined;
    });

    return timeLogs;
  };

  createTimeLog = async (workspaceSlug: string, projectId: string, issueId: string, data: Partial<TTimeLog>) => {
    const response = await this.issueTimeLogService.createTimeLog(workspaceSlug, projectId, issueId, data);

    runInAction(() => {
      update(this.timeLogs, issueId, (timeLogIds) => {
        if (!timeLogIds) return [response.id];
        return uniq(concat(timeLogIds, [response.id]));
      });
      set(this.timeLogMap, response.id, response);
    });

    return response;
  };

  updateTimeLog = async (
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    timeLogId: string,
    data: Partial<TTimeLog>
  ) => {
    const response = await this.issueTimeLogService.updateTimeLog(workspaceSlug, projectId, issueId, timeLogId, data);

    runInAction(() => {
      set(this.timeLogMap, timeLogId, response);
    });

    return response;
  };

  removeTimeLog = async (workspaceSlug: string, projectId: string, issueId: string, timeLogId: string) => {
    await this.issueTimeLogService.deleteTimeLog(workspaceSlug, projectId, issueId, timeLogId);

    runInAction(() => {
      if (this.timeLogs[issueId]) pull(this.timeLogs[issueId], timeLogId);
      delete this.timeLogMap[timeLogId];
    });
  };
}
