/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { API_BASE_URL } from "@plane/constants";
import type {
  IAnalyticsDashboard,
  IAnalyticsDashboardDetail,
  IAnalyticsDashboardWidget,
  TAnalyticsDashboardCreate,
  TAnalyticsDashboardUpdate,
  TAnalyticsWidgetCreate,
  TAnalyticsWidgetUpdate,
  IAnalyticsChartData,
  IAnalyticsNumberWidgetData,
} from "@plane/types";
import { APIService } from "@/services/api.service";

export class AnalyticsDashboardService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  /**
   * List all analytics dashboards for a workspace
   * @param workspaceSlug - Workspace slug
   * @returns Promise resolving to array of dashboards
   */
  async getDashboards(workspaceSlug: string): Promise<IAnalyticsDashboard[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/analytics-dashboards/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Create a new analytics dashboard
   * @param workspaceSlug - Workspace slug
   * @param data - Dashboard creation payload
   * @returns Promise resolving to created dashboard
   */
  async createDashboard(workspaceSlug: string, data: TAnalyticsDashboardCreate): Promise<IAnalyticsDashboard> {
    return this.post(`/api/workspaces/${workspaceSlug}/analytics-dashboards/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Get analytics dashboard details with widgets
   * @param workspaceSlug - Workspace slug
   * @param dashboardId - Dashboard ID
   * @returns Promise resolving to dashboard detail
   */
  async getDashboard(workspaceSlug: string, dashboardId: string): Promise<IAnalyticsDashboardDetail> {
    return this.get(`/api/workspaces/${workspaceSlug}/analytics-dashboards/${dashboardId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Update analytics dashboard
   * @param workspaceSlug - Workspace slug
   * @param dashboardId - Dashboard ID
   * @param data - Dashboard update payload
   * @returns Promise resolving to updated dashboard
   */
  async updateDashboard(
    workspaceSlug: string,
    dashboardId: string,
    data: TAnalyticsDashboardUpdate
  ): Promise<IAnalyticsDashboard> {
    return this.patch(`/api/workspaces/${workspaceSlug}/analytics-dashboards/${dashboardId}/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Delete analytics dashboard
   * @param workspaceSlug - Workspace slug
   * @param dashboardId - Dashboard ID
   */
  async deleteDashboard(workspaceSlug: string, dashboardId: string): Promise<void> {
    return this.delete(`/api/workspaces/${workspaceSlug}/analytics-dashboards/${dashboardId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * List widgets for an analytics dashboard
   * @param workspaceSlug - Workspace slug
   * @param dashboardId - Dashboard ID
   * @returns Promise resolving to array of widgets
   */
  async getWidgets(workspaceSlug: string, dashboardId: string): Promise<IAnalyticsDashboardWidget[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/analytics-dashboards/${dashboardId}/widgets/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Create a new widget
   * @param workspaceSlug - Workspace slug
   * @param dashboardId - Dashboard ID
   * @param data - Widget creation payload
   * @returns Promise resolving to created widget
   */
  async createWidget(
    workspaceSlug: string,
    dashboardId: string,
    data: TAnalyticsWidgetCreate
  ): Promise<IAnalyticsDashboardWidget> {
    return this.post(`/api/workspaces/${workspaceSlug}/analytics-dashboards/${dashboardId}/widgets/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Get widget configuration
   * @param workspaceSlug - Workspace slug
   * @param dashboardId - Dashboard ID
   * @param widgetId - Widget ID
   * @returns Promise resolving to widget
   */
  async getWidget(workspaceSlug: string, dashboardId: string, widgetId: string): Promise<IAnalyticsDashboardWidget> {
    return this.get(`/api/workspaces/${workspaceSlug}/analytics-dashboards/${dashboardId}/widgets/${widgetId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Update widget
   * @param workspaceSlug - Workspace slug
   * @param dashboardId - Dashboard ID
   * @param widgetId - Widget ID
   * @param data - Widget update payload
   * @returns Promise resolving to updated widget
   */
  async updateWidget(
    workspaceSlug: string,
    dashboardId: string,
    widgetId: string,
    data: TAnalyticsWidgetUpdate
  ): Promise<IAnalyticsDashboardWidget> {
    return this.patch(`/api/workspaces/${workspaceSlug}/analytics-dashboards/${dashboardId}/widgets/${widgetId}/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Delete widget
   * @param workspaceSlug - Workspace slug
   * @param dashboardId - Dashboard ID
   * @param widgetId - Widget ID
   */
  async deleteWidget(workspaceSlug: string, dashboardId: string, widgetId: string): Promise<void> {
    return this.delete(`/api/workspaces/${workspaceSlug}/analytics-dashboards/${dashboardId}/widgets/${widgetId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Bulk update widget positions after drag-and-drop or resize
   */
  async updateWidgetPositions(
    workspaceSlug: string,
    dashboardId: string,
    positions: Array<{ id: string; position: { row: number; col: number; width: number; height: number } }>
  ): Promise<{ updated: number }> {
    return this.patch(
      `/api/workspaces/${workspaceSlug}/analytics-dashboards/${dashboardId}/widgets/positions/`,
      { positions }
    )
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Duplicate an analytics dashboard with all its widgets
   */
  async duplicateDashboard(workspaceSlug: string, dashboardId: string): Promise<IAnalyticsDashboardDetail> {
    return this.post(`/api/workspaces/${workspaceSlug}/analytics-dashboards/${dashboardId}/duplicate/`, {})
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Fetch widget data (chart data or number value)
   * @param workspaceSlug - Workspace slug
   * @param dashboardId - Dashboard ID
   * @param widgetId - Widget ID
   * @param params - Optional query parameters (filters, date range)
   * @returns Promise resolving to widget data
   */
  async getWidgetData(
    workspaceSlug: string,
    dashboardId: string,
    widgetId: string,
    params?: Record<string, any>
  ): Promise<IAnalyticsChartData | IAnalyticsNumberWidgetData> {
    return this.get(`/api/workspaces/${workspaceSlug}/analytics-dashboards/${dashboardId}/widgets/${widgetId}/data/`, {
      params,
    })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}
