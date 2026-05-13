/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 *
 * CE extension of WorklogStore — adds analytics, cross-workspace, capacity categories actions,
 * and capacity detailed export job operations.
 */

import { action, makeObservable, observable, runInAction } from "mobx";
import { set } from "lodash-es";
import type {
  IAnalyticsTimesheetResponse,
  ICapacityCategoriesResponse,
  ICapacityDayDetailsResponse,
  ICapacityExportInitiateResponse,
  ICapacityExportJob,
  ICapacityExportPayload,
} from "@plane/types";
import { CECapacityExportService } from "@/plane-web/services/capacity-export.service";
import { WorklogService } from "@/services/worklog.service";
import type { IWorklogStore } from "@/store/worklog.store";
import { WorklogStore } from "@/store/worklog.store";

export interface ICEWorklogStore extends IWorklogStore {
  // Capacity detailed export
  exportJobs: Record<string, ICapacityExportJob>;
  isExportJobsLoading: boolean;
  lastExportRequestAt: number | null;
  initiateDetailedExport(slug: string, payload: ICapacityExportPayload): Promise<ICapacityExportInitiateResponse>;
  fetchExportHistory(slug: string): Promise<ICapacityExportJob[]>;
  // Analytics timesheet
  analyticsTimesheetData: IAnalyticsTimesheetResponse | null;
  isAnalyticsTimesheetLoading: boolean;
  // Workspace analytics timesheet
  workspaceAnalyticsTimesheetData: IAnalyticsTimesheetResponse | null;
  isWorkspaceAnalyticsTimesheetLoading: boolean;
  workspaceAnalyticsTimesheetError: string | null;
  // Capacity categories
  categoriesData: ICapacityCategoriesResponse | null;
  // Actions
  fetchAnalyticsTimesheet(workspaceSlug: string, projectId: string, weekStart?: string): Promise<void>;
  fetchCapacityCategories(workspaceSlug: string, projectId: string, params?: Record<string, string>): Promise<void>;
  fetchCapacityDayDetails(
    workspaceSlug: string,
    projectId: string,
    memberId: string,
    date: string
  ): Promise<ICapacityDayDetailsResponse>;
  fetchCrossWorkspaceTimesheet(workspaceSlug: string, weekStart?: string, workspaceOnly?: boolean): Promise<void>;
  fetchCrossWorkspaceCapacity(workspaceSlug: string, params?: Record<string, string>): Promise<void>;
  fetchWorkspaceAnalyticsCapacity(workspaceSlug: string, params?: Record<string, string>): Promise<void>;
  fetchWorkspaceCapacityDayDetails(
    workspaceSlug: string,
    memberId: string,
    date: string,
    crossWorkspace?: boolean
  ): Promise<ICapacityDayDetailsResponse>;
  fetchCrossWorkspaceCapacityDayDetails(
    workspaceSlug: string,
    memberId: string,
    date: string
  ): Promise<ICapacityDayDetailsResponse>;
  fetchWorkspaceAnalyticsTimesheet(workspaceSlug: string, weekStart?: string): Promise<void>;
}

export class CEWorklogStore extends WorklogStore implements ICEWorklogStore {
  // --- Capacity detailed export state ---
  exportJobs: Record<string, ICapacityExportJob> = {};
  isExportJobsLoading = false;
  lastExportRequestAt: number | null = null;

  analyticsTimesheetData: IAnalyticsTimesheetResponse | null = null;
  isAnalyticsTimesheetLoading = false;
  workspaceAnalyticsTimesheetData: IAnalyticsTimesheetResponse | null = null;
  isWorkspaceAnalyticsTimesheetLoading = false;
  workspaceAnalyticsTimesheetError: string | null = null;
  categoriesData: ICapacityCategoriesResponse | null = null;

  // Separate service instance — base class service is private, so CE uses its own
  private ceService: WorklogService;
  private capacityExportService: CECapacityExportService;

  constructor() {
    super();
    this.ceService = new WorklogService();
    this.capacityExportService = new CECapacityExportService();
    makeObservable(this, {
      analyticsTimesheetData: observable,
      isAnalyticsTimesheetLoading: observable,
      workspaceAnalyticsTimesheetData: observable,
      isWorkspaceAnalyticsTimesheetLoading: observable,
      workspaceAnalyticsTimesheetError: observable,
      categoriesData: observable,
      exportJobs: observable,
      isExportJobsLoading: observable,
      lastExportRequestAt: observable,
      fetchAnalyticsTimesheet: action,
      fetchCapacityCategories: action,
      fetchCapacityDayDetails: action,
      fetchCrossWorkspaceTimesheet: action,
      fetchCrossWorkspaceCapacity: action,
      fetchCrossWorkspaceCapacityDayDetails: action,
      fetchWorkspaceAnalyticsTimesheet: action,
      fetchWorkspaceAnalyticsCapacity: action,
      fetchWorkspaceCapacityDayDetails: action,
      initiateDetailedExport: action,
      fetchExportHistory: action,
    });
  }

  // --- Capacity detailed export actions ---

  initiateDetailedExport = async (
    slug: string,
    payload: ICapacityExportPayload
  ): Promise<ICapacityExportInitiateResponse> => {
    const res = await this.capacityExportService.initiateDetailedExport(slug, payload);
    runInAction(() => {
      this.lastExportRequestAt = Date.now();
    });
    return res;
  };

  fetchExportHistory = async (slug: string): Promise<ICapacityExportJob[]> => {
    runInAction(() => {
      this.isExportJobsLoading = true;
    });
    try {
      const jobs = await this.capacityExportService.fetchExportHistory(slug);
      runInAction(() => {
        const map: Record<string, ICapacityExportJob> = {};
        for (const j of jobs) set(map, j.id, j);
        this.exportJobs = map;
        this.isExportJobsLoading = false;
      });
      return jobs;
    } catch (e) {
      runInAction(() => {
        this.isExportJobsLoading = false;
      });
      throw e;
    }
  };

  fetchAnalyticsTimesheet = async (workspaceSlug: string, projectId: string, weekStart?: string): Promise<void> => {
    runInAction(() => {
      this.isAnalyticsTimesheetLoading = true;
    });
    try {
      const params: Record<string, string> = {};
      if (weekStart) params["week_start"] = weekStart;
      const data = await this.ceService.getAnalyticsTimesheet(workspaceSlug, projectId, params);
      runInAction(() => {
        this.analyticsTimesheetData = data;
      });
    } finally {
      runInAction(() => {
        this.isAnalyticsTimesheetLoading = false;
      });
    }
  };

  fetchCapacityCategories = async (
    workspaceSlug: string,
    projectId: string,
    params?: Record<string, string>
  ): Promise<void> => {
    const data = await this.ceService.getCapacityCategories(workspaceSlug, projectId, params);
    runInAction(() => {
      this.categoriesData = data;
    });
  };

  fetchCapacityDayDetails = async (
    workspaceSlug: string,
    projectId: string,
    memberId: string,
    date: string
  ): Promise<ICapacityDayDetailsResponse> => {
    return this.ceService.getCapacityDayDetails(workspaceSlug, projectId, memberId, date);
  };

  fetchCrossWorkspaceTimesheet = async (
    workspaceSlug: string,
    weekStart?: string,
    workspaceOnly?: boolean
  ): Promise<void> => {
    runInAction(() => {
      this.isTimesheetLoading = true;
    });
    try {
      const params: Record<string, string> = {};
      if (weekStart) params["week_start"] = weekStart;
      if (workspaceOnly) params["workspace_only"] = "true";
      const data = await this.ceService.getCrossWorkspaceTimesheet(workspaceSlug, params);
      runInAction(() => {
        this.timesheetData = data;
      });
    } finally {
      runInAction(() => {
        this.isTimesheetLoading = false;
      });
    }
  };

  fetchCrossWorkspaceCapacity = async (workspaceSlug: string, params?: Record<string, string>): Promise<void> => {
    runInAction(() => {
      this.isCapacityLoading = true;
    });
    try {
      const data = await this.ceService.getCrossWorkspaceCapacity(workspaceSlug, params);
      runInAction(() => {
        this.capacityData = data;
      });
    } finally {
      runInAction(() => {
        this.isCapacityLoading = false;
      });
    }
  };

  fetchCrossWorkspaceCapacityDayDetails = async (
    workspaceSlug: string,
    memberId: string,
    date: string
  ): Promise<ICapacityDayDetailsResponse> => {
    return this.ceService.getCrossWorkspaceCapacityDayDetails(workspaceSlug, memberId, date);
  };

  fetchWorkspaceCapacityDayDetails = async (
    workspaceSlug: string,
    memberId: string,
    date: string,
    crossWorkspace?: boolean
  ): Promise<ICapacityDayDetailsResponse> => {
    return this.ceService.getWorkspaceAnalyticsCapacityDayDetails(workspaceSlug, memberId, date, crossWorkspace);
  };

  fetchWorkspaceAnalyticsCapacity = async (workspaceSlug: string, params?: Record<string, string>): Promise<void> => {
    runInAction(() => {
      this.isCapacityLoading = true;
    });
    try {
      const data = await this.ceService.getWorkspaceAnalyticsCapacity(workspaceSlug, params);
      runInAction(() => {
        this.capacityData = data;
      });
    } finally {
      runInAction(() => {
        this.isCapacityLoading = false;
      });
    }
  };

  fetchWorkspaceAnalyticsTimesheet = async (workspaceSlug: string, weekStart?: string): Promise<void> => {
    this.workspaceAnalyticsTimesheetError = null; // RT-9: clear error on try
    this.isWorkspaceAnalyticsTimesheetLoading = true;
    try {
      const params: Record<string, string> = {};
      if (weekStart) params["week_start"] = weekStart;
      const data = await this.ceService.getWorkspaceAnalyticsTimesheet(workspaceSlug, params);
      runInAction(() => {
        this.workspaceAnalyticsTimesheetData = data;
      });
    } catch (error) {
      runInAction(() => {
        this.workspaceAnalyticsTimesheetError = error instanceof Error ? error.message : String(error);
      });
    } finally {
      runInAction(() => {
        this.isWorkspaceAnalyticsTimesheetLoading = false;
      });
    }
  };
}
