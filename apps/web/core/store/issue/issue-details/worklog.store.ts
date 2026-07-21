/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { pull, set, update } from "lodash-es";
import { action, makeObservable, observable, runInAction } from "mobx";
import type { TIssueWorkLog, TIssueWorkLogIdMap, TIssueWorkLogMap } from "@plane/types";
import { IssueWorkLogService } from "@/services/issue";

export type TWorkLogLoader = "fetch" | "mutate" | undefined;

export interface IIssueWorkLogStoreActions {
  fetchWorklogs: (workspaceSlug: string, projectId: string, issueId: string) => Promise<TIssueWorkLog[]>;
  createWorklog: (
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    data: Partial<TIssueWorkLog>
  ) => Promise<TIssueWorkLog>;
  updateWorklog: (
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    worklogId: string,
    data: Partial<TIssueWorkLog>
  ) => Promise<TIssueWorkLog>;
  deleteWorklog: (workspaceSlug: string, projectId: string, issueId: string, worklogId: string) => Promise<void>;
  startTimer: (workspaceSlug: string, projectId: string, issueId: string) => Promise<TIssueWorkLog>;
  stopTimer: (
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    data: { description?: string; worklog_id?: string }
  ) => Promise<TIssueWorkLog>;
  fetchActiveTimer: (workspaceSlug: string, projectId: string, issueId: string) => Promise<TIssueWorkLog | null>;
  fetchUserActiveTimer: (workspaceSlug: string, force?: boolean) => Promise<TIssueWorkLog | null>;
  fetchIssueActiveTimers: (workspaceSlug: string, projectId: string, issueId: string) => Promise<TIssueWorkLog[]>;
  adminStopTimer: (workspaceSlug: string, projectId: string, issueId: string, worklogId: string) => Promise<void>;
}

export interface IIssueWorkLogStore extends IIssueWorkLogStoreActions {
  loader: TWorkLogLoader;
  worklogs: TIssueWorkLogIdMap;
  worklogMap: TIssueWorkLogMap;
  // running timers are kept separate from the completed-worklog list so that re-fetching the
  // list (which only returns completed entries) never clobbers a known active timer.
  activeTimerMap: Record<string, TIssueWorkLog | null>;
  activeTimerIssueId: string | null;
  // the user's single running timer anywhere in the workspace (one active timer per user), used by list/board rows.
  userActiveTimer: TIssueWorkLog | null;
  // all running timers per issue (any user) — for the "who is working on this" banner and overview
  issueActiveTimers: Record<string, TIssueWorkLog[]>;

  getWorklogsByIssueId: (issueId: string) => string[] | undefined;
  getActiveTimersForIssue: (issueId: string) => TIssueWorkLog[];
  getWorklogById: (worklogId: string) => TIssueWorkLog | undefined;
  getTotalDurationByIssueId: (issueId: string) => number;
  getActiveTimerForIssue: (issueId: string) => TIssueWorkLog | null;
}

export class IssueWorkLogStore implements IIssueWorkLogStore {
  loader: TWorkLogLoader = "fetch";
  worklogs: TIssueWorkLogIdMap = {};
  worklogMap: TIssueWorkLogMap = {};
  activeTimerMap: Record<string, TIssueWorkLog | null> = {};
  activeTimerIssueId: string | null = null;
  userActiveTimer: TIssueWorkLog | null = null;
  issueActiveTimers: Record<string, TIssueWorkLog[]> = {};
  private userActiveTimerFetched = false;

  private issueWorkLogService: IssueWorkLogService;

  constructor() {
    makeObservable(this, {
      loader: observable.ref,
      worklogs: observable,
      worklogMap: observable,
      activeTimerMap: observable,
      activeTimerIssueId: observable.ref,
      userActiveTimer: observable,
      issueActiveTimers: observable,
      fetchWorklogs: action,
      createWorklog: action,
      updateWorklog: action,
      deleteWorklog: action,
      startTimer: action,
      stopTimer: action,
      fetchActiveTimer: action,
      fetchUserActiveTimer: action,
      fetchIssueActiveTimers: action,
      adminStopTimer: action,
    });
    this.issueWorkLogService = new IssueWorkLogService();
  }

  getActiveTimersForIssue = (issueId: string): TIssueWorkLog[] => {
    if (!issueId) return [];
    return this.issueActiveTimers[issueId] ?? [];
  };

  // helpers
  getWorklogsByIssueId = (issueId: string): string[] | undefined => {
    if (!issueId) return undefined;
    return this.worklogs[issueId] ?? undefined;
  };

  getWorklogById = (worklogId: string): TIssueWorkLog | undefined => {
    if (!worklogId) return undefined;
    return this.worklogMap[worklogId] ?? undefined;
  };

  getTotalDurationByIssueId = (issueId: string): number => {
    const ids = this.worklogs[issueId];
    if (!ids) return 0;
    return ids.reduce((sum, id) => {
      const wl = this.worklogMap[id];
      return sum + (wl?.duration ?? 0);
    }, 0);
  };

  getActiveTimerForIssue = (issueId: string): TIssueWorkLog | null => {
    if (!issueId) return null;
    if (this.activeTimerMap[issueId]) return this.activeTimerMap[issueId];
    // fall back to the workspace-level timer (lets list/board rows reflect a running timer without a per-issue fetch)
    if (this.userActiveTimer?.issue === issueId) return this.userActiveTimer;
    return null;
  };

  // actions
  fetchWorklogs = async (workspaceSlug: string, projectId: string, issueId: string): Promise<TIssueWorkLog[]> => {
    try {
      this.loader = "fetch";
      const worklogs = await this.issueWorkLogService.getWorklogs(workspaceSlug, projectId, issueId);
      const worklogIds = worklogs.map((wl) => wl.id);
      runInAction(() => {
        update(this.worklogs, issueId, () => worklogIds);
        worklogs.forEach((wl) => {
          set(this.worklogMap, wl.id, wl);
        });
        this.loader = undefined;
      });
      return worklogs;
    } catch (error) {
      runInAction(() => {
        this.loader = undefined;
      });
      throw error;
    }
  };

  createWorklog = async (
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    data: Partial<TIssueWorkLog>
  ): Promise<TIssueWorkLog> => {
    const response = await this.issueWorkLogService.createWorklog(workspaceSlug, projectId, issueId, data);
    runInAction(() => {
      update(this.worklogs, issueId, (ids: string[] | undefined) => {
        if (!ids) return [response.id];
        return [response.id, ...ids];
      });
      set(this.worklogMap, response.id, response);
    });
    return response;
  };

  updateWorklog = async (
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    worklogId: string,
    data: Partial<TIssueWorkLog>
  ): Promise<TIssueWorkLog> => {
    runInAction(() => {
      Object.keys(data).forEach((key) => {
        set(this.worklogMap, [worklogId, key], data[key as keyof TIssueWorkLog]);
      });
    });
    const response = await this.issueWorkLogService.updateWorklog(workspaceSlug, projectId, issueId, worklogId, data);
    runInAction(() => {
      set(this.worklogMap, worklogId, response);
    });
    return response;
  };

  deleteWorklog = async (
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    worklogId: string
  ): Promise<void> => {
    runInAction(() => {
      pull(this.worklogs[issueId], worklogId);
      delete this.worklogMap[worklogId];
    });
    await this.issueWorkLogService.deleteWorklog(workspaceSlug, projectId, issueId, worklogId);
  };

  startTimer = async (workspaceSlug: string, projectId: string, issueId: string): Promise<TIssueWorkLog> => {
    // The backend auto-stops any other running timer for this user; mirror that locally so a
    // previously active issue no longer shows a running timer.
    if (this.activeTimerIssueId && this.activeTimerIssueId !== issueId) {
      runInAction(() => {
        set(this.activeTimerMap, this.activeTimerIssueId!, null);
      });
    }

    const response = await this.issueWorkLogService.startTimer(workspaceSlug, projectId, issueId);
    runInAction(() => {
      set(this.activeTimerMap, issueId, response);
      this.activeTimerIssueId = issueId;
      this.userActiveTimer = response;
      // Keep the per-issue running-timer list (the overview's live rows and admin stop button)
      // in sync straight away, so it doesn't stay stale until the next mount.
      this.upsertIssueActiveTimer(issueId, response);
    });
    return response;
  };

  stopTimer = async (
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    data: { description?: string } = {}
  ): Promise<TIssueWorkLog> => {
    const response = await this.issueWorkLogService.stopTimer(workspaceSlug, projectId, issueId, data);
    runInAction(() => {
      // the stopped timer becomes a completed worklog: clear the active slot and add it to the list
      set(this.activeTimerMap, issueId, null);
      if (this.activeTimerIssueId === issueId) this.activeTimerIssueId = null;
      if (this.userActiveTimer?.issue === issueId) this.userActiveTimer = null;
      set(this.worklogMap, response.id, response);
      update(this.worklogs, issueId, (ids: string[] | undefined) => {
        if (!ids) return [response.id];
        return ids.includes(response.id) ? ids : [response.id, ...ids];
      });
      // Drop it from the per-issue running-timer list too, so the overview's stop button
      // disappears immediately instead of on the next mount.
      this.removeIssueActiveTimer(issueId, response.id);
    });
    return response;
  };

  // The worklog list endpoint only returns completed entries (duration !== null), so the
  // running timer must be loaded separately into its own map for getActiveTimerForIssue to find it.
  fetchActiveTimer = async (
    workspaceSlug: string,
    projectId: string,
    issueId: string
  ): Promise<TIssueWorkLog | null> => {
    const timer = await this.issueWorkLogService.getActiveTimer(workspaceSlug, projectId, issueId);
    runInAction(() => {
      set(this.activeTimerMap, issueId, timer ?? null);
      if (timer?.id) {
        this.activeTimerIssueId = issueId;
        this.userActiveTimer = timer;
      } else {
        if (this.activeTimerIssueId === issueId) this.activeTimerIssueId = null;
        if (this.userActiveTimer?.issue === issueId) this.userActiveTimer = null;
      }
    });
    return timer;
  };

  // Loads the user's single running timer for the whole workspace; deduped so list/board rows can
  // each call it without firing N requests. Pass force to bypass the cache (e.g. after a mutation).
  fetchUserActiveTimer = async (workspaceSlug: string, force = false): Promise<TIssueWorkLog | null> => {
    if (this.userActiveTimerFetched && !force) return this.userActiveTimer;
    this.userActiveTimerFetched = true;
    const timer = await this.issueWorkLogService.getUserActiveTimer(workspaceSlug);
    runInAction(() => {
      this.userActiveTimer = timer ?? null;
      if (timer?.id && timer.issue) {
        set(this.activeTimerMap, timer.issue, timer);
        this.activeTimerIssueId = timer.issue;
      }
    });
    return timer;
  };

  // Add/replace one running timer in the per-issue list. Must be called inside runInAction.
  private upsertIssueActiveTimer = (issueId: string, timer: TIssueWorkLog) => {
    const current = this.issueActiveTimers[issueId];
    // Not loaded yet: leave it alone so the next fetch is still treated as the first load.
    if (!current) return;
    const next = current.filter((t) => t.id !== timer.id && t.logged_by !== timer.logged_by);
    set(this.issueActiveTimers, issueId, [...next, timer]);
  };

  // Remove one running timer from the per-issue list. Must be called inside runInAction.
  private removeIssueActiveTimer = (issueId: string, timerId: string) => {
    const current = this.issueActiveTimers[issueId];
    if (!current) return;
    set(
      this.issueActiveTimers,
      issueId,
      current.filter((t) => t.id !== timerId)
    );
  };

  // all running timers for an issue (any user) — powers the alert banner and the overview admin controls
  fetchIssueActiveTimers = async (
    workspaceSlug: string,
    projectId: string,
    issueId: string
  ): Promise<TIssueWorkLog[]> => {
    const timers = await this.issueWorkLogService.getIssueActiveTimers(workspaceSlug, projectId, issueId);
    runInAction(() => {
      set(this.issueActiveTimers, issueId, timers);
    });
    return timers;
  };

  // admin-only: stop another user's running timer, then refresh the affected views
  adminStopTimer = async (
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    worklogId: string
  ): Promise<void> => {
    await this.issueWorkLogService.stopTimer(workspaceSlug, projectId, issueId, { worklog_id: worklogId });
    await Promise.all([
      this.fetchWorklogs(workspaceSlug, projectId, issueId),
      this.fetchIssueActiveTimers(workspaceSlug, projectId, issueId),
    ]);
    runInAction(() => {
      // if the stopped timer was the current user's tracked one, clear it
      if (this.userActiveTimer?.id === worklogId) this.userActiveTimer = null;
      if (this.activeTimerMap[issueId]?.id === worklogId) set(this.activeTimerMap, issueId, null);
    });
  };
}
