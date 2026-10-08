/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { action, makeObservable, observable, runInAction } from "mobx";
import { computedFn } from "mobx-utils";
// plane imports
import type {
  TStartTimerPayload,
  TStartTimerResponse,
  TStopTimerResponse,
  TTimeEntry,
  TTimeTrackingError,
  TUpdateTimerPayload,
} from "@plane/types";
// components
import type { TWorkItemSelectOption } from "@/components/time-tracking/inputs/work-item-select";
// hooks
import { revalidateTimeTracking } from "@/hooks/time-tracking/keys";
// services
import { timeTrackingService } from "@/services/time-tracking.service";

/** errors that mean another tab or device changed the timer: refetch, then let the caller explain */
const STALE_TIMER_CODES = new Set(["TIMER_NOT_RUNNING", "TIMER_CONFLICT"]);

export const isStaleTimerError = (error: unknown) =>
  STALE_TIMER_CODES.has((error as TTimeTrackingError | undefined)?.code ?? "");

/** what the Log time modal opens with: an entry to edit, or defaults for a new one */
export type TLogTimeModalState = {
  entry?: TTimeEntry;
  defaults?: {
    projectId?: string | null;
    issueId?: string | null;
    issueOption?: TWorkItemSelectOption | null;
    userId?: string;
    /** YYYY-MM-DD */
    date?: string;
  };
};

export interface ITimerStore {
  // observables
  runningTimer: TTimeEntry | null;
  /** server_now - Date.now() at fetch time; add to Date.now() for the server's clock */
  clockOffsetMs: number;
  needsReviewCount: number;
  isFetching: boolean;
  /** the workspace the timer was fetched for */
  workspaceSlug: string | null;
  /** the app-wide Log time modal (null when closed) */
  logTimeModal: TLogTimeModalState | null;
  /** the top-bar "Start timer" popover (opened from Power K too) */
  isStartPopoverOpen: boolean;
  // computed
  isRunningOnIssue: (issueId: string) => boolean;
  // actions
  fetchTimer: (workspaceSlug: string) => Promise<void>;
  startTimer: (workspaceSlug: string, payload: TStartTimerPayload) => Promise<TStartTimerResponse>;
  stopTimer: (workspaceSlug: string, description?: string) => Promise<TStopTimerResponse>;
  updateTimer: (workspaceSlug: string, payload: TUpdateTimerPayload) => Promise<void>;
  discardTimer: (workspaceSlug: string) => Promise<void>;
  /** keep the timer in sync with other tabs and devices while a workspace is open */
  startSync: (workspaceSlug: string) => () => void;
  openLogTimeModal: (state?: TLogTimeModalState) => void;
  closeLogTimeModal: () => void;
  setStartPopoverOpen: (isOpen: boolean) => void;
}

export class TimerStore implements ITimerStore {
  runningTimer: TTimeEntry | null = null;
  clockOffsetMs = 0;
  needsReviewCount = 0;
  isFetching = false;
  workspaceSlug: string | null = null;
  logTimeModal: TLogTimeModalState | null = null;
  isStartPopoverOpen = false;

  constructor() {
    makeObservable(this, {
      runningTimer: observable.ref,
      clockOffsetMs: observable,
      needsReviewCount: observable,
      isFetching: observable,
      workspaceSlug: observable,
      logTimeModal: observable.ref,
      isStartPopoverOpen: observable,
      fetchTimer: action,
      startTimer: action,
      stopTimer: action,
      updateTimer: action,
      discardTimer: action,
      openLogTimeModal: action,
      closeLogTimeModal: action,
      setStartPopoverOpen: action,
    });
  }

  isRunningOnIssue = computedFn((issueId: string) => this.runningTimer?.issue_id === issueId);

  private setClock(serverNow: string) {
    this.clockOffsetMs = Date.parse(serverNow) - Date.now();
  }

  /** run a timer write; on a stale-timer error, refetch so the UI shows the real state, then rethrow */
  private async write<T>(workspaceSlug: string, request: () => Promise<T>): Promise<T> {
    try {
      return await request();
    } catch (error) {
      if (isStaleTimerError(error)) await this.fetchTimer(workspaceSlug);
      throw error;
    } finally {
      void revalidateTimeTracking(workspaceSlug);
    }
  }

  fetchTimer = async (workspaceSlug: string) => {
    this.isFetching = true;
    try {
      const response = await timeTrackingService.getTimer(workspaceSlug);
      runInAction(() => {
        this.workspaceSlug = workspaceSlug;
        this.runningTimer = response.timer;
        this.needsReviewCount = response.needs_review_count;
        this.setClock(response.server_now);
      });
    } finally {
      runInAction(() => {
        this.isFetching = false;
      });
    }
  };

  startTimer = async (workspaceSlug: string, payload: TStartTimerPayload) =>
    this.write(workspaceSlug, async () => {
      const response = await timeTrackingService.startTimer(workspaceSlug, payload);
      runInAction(() => {
        this.workspaceSlug = workspaceSlug;
        this.runningTimer = response.timer;
        this.setClock(response.server_now);
      });
      return response;
    });

  stopTimer = async (workspaceSlug: string, description?: string) =>
    this.write(workspaceSlug, async () => {
      const response = await timeTrackingService.stopTimer(workspaceSlug, description);
      runInAction(() => {
        this.runningTimer = null;
        this.setClock(response.server_now);
      });
      return response;
    });

  updateTimer = async (workspaceSlug: string, payload: TUpdateTimerPayload) =>
    this.write(workspaceSlug, async () => {
      const response = await timeTrackingService.updateTimer(workspaceSlug, payload);
      runInAction(() => {
        this.runningTimer = response.timer;
      });
    });

  discardTimer = async (workspaceSlug: string) =>
    this.write(workspaceSlug, async () => {
      await timeTrackingService.discardTimer(workspaceSlug);
      runInAction(() => {
        this.runningTimer = null;
      });
    });

  openLogTimeModal = (state: TLogTimeModalState = {}) => {
    this.logTimeModal = state;
  };

  closeLogTimeModal = () => {
    this.logTimeModal = null;
  };

  setStartPopoverOpen = (isOpen: boolean) => {
    this.isStartPopoverOpen = isOpen;
  };

  startSync = (workspaceSlug: string) => {
    const refetch = () => {
      if (document.visibilityState === "visible") void this.fetchTimer(workspaceSlug).catch(() => undefined);
    };
    refetch();
    window.addEventListener("focus", refetch);
    document.addEventListener("visibilitychange", refetch);
    return () => {
      window.removeEventListener("focus", refetch);
      document.removeEventListener("visibilitychange", refetch);
    };
  };
}
