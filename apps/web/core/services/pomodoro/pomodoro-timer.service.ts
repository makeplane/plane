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

/** Generates a per-mutation idempotency key so a retried/duplicate request
 * (e.g. two devices racing the same action) collapses to one state change
 * server-side — see PomodoroTimerViewSet._duplicate_mutation. */
const newMutationId = (): string =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

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
    return this.post("/api/users/me/pomodoro-timers/", { ...data, client_mutation_id: newMutationId() })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async pauseTimer(timerId: string): Promise<TPomodoroTimer> {
    return this.post(`/api/users/me/pomodoro-timers/${timerId}/pause/`, { client_mutation_id: newMutationId() })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async resumeTimer(timerId: string): Promise<TPomodoroTimer> {
    return this.post(`/api/users/me/pomodoro-timers/${timerId}/resume/`, { client_mutation_id: newMutationId() })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async completeTimer(timerId: string, createTimeLog: boolean = true): Promise<TCompletePomodoroResponse> {
    return this.post(`/api/users/me/pomodoro-timers/${timerId}/complete/`, {
      create_time_log: createTimeLog,
      client_mutation_id: newMutationId(),
    })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async discardTimer(timerId: string): Promise<TPomodoroTimer> {
    return this.post(`/api/users/me/pomodoro-timers/${timerId}/discard/`, { client_mutation_id: newMutationId() })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async skipTimer(timerId: string): Promise<TPomodoroTimer> {
    return this.post(`/api/users/me/pomodoro-timers/${timerId}/skip/`, { client_mutation_id: newMutationId() })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async notifyPhaseEnd(data: {
    phase: "focus" | "break";
    title: string;
    body: string;
    /** the timer this phase belongs to — lets the server fan the alert out to
     * this user's other devices via APNs (see PomodoroNotifyEndpoint) */
    timer_id?: string;
    /** optional override used by the settings test button */
    webhook_url?: string;
  }): Promise<void> {
    return this.post("/api/users/me/pomodoro-timers/notify/", data)
      .then(() => undefined)
      .catch((error) => {
        throw error?.response?.data ?? error;
      });
  }
}
