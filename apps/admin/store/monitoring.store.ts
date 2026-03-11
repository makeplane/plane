/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { action, makeObservable, observable, runInAction } from "mobx";
import { MonitoringService } from "@plane/services";
// types
import type {
  TEmailLog,
  TEmailLogFilters,
  TPaginationInfo,
  TScheduledJob,
  TWorkerHealthResponse,
} from "./monitoring.types";
// root store
import type { RootStore } from "@/store/root.store";

export interface IMonitoringStore {
  // observables
  emailLogs: TEmailLog[];
  emailLogsPagination: TPaginationInfo | null;
  emailLogsFilters: TEmailLogFilters;
  scheduledJobs: TScheduledJob[];
  workerHealth: TWorkerHealthResponse | null;
  isLoading: Record<string, boolean>;
  error: Record<string, string | null>;
  // actions
  fetchEmailLogs: (cursor?: string) => Promise<void>;
  fetchScheduledJobs: () => Promise<void>;
  fetchWorkerHealth: () => Promise<void>;
  setEmailLogsFilters: (filters: TEmailLogFilters) => void;
}

interface IEmailLogsResponse {
  results?: TEmailLog[];
  next_cursor?: string;
  prev_cursor?: string;
  next_page_results?: boolean;
  prev_page_results?: boolean;
  total_results?: number;
  total_pages?: number;
}

interface IScheduledJobsResponse {
  results?: TScheduledJob[];
}

export class MonitoringStore implements IMonitoringStore {
  emailLogs: TEmailLog[] = [];
  emailLogsPagination: TPaginationInfo | null = null;
  emailLogsFilters: TEmailLogFilters = {};
  scheduledJobs: TScheduledJob[] = [];
  workerHealth: TWorkerHealthResponse | null = null;
  isLoading: Record<string, boolean> = {};
  error: Record<string, string | null> = {};
  // service
  monitoringService;

  constructor(_store: RootStore) {
    makeObservable(this, {
      emailLogs: observable,
      emailLogsPagination: observable,
      emailLogsFilters: observable,
      scheduledJobs: observable,
      workerHealth: observable,
      isLoading: observable.ref,
      error: observable.ref,
      fetchEmailLogs: action,
      fetchScheduledJobs: action,
      fetchWorkerHealth: action,
      setEmailLogsFilters: action,
    });

    this.monitoringService = new MonitoringService();
  }

  fetchEmailLogs = async (cursor?: string) => {
    try {
      this.isLoading = { ...this.isLoading, emailLogs: true };
      this.error = { ...this.error, emailLogs: null };

      const params: Record<string, string> = {};
      if (cursor) params.cursor = cursor;
      if (this.emailLogsFilters.date_from) params.date_from = this.emailLogsFilters.date_from;
      if (this.emailLogsFilters.date_to) params.date_to = this.emailLogsFilters.date_to;
      if (this.emailLogsFilters.entity_name) params.entity_name = this.emailLogsFilters.entity_name;

      const response = (await this.monitoringService.fetchEmailLogs(params)) as IEmailLogsResponse;
      runInAction(() => {
        this.emailLogs = response.results ?? [];
        this.emailLogsPagination = {
          next_cursor: response.next_cursor ?? "",
          prev_cursor: response.prev_cursor ?? "",
          next_page_results: response.next_page_results ?? false,
          prev_page_results: response.prev_page_results ?? false,
          total_results: response.total_results ?? 0,
          total_pages: response.total_pages ?? 0,
        };
        this.isLoading = { ...this.isLoading, emailLogs: false };
      });
    } catch (_error) {
      runInAction(() => {
        this.isLoading = { ...this.isLoading, emailLogs: false };
        this.error = { ...this.error, emailLogs: "Failed to fetch email logs" };
      });
    }
  };

  fetchScheduledJobs = async () => {
    try {
      this.isLoading = { ...this.isLoading, scheduledJobs: true };
      this.error = { ...this.error, scheduledJobs: null };

      const response = (await this.monitoringService.fetchScheduledJobs()) as IScheduledJobsResponse;
      runInAction(() => {
        this.scheduledJobs = response.results ?? [];
        this.isLoading = { ...this.isLoading, scheduledJobs: false };
      });
    } catch (_error) {
      runInAction(() => {
        this.isLoading = { ...this.isLoading, scheduledJobs: false };
        this.error = { ...this.error, scheduledJobs: "Failed to fetch scheduled jobs" };
      });
    }
  };

  fetchWorkerHealth = async () => {
    try {
      this.isLoading = { ...this.isLoading, workerHealth: true };
      this.error = { ...this.error, workerHealth: null };

      const response = (await this.monitoringService.fetchWorkerHealth()) as TWorkerHealthResponse;
      runInAction(() => {
        this.workerHealth = response;
        this.isLoading = { ...this.isLoading, workerHealth: false };
      });
    } catch (_error) {
      runInAction(() => {
        this.isLoading = { ...this.isLoading, workerHealth: false };
        this.error = { ...this.error, workerHealth: "Failed to fetch worker health" };
      });
    }
  };

  setEmailLogsFilters = (filters: TEmailLogFilters) => {
    this.emailLogsFilters = filters;
  };
}
