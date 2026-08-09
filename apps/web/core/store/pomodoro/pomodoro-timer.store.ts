/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { action, makeObservable, observable, runInAction } from "mobx";
// plane types
import type { TCompletePomodoroResponse, TPomodoroTimer, TStartPomodoroPayload } from "@plane/types";
// services
import { PomodoroTimerService } from "@/services/pomodoro/pomodoro-timer.service";
// types
import type { CoreRootStore } from "../root.store";

export type TPomodoroTimerLoader = "fetch" | "start" | "mutate" | undefined;

export interface IPomodoroTimerStore {
  // observables
  activeTimer: TPomodoroTimer | undefined;
  loader: TPomodoroTimerLoader;
  // helper methods
  getActiveTimer: () => TPomodoroTimer | undefined;
  // actions
  fetchTimers: () => Promise<TPomodoroTimer[]>;
  startTimer: (data: TStartPomodoroPayload) => Promise<TPomodoroTimer>;
  pauseTimer: () => Promise<void>;
  resumeTimer: () => Promise<void>;
  completeTimer: (createTimeLog?: boolean) => Promise<TCompletePomodoroResponse>;
  discardTimer: () => Promise<void>;
}

export class PomodoroTimerStore implements IPomodoroTimerStore {
  // observables
  loader: TPomodoroTimerLoader = undefined;
  activeTimer: TPomodoroTimer | undefined = undefined;
  // services
  pomodoroTimerService;
  // root store
  rootStore;

  constructor(rootStore: CoreRootStore) {
    makeObservable(this, {
      // observables
      loader: observable.ref,
      activeTimer: observable,
      // actions
      fetchTimers: action,
      startTimer: action,
      pauseTimer: action,
      resumeTimer: action,
      completeTimer: action,
      discardTimer: action,
    });
    this.rootStore = rootStore;
    this.pomodoroTimerService = new PomodoroTimerService();
  }

  // helper methods
  getActiveTimer = () => {
    if (!this.activeTimer) return undefined;
    if (this.activeTimer.status === "completed" || this.activeTimer.status === "discarded") return undefined;
    return this.activeTimer;
  };

  // actions
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
    });
  };
}
