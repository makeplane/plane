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

export interface IPomodoroTimerStore {
  // observables
  activeTimer: TPomodoroTimer | undefined;
  loader: TPomodoroTimerLoader;
  phase: TPomodoroPhase;
  sessionCount: number;
  breakSecondsLeft: number | null;
  breakRunning: boolean;
  focusIssueId: string | null;
  // computed
  settings: TPomodoroSettings;
  isBreak: boolean;
  isBreakRunning: boolean;
  isNextSessionReady: boolean;
  hasActiveTimer: boolean;
  // helper methods
  getActiveTimer: () => TPomodoroTimer | undefined;
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
  tickBreak: () => void;
  discardToBreak: () => Promise<void>;
  resetCycle: () => void;
}

export class PomodoroTimerStore implements IPomodoroTimerStore {
  // observables
  loader: TPomodoroTimerLoader = undefined;
  activeTimer: TPomodoroTimer | undefined = undefined;
  phase: TPomodoroPhase = "focus";
  sessionCount: number = 0;
  breakSecondsLeft: number | null = null;
  breakRunning: boolean = false;
  focusIssueId: string | null = null;
  // services
  pomodoroTimerService;
  // root store
  rootStore;

  constructor(rootStore: CoreRootStore) {
    makeObservable(this, {
      // observables
      loader: observable.ref,
      activeTimer: observable,
      phase: observable.ref,
      sessionCount: observable.ref,
      breakSecondsLeft: observable.ref,
      breakRunning: observable.ref,
      focusIssueId: observable.ref,
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
      tickBreak: action,
      discardToBreak: action,
      resetCycle: action,
    });
    this.rootStore = rootStore;
    this.pomodoroTimerService = new PomodoroTimerService();
  }

  // computed
  get settings(): TPomodoroSettings {
    return this.rootStore.user.userProfile.data?.pomodoro_settings ?? DEFAULT_POMODORO_SETTINGS;
  }

  get isBreak(): boolean {
    return this.phase !== "focus";
  }

  get isBreakRunning(): boolean {
    return this.isBreak && this.breakRunning && this.breakSecondsLeft !== null && this.breakSecondsLeft > 0;
  }

  get isNextSessionReady(): boolean {
    // break finished but auto-start focus is off — waiting for user to pick next session
    return this.isBreak && this.breakSecondsLeft !== null && this.breakSecondsLeft <= 0;
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

  // phase actions
  transitionToBreak = () => {
    const nextCount = this.sessionCount + 1;
    const isLongBreak =
      this.settings.sessions_before_long_break > 0 && nextCount % this.settings.sessions_before_long_break === 0;
    const breakMinutes = isLongBreak ? this.settings.long_break_minutes : this.settings.short_break_minutes;

    this.sessionCount = nextCount;
    this.phase = isLongBreak ? "long-break" : "short-break";
    this.breakSecondsLeft = breakMinutes * 60;
    this.breakRunning = false; // paused until user starts or auto-start kicks in
  };

  startBreak = () => {
    if (!this.isBreak) return;
    this.breakRunning = true;
  };

  pauseBreak = () => {
    if (!this.isBreak) return;
    this.breakRunning = false;
  };

  skipBreak = () => {
    if (!this.isBreak) return;
    this.phase = "focus";
    this.breakSecondsLeft = null;
    this.breakRunning = false;
  };

  tickBreak = () => {
    if (!this.isBreak || this.breakSecondsLeft === null || !this.breakRunning) return;
    this.breakSecondsLeft = Math.max(0, this.breakSecondsLeft - 1);
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
        this.breakRunning = true;
      }
    });
  };

  resetCycle = () => {
    this.phase = "focus";
    this.sessionCount = 0;
    this.breakSecondsLeft = null;
    this.breakRunning = false;
    this.focusIssueId = null;
  };

  // server actions
  fetchTimers = async () => {
    this.loader = "fetch";
    const timers = await this.pomodoroTimerService.getTimers();

    runInAction(() => {
      const activeTimer = timers.find((timer) => timer.status === "running" || timer.status === "paused");
      this.activeTimer = activeTimer ?? this.activeTimer;
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
      this.phase = "focus";
      this.breakSecondsLeft = null;
      this.breakRunning = false;
      this.loader = undefined;
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
    });
  };

  resumeTimer = async () => {
    if (!this.getActiveTimer()) return;
    this.loader = "mutate";
    const timer = await this.pomodoroTimerService.resumeTimer(this.activeTimer!.id);

    runInAction(() => {
      this.activeTimer = timer;
      this.loader = undefined;
    });
  };

  completeTimer = async (createTimeLog: boolean = true) => {
    if (!this.getActiveTimer()) throw new Error("No active pomodoro timer");
    this.loader = "mutate";
    const response = await this.pomodoroTimerService.completeTimer(this.activeTimer!.id, createTimeLog);

    runInAction(() => {
      this.activeTimer = response.timer;
      this.loader = undefined;
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
