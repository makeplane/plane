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
// store
import type { CoreRootStore } from "./root.store";

interface APIError {
  detail?: string;
  message?: string;
}

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
  updateDashboard: (
    workspaceSlug: string,
    dashboardId: string,
    data: TAnalyticsDashboardUpdate
  ) => Promise<IAnalyticsDashboard>;
  deleteDashboard: (workspaceSlug: string, dashboardId: string) => Promise<void>;
  fetchDashboard: (workspaceSlug: string, dashboardId: string) => Promise<IAnalyticsDashboardDetail>;
  createWidget: (
    workspaceSlug: string,
    dashboardId: string,
    data: TAnalyticsWidgetCreate
  ) => Promise<IAnalyticsDashboardWidget>;
  updateWidget: (
    workspaceSlug: string,
    dashboardId: string,
    widgetId: string,
    data: TAnalyticsWidgetUpdate
  ) => Promise<IAnalyticsDashboardWidget>;
  deleteWidget: (workspaceSlug: string, dashboardId: string, widgetId: string) => Promise<void>;
  fetchWidgetData: (
    workspaceSlug: string,
    dashboardId: string,
    widgetId: string,
    params?: Record<string, unknown>
  ) => Promise<IAnalyticsChartData | IAnalyticsNumberWidgetData>;
  updateWidgetPositions: (
    workspaceSlug: string,
    dashboardId: string,
    positions: Array<{ id: string; position: { row: number; col: number; width: number; height: number } }>
  ) => Promise<void>;
  duplicateDashboard: (workspaceSlug: string, dashboardId: string) => Promise<IAnalyticsDashboardDetail>;
  duplicateWidget: (workspaceSlug: string, dashboardId: string, widgetId: string) => Promise<IAnalyticsDashboardWidget>;
  setActiveDashboard: (dashboardId: string | null) => void;
  addDashboardToFavorites: (workspaceSlug: string, dashboardId: string) => Promise<void>;
  removeDashboardFromFavorites: (workspaceSlug: string, dashboardId: string) => Promise<void>;
  getDashboardById: (dashboardId: string) => IAnalyticsDashboard | undefined;
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
  // root store
  rootStore: CoreRootStore;

  constructor(rootStore: CoreRootStore) {
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
      updateWidgetPositions: action,
      duplicateDashboard: action,
      duplicateWidget: action,
      setActiveDashboard: action,
      addDashboardToFavorites: action,
      removeDashboardFromFavorites: action,
    });
    this.rootStore = rootStore;
    this.analyticsDashboardService = new AnalyticsDashboardService();
  }

  // computed
  get dashboardsList(): IAnalyticsDashboard[] {
    return Array.from(this.dashboardMap.values()).sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
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
    return this.currentWidgets.sort((a, b) => {
      const aRow = a.position?.row ?? 0;
      const bRow = b.position?.row ?? 0;
      if (aRow !== bRow) return aRow - bRow;
      return (a.position?.col ?? 0) - (b.position?.col ?? 0);
    });
  }

  // helper method to handle errors
  private getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }
    const apiError = error as APIError;
    return apiError?.detail ?? apiError?.message ?? String(error);
  }

  // actions
  fetchDashboards = async (workspaceSlug: string): Promise<IAnalyticsDashboard[]> => {
    try {
      this.loader = true;
      this.error = null;
      const dashboards = await this.analyticsDashboardService.getDashboards(workspaceSlug);
      runInAction(() => {
        dashboards.forEach((dashboard) => this.dashboardMap.set(dashboard.id, dashboard));
        this.loader = false;
      });
      return dashboards;
    } catch (error) {
      runInAction(() => {
        this.error = this.getErrorMessage(error);
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
      runInAction(() => {
        this.error = this.getErrorMessage(error);
      });
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
      runInAction(() => {
        this.error = this.getErrorMessage(error);
      });
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
      runInAction(() => {
        this.error = this.getErrorMessage(error);
      });
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
        this.error = this.getErrorMessage(error);
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
      runInAction(() => {
        this.error = this.getErrorMessage(error);
      });
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
      runInAction(() => {
        this.error = this.getErrorMessage(error);
      });
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
      runInAction(() => {
        this.error = this.getErrorMessage(error);
      });
      throw error;
    }
  };

  fetchWidgetData = async (
    workspaceSlug: string,
    dashboardId: string,
    widgetId: string,
    params?: Record<string, unknown>
  ): Promise<IAnalyticsChartData | IAnalyticsNumberWidgetData> => {
    const data = await this.analyticsDashboardService.getWidgetData(workspaceSlug, dashboardId, widgetId, params);
    runInAction(() => {
      this.widgetDataMap.set(widgetId, data);
    });
    return data;
  };

  updateWidgetPositions = async (
    workspaceSlug: string,
    dashboardId: string,
    positions: Array<{ id: string; position: { row: number; col: number; width: number; height: number } }>
  ): Promise<void> => {
    // Optimistic update
    const previousPositions = new Map<string, IAnalyticsDashboardWidget>();
    runInAction(() => {
      for (const item of positions) {
        const widget = this.widgetMap.get(item.id);
        if (widget) {
          previousPositions.set(item.id, { ...widget });
          this.widgetMap.set(item.id, { ...widget, position: item.position });
        }
      }
    });

    try {
      await this.analyticsDashboardService.updateWidgetPositions(workspaceSlug, dashboardId, positions);
    } catch (error) {
      // Revert on failure
      runInAction(() => {
        for (const [id, widget] of previousPositions.entries()) {
          this.widgetMap.set(id, widget);
        }
      });
      throw error;
    }
  };

  duplicateDashboard = async (
    workspaceSlug: string,
    dashboardId: string
  ): Promise<IAnalyticsDashboardDetail> => {
    try {
      const dashboard = await this.analyticsDashboardService.duplicateDashboard(workspaceSlug, dashboardId);
      runInAction(() => {
        this.dashboardMap.set(dashboard.id, dashboard);
        if (dashboard.widgets) {
          dashboard.widgets.forEach((w) => this.widgetMap.set(w.id, w));
        }
      });
      return dashboard;
    } catch (error) {
      runInAction(() => {
        this.error = this.getErrorMessage(error);
      });
      throw error;
    }
  };

  duplicateWidget = async (
    workspaceSlug: string,
    dashboardId: string,
    widgetId: string
  ): Promise<IAnalyticsDashboardWidget> => {
    const sourceWidget = this.widgetMap.get(widgetId);
    if (!sourceWidget) throw new Error("Source widget not found");

    // Offset position to the right, or next row if no space
    const newPosition = {
      row: sourceWidget.position.row,
      col: sourceWidget.position.col + sourceWidget.position.width,
      width: sourceWidget.position.width,
      height: sourceWidget.position.height,
    };
    if (newPosition.col + newPosition.width > 12) {
      newPosition.col = 0;
      newPosition.row = sourceWidget.position.row + sourceWidget.position.height;
    }

    const data: TAnalyticsWidgetCreate = {
      widget_type: sourceWidget.widget_type,
      title: `${sourceWidget.title} (Copy)`,
      chart_property: sourceWidget.chart_property,
      chart_metric: sourceWidget.chart_metric,
      config: { ...sourceWidget.config },
      position: newPosition,
    };

    return this.createWidget(workspaceSlug, dashboardId, data);
  };

  setActiveDashboard = (dashboardId: string | null) => {
    this.activeDashboardId = dashboardId;
  };

  getDashboardById = (dashboardId: string): IAnalyticsDashboard | undefined => this.dashboardMap.get(dashboardId);

  addDashboardToFavorites = async (workspaceSlug: string, dashboardId: string): Promise<void> => {
    const dashboard = this.dashboardMap.get(dashboardId);
    if (!dashboard || dashboard.is_favorite) return;

    // Optimistic update
    runInAction(() => {
      this.dashboardMap.set(dashboardId, { ...dashboard, is_favorite: true });
    });

    try {
      await this.rootStore.favorite.addFavorite(workspaceSlug, {
        entity_type: "analytics_dashboard",
        entity_identifier: dashboardId,
        name: dashboard.name,
      });
    } catch (error) {
      // Revert optimistic update on failure
      runInAction(() => {
        this.dashboardMap.set(dashboardId, { ...dashboard, is_favorite: false });
      });
      throw error;
    }
  };

  removeDashboardFromFavorites = async (workspaceSlug: string, dashboardId: string): Promise<void> => {
    const dashboard = this.dashboardMap.get(dashboardId);
    if (!dashboard || !dashboard.is_favorite) return;

    // Optimistic update
    runInAction(() => {
      this.dashboardMap.set(dashboardId, { ...dashboard, is_favorite: false });
    });

    try {
      await this.rootStore.favorite.removeFavoriteEntity(workspaceSlug, dashboardId);
    } catch (error) {
      // Revert optimistic update on failure
      runInAction(() => {
        this.dashboardMap.set(dashboardId, { ...dashboard, is_favorite: true });
      });
      throw error;
    }
  };
}
