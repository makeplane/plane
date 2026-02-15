/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { action, computed, makeObservable, observable, runInAction } from "mobx";
// types
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
// services
import { AnalyticsDashboardService } from "@/services/analytics-dashboard.service";

export interface IAnalyticsDashboardStore {
  // observables
  dashboardMap: Map<string, IAnalyticsDashboard>;
  widgetMap: Map<string, IAnalyticsDashboardWidget>;
  widgetDataMap: Map<string, IAnalyticsChartData | IAnalyticsNumberWidgetData>;
  activeDashboardId: string | null;
  loader: boolean;
  error: string | null;
  // computed
  dashboardsList: IAnalyticsDashboard[];
  currentDashboard: IAnalyticsDashboard | null;
  currentWidgets: IAnalyticsDashboardWidget[];
  sortedWidgets: IAnalyticsDashboardWidget[];
  // actions
  fetchDashboards: (workspaceSlug: string) => Promise<IAnalyticsDashboard[]>;
  createDashboard: (workspaceSlug: string, data: TAnalyticsDashboardCreate) => Promise<IAnalyticsDashboard>;
  updateDashboard: (workspaceSlug: string, dashboardId: string, data: TAnalyticsDashboardUpdate) => Promise<IAnalyticsDashboard>;
  deleteDashboard: (workspaceSlug: string, dashboardId: string) => Promise<void>;
  fetchDashboard: (workspaceSlug: string, dashboardId: string) => Promise<IAnalyticsDashboardDetail>;
  createWidget: (workspaceSlug: string, dashboardId: string, data: TAnalyticsWidgetCreate) => Promise<IAnalyticsDashboardWidget>;
  updateWidget: (workspaceSlug: string, dashboardId: string, widgetId: string, data: TAnalyticsWidgetUpdate) => Promise<IAnalyticsDashboardWidget>;
  deleteWidget: (workspaceSlug: string, dashboardId: string, widgetId: string) => Promise<void>;
  fetchWidgetData: (workspaceSlug: string, dashboardId: string, widgetId: string, params?: Record<string, any>) => Promise<IAnalyticsChartData | IAnalyticsNumberWidgetData>;
  setActiveDashboard: (dashboardId: string | null) => void;
}

export class AnalyticsDashboardStore implements IAnalyticsDashboardStore {
  // observables
  dashboardMap: Map<string, IAnalyticsDashboard> = new Map();
  widgetMap: Map<string, IAnalyticsDashboardWidget> = new Map();
  widgetDataMap: Map<string, IAnalyticsChartData | IAnalyticsNumberWidgetData> = new Map();
  activeDashboardId: string | null = null;
  loader = false;
  error: string | null = null;
  // service
  analyticsDashboardService: AnalyticsDashboardService;

  constructor() {
    makeObservable(this, {
      dashboardMap: observable,
      widgetMap: observable,
      widgetDataMap: observable,
      activeDashboardId: observable.ref,
      loader: observable.ref,
      error: observable.ref,
      // computed
      dashboardsList: computed,
      currentDashboard: computed,
      currentWidgets: computed,
      sortedWidgets: computed,
      // actions
      fetchDashboards: action,
      createDashboard: action,
      updateDashboard: action,
      deleteDashboard: action,
      fetchDashboard: action,
      createWidget: action,
      updateWidget: action,
      deleteWidget: action,
      fetchWidgetData: action,
      setActiveDashboard: action,
    });
    this.analyticsDashboardService = new AnalyticsDashboardService();
  }

  // computed
  get dashboardsList(): IAnalyticsDashboard[] {
    return Array.from(this.dashboardMap.values()).sort(
      (a, b) => a.sort_order - b.sort_order || b.created_at.localeCompare(a.created_at)
    );
  }

  get currentDashboard(): IAnalyticsDashboard | null {
    if (!this.activeDashboardId) return null;
    return this.dashboardMap.get(this.activeDashboardId) ?? null;
  }

  get currentWidgets(): IAnalyticsDashboardWidget[] {
    if (!this.activeDashboardId) return [];
    return Array.from(this.widgetMap.values()).filter((w) => w.dashboard === this.activeDashboardId);
  }

  get sortedWidgets(): IAnalyticsDashboardWidget[] {
    return [...this.currentWidgets].sort(
      (a, b) => a.sort_order - b.sort_order || b.created_at.localeCompare(a.created_at)
    );
  }

  // actions
  fetchDashboards = async (workspaceSlug: string): Promise<IAnalyticsDashboard[]> => {
    try {
      this.loader = true;
      this.error = null;
      const dashboards = await this.analyticsDashboardService.getDashboards(workspaceSlug);
      runInAction(() => {
        dashboards.forEach((d) => this.dashboardMap.set(d.id, d));
        this.loader = false;
      });
      return dashboards;
    } catch (error) {
      runInAction(() => {
        this.error = error instanceof Error
          ? error.message
          : (error as any)?.detail ?? (error as any)?.message ?? String(error);
        this.loader = false;
      });
      throw error;
    }
  };

  createDashboard = async (workspaceSlug: string, data: TAnalyticsDashboardCreate): Promise<IAnalyticsDashboard> => {
    try {
      const dashboard = await this.analyticsDashboardService.createDashboard(workspaceSlug, data);
      runInAction(() => {
        this.dashboardMap.set(dashboard.id, dashboard);
      });
      return dashboard;
    } catch (error) {
      runInAction(() => { this.error = error instanceof Error
          ? error.message
          : (error as any)?.detail ?? (error as any)?.message ?? String(error); });
      throw error;
    }
  };

  updateDashboard = async (
    workspaceSlug: string,
    dashboardId: string,
    data: TAnalyticsDashboardUpdate
  ): Promise<IAnalyticsDashboard> => {
    try {
      const dashboard = await this.analyticsDashboardService.updateDashboard(workspaceSlug, dashboardId, data);
      runInAction(() => {
        this.dashboardMap.set(dashboard.id, dashboard);
      });
      return dashboard;
    } catch (error) {
      runInAction(() => { this.error = error instanceof Error
          ? error.message
          : (error as any)?.detail ?? (error as any)?.message ?? String(error); });
      throw error;
    }
  };

  deleteDashboard = async (workspaceSlug: string, dashboardId: string): Promise<void> => {
    try {
      await this.analyticsDashboardService.deleteDashboard(workspaceSlug, dashboardId);
      runInAction(() => {
        this.dashboardMap.delete(dashboardId);
        // Clear widgets for deleted dashboard
        for (const [widgetId, widget] of this.widgetMap.entries()) {
          if (widget.dashboard === dashboardId) {
            this.widgetMap.delete(widgetId);
            this.widgetDataMap.delete(widgetId);
          }
        }
        if (this.activeDashboardId === dashboardId) this.activeDashboardId = null;
      });
    } catch (error) {
      runInAction(() => { this.error = error instanceof Error
          ? error.message
          : (error as any)?.detail ?? (error as any)?.message ?? String(error); });
      throw error;
    }
  };

  fetchDashboard = async (workspaceSlug: string, dashboardId: string): Promise<IAnalyticsDashboardDetail> => {
    try {
      this.loader = true;
      this.error = null;
      const dashboard = await this.analyticsDashboardService.getDashboard(workspaceSlug, dashboardId);
      runInAction(() => {
        this.dashboardMap.set(dashboard.id, dashboard);
        dashboard.widgets.forEach((w) => this.widgetMap.set(w.id, w));
        this.loader = false;
      });
      return dashboard;
    } catch (error) {
      runInAction(() => {
        this.error = error instanceof Error
          ? error.message
          : (error as any)?.detail ?? (error as any)?.message ?? String(error);
        this.loader = false;
      });
      throw error;
    }
  };

  createWidget = async (
    workspaceSlug: string,
    dashboardId: string,
    data: TAnalyticsWidgetCreate
  ): Promise<IAnalyticsDashboardWidget> => {
    try {
      const widget = await this.analyticsDashboardService.createWidget(workspaceSlug, dashboardId, data);
      runInAction(() => {
        this.widgetMap.set(widget.id, widget);
        const dashboard = this.dashboardMap.get(dashboardId);
        if (dashboard) {
          this.dashboardMap.set(dashboardId, { ...dashboard, widget_count: dashboard.widget_count + 1 });
        }
      });
      return widget;
    } catch (error) {
      runInAction(() => { this.error = error instanceof Error
          ? error.message
          : (error as any)?.detail ?? (error as any)?.message ?? String(error); });
      throw error;
    }
  };

  updateWidget = async (
    workspaceSlug: string,
    dashboardId: string,
    widgetId: string,
    data: TAnalyticsWidgetUpdate
  ): Promise<IAnalyticsDashboardWidget> => {
    try {
      const widget = await this.analyticsDashboardService.updateWidget(workspaceSlug, dashboardId, widgetId, data);
      runInAction(() => {
        this.widgetMap.set(widget.id, widget);
        this.widgetDataMap.delete(widgetId);
      });
      return widget;
    } catch (error) {
      runInAction(() => { this.error = error instanceof Error
          ? error.message
          : (error as any)?.detail ?? (error as any)?.message ?? String(error); });
      throw error;
    }
  };

  deleteWidget = async (workspaceSlug: string, dashboardId: string, widgetId: string): Promise<void> => {
    try {
      await this.analyticsDashboardService.deleteWidget(workspaceSlug, dashboardId, widgetId);
      runInAction(() => {
        this.widgetMap.delete(widgetId);
        this.widgetDataMap.delete(widgetId);
        const dashboard = this.dashboardMap.get(dashboardId);
        if (dashboard && dashboard.widget_count > 0) {
          this.dashboardMap.set(dashboardId, { ...dashboard, widget_count: dashboard.widget_count - 1 });
        }
      });
    } catch (error) {
      runInAction(() => { this.error = error instanceof Error
          ? error.message
          : (error as any)?.detail ?? (error as any)?.message ?? String(error); });
      throw error;
    }
  };

  fetchWidgetData = async (
    workspaceSlug: string,
    dashboardId: string,
    widgetId: string,
    params?: Record<string, any>
  ): Promise<IAnalyticsChartData | IAnalyticsNumberWidgetData> => {
    try {
      const data = await this.analyticsDashboardService.getWidgetData(workspaceSlug, dashboardId, widgetId, params);
      runInAction(() => {
        this.widgetDataMap.set(widgetId, data);
      });
      return data;
    } catch (error) {
      throw error;
    }
  };

  setActiveDashboard = (dashboardId: string | null) => {
    this.activeDashboardId = dashboardId;
  };
}
