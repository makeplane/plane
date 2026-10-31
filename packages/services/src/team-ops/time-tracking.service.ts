/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { API_BASE_URL } from "@plane/constants";
import type {
  TActiveTimer,
  TTimeEntry,
  TTimeEntryListParams,
  TTimeEntryListResponse,
  TTimeEntryPayload,
  TTimerStartPayload,
  TTimerStopResponse,
  TTimeSummary,
  TTimeSummaryParams,
} from "@plane/types";
// services
import { APIService } from "../api.service";

export class TimeTrackingService extends APIService {
  constructor(BASE_URL?: string) {
    super(BASE_URL || API_BASE_URL);
  }

  private base(workspaceSlug: string) {
    return `/api/workspaces/${workspaceSlug}/team-ops`;
  }

  /** Lists time entries. Members only ever get their own; admins can pass `user`. */
  async listEntries(workspaceSlug: string, params?: TTimeEntryListParams): Promise<TTimeEntryListResponse> {
    return this.get(`${this.base(workspaceSlug)}/time-entries/`, { params })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async createEntry(workspaceSlug: string, data: TTimeEntryPayload): Promise<TTimeEntry> {
    return this.post(`${this.base(workspaceSlug)}/time-entries/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async updateEntry(workspaceSlug: string, entryId: string, data: TTimeEntryPayload): Promise<TTimeEntry> {
    return this.patch(`${this.base(workspaceSlug)}/time-entries/${entryId}/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async deleteEntry(workspaceSlug: string, entryId: string): Promise<void> {
    return this.delete(`${this.base(workspaceSlug)}/time-entries/${entryId}/`)
      .then(() => undefined)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getSummary(workspaceSlug: string, params: TTimeSummaryParams): Promise<TTimeSummary> {
    return this.get(`${this.base(workspaceSlug)}/time-entries/summary/`, { params })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /** The caller's running timer, or `null`. */
  async getTimer(workspaceSlug: string): Promise<TActiveTimer | null> {
    return this.get(`${this.base(workspaceSlug)}/timer/`)
      .then((response) => response?.data?.timer ?? null)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async startTimer(workspaceSlug: string, data: TTimerStartPayload = {}): Promise<TActiveTimer> {
    return this.post(`${this.base(workspaceSlug)}/timer/`, data)
      .then((response) => response?.data?.timer)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /** Stops the running timer and logs it as a time entry. */
  async stopTimer(workspaceSlug: string): Promise<TTimerStopResponse> {
    return this.delete(`${this.base(workspaceSlug)}/timer/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}
