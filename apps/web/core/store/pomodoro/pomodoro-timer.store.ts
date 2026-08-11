/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { action, computed, makeObservable, observable, runInAction } from "mobx";
// plane types
import type { TCompletePomodoroResponse, TPomodoroSettings, TPomodoroTimer, TStartPomodoroPayload } from "@plane/types";
import { DEFAULT_POMODORO_SETTINGS } from "@plane/types";
// services
import { PomodoroTimerService } from "@/services/pomodoro/pomodoro-timer.service";
// types
import type { CoreRootStore } from "../root.store";

export type TPomodoroTimerLoader = "fetch" | "start" | "mutate" | undefined;
export type TPomodoroPhase = "focus" | "short-break" | "long-break";

export type TPomodoroCycleSnapshot = {
  phase: TPomodoroPhase;
  sessionCount: number;
  focusIssueId: string | null;
  focusIssueName: string | null;
  focusProjectId: string | null;
  breakRunning: boolean;
  /** absolute end time while break is running; null when paused/idle */
  breakEndsAt: number | null;
  /** remaining seconds while break is paused or not yet started */
  breakSecondsLeft: number | null;
  awaitingFocusStart: boolean;
  updatedAt: number;
};

const POMODORO_CYCLE_STORAGE_KEY = "plane-pomodoro-cycle";
const POMODORO_BROADCAST_CHANNEL = "plane-pomodoro";
const POMODORO_TRANSITION_CLAIM_KEY = "plane-pomodoro-transition-claim";

/** Returns true if this tab won a short-lived claim to run a one-shot transition. */
export const claimPomodoroTransition = (token: string, ttlMs = 5000): boolean => {
  if (typeof window === "undefined") return true;
  try {
    const raw = window.localStorage.getItem(POMODORO_TRANSITION_CLAIM_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as { token: string; at: number };
      if (Date.now() - parsed.at < ttlMs) return false;
    }
    window.localStorage.setItem(POMODORO_TRANSITION_CLAIM_KEY, JSON.stringify({ token, at: Date.now() }));
    return true;
  } catch {
    return true;
  }
};

export interface IPomodoroTimerStore {
  // observables
  activeTimer: TPomodoroTimer | undefined;
  loader: TPomodoroTimerLoader;
  phase: TPomodoroPhase;
  sessionCount: number;
  breakSecondsLeft: number | null;
  breakEndsAt: number | null;
  breakRunning: boolean;
  focusIssueId: string | null;
  focusIssueName: string | null;
  focusProjectId: string | null;
  awaitingFocusStart: boolean;
  // computed
  settings: TPomodoroSettings;
  isBreak: boolean;
  isBreakRunning: boolean;
  isNextSessionReady: boolean;
  hasActiveTimer: boolean;
  // helper methods
  getActiveTimer: () => TPomodoroTimer | undefined;
  getBreakRemainingSeconds: () => number | null;
  // actions
  fetchTimers: () => Promise<TPomodoroTimer[]>;
  startTimer: (data: TStartPomodoroPayload) => Promise<TPomodoroTimer>;
  pauseTimer: () => Promise<void>;
  resumeTimer: () => Promise<void>;
  completeTimer: (createTimeLog?: boolean) => Promise<TCompletePomodoroResponse>;
  discardTimer: () => Promise<void>;
  // phase actions
  transitionToBreak: () => void;
  startBreak: () => void;
  pauseBreak: () => void;
  skipBreak: () => void;
  markAwaitingFocusStart: () => void;
  clearBreakState: () => void;
  discardToBreak: () => Promise<void>;
  resetCycle: () => void;
  initCrossTabSync: () => () => void;
  hydrateFromStorage: () => void;
}

export class PomodoroTimerStore implements IPomodoroTimerStore {
  // observables
  loader: TPomodoroTimerLoader = undefined;
  activeTimer: TPomodoroTimer | undefined = undefined;
  phase: TPomodoroPhase = "focus";
  sessionCount: number = 0;
  breakSecondsLeft: number | null = null;
  breakEndsAt: number | null = null;
  breakRunning: boolean = false;
  focusIssueId: string | null = null;
  focusIssueName: string | null = null;
  focusProjectId: string | null = null;
  awaitingFocusStart: boolean = false;
  // services
  pomodoroTimerService;
  // root store
  rootStore;
  // sync
  private broadcastChannel: BroadcastChannel | null = null;
  private lastPublishedAt = 0;
  private isHydrating = false;
  private syncSubscriberCount = 0;
  private removeSyncListeners: (() => void) | null = null;

  constructor(rootStore: CoreRootStore) {
    makeObservable(this, {
      // observables
      loader: observable.ref,
      activeTimer: observable,
      phase: observable.ref,
      sessionCount: observable.ref,
      breakSecondsLeft: observable.ref,
      breakEndsAt: observable.ref,
      breakRunning: observable.ref,
      focusIssueId: observable.ref,
      focusIssueName: observable.ref,
      focusProjectId: observable.ref,
      awaitingFocusStart: observable.ref,
      // computed
      settings: computed,
      isBreak: computed,
      isBreakRunning: computed,
      isNextSessionReady: computed,
      hasActiveTimer: computed,
      // actions
      fetchTimers: action,
      startTimer: action,
      pauseTimer: action,
      resumeTimer: action,
      completeTimer: action,
      discardTimer: action,
      transitionToBreak: action,
      startBreak: action,
      pauseBreak: action,
      skipBreak: action,
      markAwaitingFocusStart: action,
      clearBreakState: action,
      discardToBreak: action,
      resetCycle: action,
      hydrateFromStorage: action,
    });
    this.rootStore = rootStore;
    this.pomodoroTimerService = new PomodoroTimerService();
  }

  // computed
  get settings(): TPomodoroSettings {
    return {
      ...DEFAULT_POMODORO_SETTINGS,
      ...this.rootStore.user.userProfile.data?.pomodoro_settings,
    };
  }

  get isBreak(): boolean {
    return this.phase !== "focus";
  }

  get isBreakRunning(): boolean {
    if (!this.isBreak || !this.breakRunning) return false;
    const remaining = this.getBreakRemainingSeconds();
    return remaining !== null && remaining > 0;
  }

  get isNextSessionReady(): boolean {
    if (this.awaitingFocusStart) return true;
    // break finished but auto-start focus is off — waiting for user to start next session
    return this.isBreak && this.getBreakRemainingSeconds() !== null && (this.getBreakRemainingSeconds() ?? 0) <= 0;
  }

  get hasActiveTimer(): boolean {
    return !!this.activeTimer && (this.activeTimer.status === "running" || this.activeTimer.status === "paused");
  }

  // helper methods
  getActiveTimer = () => {
    if (!this.activeTimer) return undefined;
    if (this.activeTimer.status === "completed" || this.activeTimer.status === "discarded") return undefined;
    return this.activeTimer;
  };

  getBreakRemainingSeconds = (): number | null => {
    if (!this.isBreak) return null;
    if (this.breakRunning && this.breakEndsAt !== null) {
      return Math.max(0, Math.floor((this.breakEndsAt - Date.now()) / 1000));
    }
    return this.breakSecondsLeft;
  };

  private buildSnapshot = (): TPomodoroCycleSnapshot => ({
    phase: this.phase,
    sessionCount: this.sessionCount,
    focusIssueId: this.focusIssueId,
    focusIssueName: this.focusIssueName,
    focusProjectId: this.focusProjectId,
    breakRunning: this.breakRunning,
    breakEndsAt: this.breakEndsAt,
    breakSecondsLeft: this.breakSecondsLeft,
    awaitingFocusStart: this.awaitingFocusStart,
    updatedAt: Date.now(),
  });

  private publishSnapshot = () => {
    if (this.isHydrating || typeof window === "undefined") return;
    const snapshot = this.buildSnapshot();
    this.lastPublishedAt = snapshot.updatedAt;
    try {
      window.localStorage.setItem(POMODORO_CYCLE_STORAGE_KEY, JSON.stringify(snapshot));
    } catch {
      // ignore quota / private mode errors
    }
    try {
      this.broadcastChannel?.postMessage(snapshot);
    } catch {
      // ignore BroadcastChannel errors
    }
  };

  private applySnapshot = (snapshot: TPomodoroCycleSnapshot) => {
    if (snapshot.updatedAt <= this.lastPublishedAt) return;
    this.isHydrating = true;
    try {
      this.phase = snapshot.phase;
      this.sessionCount = snapshot.sessionCount;
      this.focusIssueId = snapshot.focusIssueId;
      this.focusIssueName = snapshot.focusIssueName ?? null;
      this.focusProjectId = snapshot.focusProjectId ?? null;
      this.breakRunning = snapshot.breakRunning;
      this.breakEndsAt = snapshot.breakEndsAt;
      this.breakSecondsLeft = snapshot.breakSecondsLeft;
      this.awaitingFocusStart = snapshot.awaitingFocusStart;
      this.lastPublishedAt = snapshot.updatedAt;
    } finally {
      this.isHydrating = false;
    }
  };

  private readStoredSnapshot = (): TPomodoroCycleSnapshot | null => {
    if (typeof window === "undefined") return null;
    try {
      const raw = window.localStorage.getItem(POMODORO_CYCLE_STORAGE_KEY);
      if (!raw) return null;
      return JSON.parse(raw) as TPomodoroCycleSnapshot;
    } catch {
      return null;
    }
  };

  hydrateFromStorage = () => {
    const snapshot = this.readStoredSnapshot();
    if (!snapshot) return;
    this.applySnapshot(snapshot);
  };

  initCrossTabSync = (): (() => void) => {
    if (typeof window === "undefined") return () => undefined;

    this.syncSubscriberCount += 1;
    if (this.syncSubscriberCount > 1) {
      return () => {
        this.syncSubscriberCount = Math.max(0, this.syncSubscriberCount - 1);
      };
    }

    this.hydrateFromStorage();

    try {
      this.broadcastChannel = new BroadcastChannel(POMODORO_BROADCAST_CHANNEL);
      this.broadcastChannel.addEventListener("message", (event: MessageEvent<TPomodoroCycleSnapshot>) => {
        if (!event.data?.updatedAt) return;
        runInAction(() => {
          this.applySnapshot(event.data);
        });
        void this.fetchTimers();
      });
    } catch {
      this.broadcastChannel = null;
    }

    const onStorage = (event: StorageEvent) => {
      if (event.key !== POMODORO_CYCLE_STORAGE_KEY || !event.newValue) return;
      try {
        const snapshot = JSON.parse(event.newValue) as TPomodoroCycleSnapshot;
        runInAction(() => {
          this.applySnapshot(snapshot);
        });
        void this.fetchTimers();
      } catch {
        // ignore malformed payloads
      }
    };

    const onVisibility = () => {
      if (document.visibilityState !== "visible") return;
      this.hydrateFromStorage();
      void this.fetchTimers();
    };

    window.addEventListener("storage", onStorage);
    document.addEventListener("visibilitychange", onVisibility);

    this.removeSyncListeners = () => {
      window.removeEventListener("storage", onStorage);
      document.removeEventListener("visibilitychange", onVisibility);
      this.broadcastChannel?.close();
      this.broadcastChannel = null;
      this.removeSyncListeners = null;
    };

    return () => {
      this.syncSubscriberCount = Math.max(0, this.syncSubscriberCount - 1);
      if (this.syncSubscriberCount === 0) {
        this.removeSyncListeners?.();
      }
    };
  };

  // phase actions
  transitionToBreak = () => {
    const nextCount = this.sessionCount + 1;
    const isLongBreak =
      this.settings.sessions_before_long_break > 0 && nextCount % this.settings.sessions_before_long_break === 0;
    const breakMinutes = isLongBreak ? this.settings.long_break_minutes : this.settings.short_break_minutes;

    this.sessionCount = nextCount;
    this.phase = isLongBreak ? "long-break" : "short-break";
    this.breakSecondsLeft = breakMinutes * 60;
    this.breakEndsAt = null;
    this.breakRunning = false; // paused until user starts or auto-start kicks in
    this.awaitingFocusStart = false;
    this.publishSnapshot();
  };

  startBreak = () => {
    if (!this.isBreak) return;
    const remaining = this.breakSecondsLeft ?? this.getBreakRemainingSeconds() ?? 0;
    this.breakSecondsLeft = remaining;
    this.breakEndsAt = Date.now() + remaining * 1000;
    this.breakRunning = true;
    this.awaitingFocusStart = false;
    this.publishSnapshot();
  };

  pauseBreak = () => {
    if (!this.isBreak) return;
    const remaining = this.getBreakRemainingSeconds();
    this.breakSecondsLeft = remaining;
    this.breakEndsAt = null;
    this.breakRunning = false;
    this.publishSnapshot();
  };

  skipBreak = () => {
    if (!this.isBreak) return;
    this.phase = "focus";
    this.breakSecondsLeft = null;
    this.breakEndsAt = null;
    this.breakRunning = false;
    this.awaitingFocusStart = true;
    this.publishSnapshot();
  };

  markAwaitingFocusStart = () => {
    this.phase = "focus";
    this.breakSecondsLeft = null;
    this.breakEndsAt = null;
    this.breakRunning = false;
    this.awaitingFocusStart = true;
    this.publishSnapshot();
  };

  clearBreakState = () => {
    this.phase = "focus";
    this.breakSecondsLeft = null;
    this.breakEndsAt = null;
    this.breakRunning = false;
    this.awaitingFocusStart = false;
    this.focusIssueId = null;
    this.focusIssueName = null;
    this.focusProjectId = null;
    this.publishSnapshot();
  };

  discardToBreak = async () => {
    // discard the active focus timer but keep the break cycle going
    if (this.getActiveTimer()) {
      this.loader = "mutate";
      const timer = await this.pomodoroTimerService.discardTimer(this.activeTimer!.id);
      runInAction(() => {
        this.activeTimer = timer;
        this.loader = undefined;
      });
    }
    // transition to break
    runInAction(() => {
      this.transitionToBreak();
      if (this.settings.auto_start_break) {
        this.startBreak();
      } else {
        this.publishSnapshot();
      }
    });
  };

  resetCycle = () => {
    this.phase = "focus";
    this.sessionCount = 0;
    this.breakSecondsLeft = null;
    this.breakEndsAt = null;
    this.breakRunning = false;
    this.focusIssueId = null;
    this.focusIssueName = null;
    this.focusProjectId = null;
    this.awaitingFocusStart = false;
    this.publishSnapshot();
  };

  // server actions
  fetchTimers = async () => {
    this.loader = "fetch";
    const timers = await this.pomodoroTimerService.getTimers();

    runInAction(() => {
      const activeTimer = timers.find((timer) => timer.status === "running" || timer.status === "paused");
      this.activeTimer = activeTimer ?? undefined;
      if (activeTimer) {
        this.focusIssueId = activeTimer.issue;
        this.focusIssueName = activeTimer.issue_detail?.name ?? this.focusIssueName;
        this.focusProjectId = activeTimer.project;
      }
      this.loader = undefined;
    });

    return timers;
  };

  startTimer = async (data: TStartPomodoroPayload) => {
    this.loader = "start";
    const timer = await this.pomodoroTimerService.startTimer(data);

    runInAction(() => {
      this.activeTimer = timer;
      this.focusIssueId = data.issue_id;
      this.focusIssueName = timer.issue_detail?.name ?? null;
      this.focusProjectId = timer.project;
      this.phase = "focus";
      this.breakSecondsLeft = null;
      this.breakEndsAt = null;
      this.breakRunning = false;
      this.awaitingFocusStart = false;
      this.loader = undefined;
      this.publishSnapshot();
    });

    return timer;
  };

  pauseTimer = async () => {
    if (!this.getActiveTimer()) return;
    this.loader = "mutate";
    const timer = await this.pomodoroTimerService.pauseTimer(this.activeTimer!.id);

    runInAction(() => {
      this.activeTimer = timer;
      this.loader = undefined;
      this.publishSnapshot();
    });
  };

  resumeTimer = async () => {
    if (!this.getActiveTimer()) return;
    this.loader = "mutate";
    const timer = await this.pomodoroTimerService.resumeTimer(this.activeTimer!.id);

    runInAction(() => {
      this.activeTimer = timer;
      this.loader = undefined;
      this.publishSnapshot();
    });
  };

  completeTimer = async (createTimeLog: boolean = true) => {
    if (!this.getActiveTimer()) throw new Error("No active pomodoro timer");
    this.loader = "mutate";
    const response = await this.pomodoroTimerService.completeTimer(this.activeTimer!.id, createTimeLog);

    runInAction(() => {
      this.activeTimer = response.timer;
      this.focusIssueId = response.timer.issue;
      this.focusIssueName = response.timer.issue_detail?.name ?? this.focusIssueName;
      this.focusProjectId = response.timer.project;
      this.loader = undefined;
      this.publishSnapshot();
    });

    return response;
  };

  discardTimer = async () => {
    if (!this.getActiveTimer()) return;
    this.loader = "mutate";
    const timer = await this.pomodoroTimerService.discardTimer(this.activeTimer!.id);

    runInAction(() => {
      this.activeTimer = timer;
      this.loader = undefined;
      this.resetCycle();
    });
  };
}
