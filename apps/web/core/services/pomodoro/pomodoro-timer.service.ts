/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// plane types
import { API_BASE_URL } from "@plane/constants";
import type { TCompletePomodoroResponse, TPomodoroTimer, TStartPomodoroPayload } from "@plane/types";
// services
import { APIService } from "@/services/api.service";

export class PomodoroTimerService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async getTimers(): Promise<TPomodoroTimer[]> {
    return this.get("/api/users/me/pomodoro-timers/")
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async startTimer(data: TStartPomodoroPayload): Promise<TPomodoroTimer> {
    return this.post("/api/users/me/pomodoro-timers/", data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async pauseTimer(timerId: string): Promise<TPomodoroTimer> {
    return this.post(`/api/users/me/pomodoro-timers/${timerId}/pause/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async resumeTimer(timerId: string): Promise<TPomodoroTimer> {
    return this.post(`/api/users/me/pomodoro-timers/${timerId}/resume/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async completeTimer(timerId: string, createTimeLog: boolean = true): Promise<TCompletePomodoroResponse> {
    return this.post(`/api/users/me/pomodoro-timers/${timerId}/complete/`, { create_time_log: createTimeLog })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async discardTimer(timerId: string): Promise<TPomodoroTimer> {
    return this.post(`/api/users/me/pomodoro-timers/${timerId}/discard/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}
