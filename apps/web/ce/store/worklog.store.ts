/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 *
 * CE extension of WorklogStore — adds analytics, cross-workspace, and capacity categories actions.
 */

import { action, makeObservable, observable, runInAction } from "mobx";
import type {
  IAnalyticsTimesheetResponse,
  ICapacityCategoriesResponse,
  ICapacityDayDetailsResponse,
} from "@plane/types";
import { WorklogService } from "@/services/worklog.service";
import type { IWorklogStore } from "@/store/worklog.store";
import { WorklogStore } from "@/store/worklog.store";

export interface ICEWorklogStore extends IWorklogStore {
  // Analytics timesheet
  analyticsTimesheetData: IAnalyticsTimesheetResponse | null;
  isAnalyticsTimesheetLoading: boolean;
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
  fetchCrossWorkspaceTimesheet(workspaceSlug: string, weekStart?: string): Promise<void>;
  fetchCrossWorkspaceCapacity(workspaceSlug: string, params?: Record<string, string>): Promise<void>;
}

export class CEWorklogStore extends WorklogStore implements ICEWorklogStore {
  analyticsTimesheetData: IAnalyticsTimesheetResponse | null = null;
  isAnalyticsTimesheetLoading = false;
  categoriesData: ICapacityCategoriesResponse | null = null;

  // Separate service instance — base class service is private, so CE uses its own
  private ceService: WorklogService;

  constructor() {
    super();
    this.ceService = new WorklogService();
    makeObservable(this, {
      analyticsTimesheetData: observable,
      isAnalyticsTimesheetLoading: observable,
      categoriesData: observable,
      fetchAnalyticsTimesheet: action,
      fetchCapacityCategories: action,
      fetchCapacityDayDetails: action,
      fetchCrossWorkspaceTimesheet: action,
      fetchCrossWorkspaceCapacity: action,
    });
  }

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

  fetchCrossWorkspaceTimesheet = async (workspaceSlug: string, weekStart?: string): Promise<void> => {
    runInAction(() => {
      this.isTimesheetLoading = true;
    });
    try {
      const params: Record<string, string> = {};
      if (weekStart) params["week_start"] = weekStart;
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
}
