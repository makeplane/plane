import { makeObservable, observable, action, runInAction, set } from "mobx";
import { DashboardService } from "@/services/dashboards/dashboard.service";
import type { CoreRootStore } from "@/store/root.store";
import type {
  IDashboard,
  IDashboardWidget,
  IDashboardChartDataPoint,
  TDashboardCreate,
  TDashboardUpdate,
  TDashboardWidgetCreate,
  TDashboardWidgetUpdate,
} from "@plane/types";

/** Minimal position payload per widget for bulk grid layout updates */
export type TWidgetPositionItem = {
  id: string;
  x_axis_coord: number;
  y_axis_coord: number;
  width: number;
  height: number;
};

export interface IDashboardStore {
  dashboards: IDashboard[];
  dashboardWidgets: Record<string, IDashboardWidget[]>;
  widgetChartData: Record<string, IDashboardChartDataPoint[]>;
  isLoading: boolean;
  fetchDashboards: (workspaceSlug: string) => Promise<void>;
  createDashboard: (workspaceSlug: string, data: TDashboardCreate) => Promise<IDashboard>;
  updateDashboard: (workspaceSlug: string, dashboardId: string, data: TDashboardUpdate) => Promise<IDashboard>;
  deleteDashboard: (workspaceSlug: string, dashboardId: string) => Promise<void>;
  fetchWidgets: (workspaceSlug: string, dashboardId: string) => Promise<void>;
  createWidget: (workspaceSlug: string, dashboardId: string, data: TDashboardWidgetCreate) => Promise<void>;
  updateWidget: (
    workspaceSlug: string,
    dashboardId: string,
    widgetId: string,
    data: TDashboardWidgetUpdate
  ) => Promise<void>;
  deleteWidget: (workspaceSlug: string, dashboardId: string, widgetId: string) => Promise<void>;
  fetchWidgetChartData: (workspaceSlug: string, dashboardId: string, widgetId: string) => Promise<void>;
  localWidgetEdit: (dashboardId: string, widgetId: string, localData: Partial<IDashboardWidget>) => void;
  bulkUpdatePositions: (workspaceSlug: string, dashboardId: string, positions: TWidgetPositionItem[]) => Promise<void>;
}

export class DashboardStore implements IDashboardStore {
  dashboards: IDashboard[] = [];
  dashboardWidgets: Record<string, IDashboardWidget[]> = {};
  widgetChartData: Record<string, IDashboardChartDataPoint[]> = {};
  isLoading = false;

  private dashboardService: DashboardService;
  private rootStore: CoreRootStore;

  constructor(rootStore: CoreRootStore) {
    makeObservable(this, {
      dashboards: observable,
      dashboardWidgets: observable,
      widgetChartData: observable,
      isLoading: observable,
      fetchDashboards: action,
      fetchWidgets: action,
      createDashboard: action,
      updateDashboard: action,
      deleteDashboard: action,
      createWidget: action,
      updateWidget: action,
      deleteWidget: action,
      fetchWidgetChartData: action,
      localWidgetEdit: action,
      bulkUpdatePositions: action,
    });
    this.dashboardService = new DashboardService();
    this.rootStore = rootStore;
  }

  async fetchDashboards(workspaceSlug: string) {
    this.isLoading = true;
    try {
      const response = await this.dashboardService.getDashboards(workspaceSlug);
      runInAction(() => {
        this.dashboards = response;
        this.isLoading = false;
      });
    } catch (error) {
      runInAction(() => {
        this.isLoading = false;
      });
      console.error("Failed to fetch dashboards", error);
    }
  }

  async createDashboard(workspaceSlug: string, data: TDashboardCreate) {
    try {
      const response = await this.dashboardService.createDashboard(workspaceSlug, data);
      runInAction(() => {
        this.dashboards = [...this.dashboards, response];
      });
      return response;
    } catch (error) {
      console.error("Failed to create dashboard", error);
      throw error;
    }
  }

  async updateDashboard(workspaceSlug: string, dashboardId: string, data: TDashboardUpdate) {
    try {
      const response = await this.dashboardService.updateDashboard(workspaceSlug, dashboardId, data);
      runInAction(() => {
        this.dashboards = this.dashboards.map((d) => (d.id === dashboardId ? response : d));
      });
      return response;
    } catch (error) {
      console.error("Failed to update dashboard", error);
      throw error;
    }
  }

  async deleteDashboard(workspaceSlug: string, dashboardId: string) {
    try {
      await this.dashboardService.deleteDashboard(workspaceSlug, dashboardId);
      runInAction(() => {
        this.dashboards = this.dashboards.filter((d) => d.id !== dashboardId);
        delete this.dashboardWidgets[dashboardId];
      });
    } catch (error) {
      console.error("Failed to delete dashboard", error);
      throw error;
    }
  }

  async fetchWidgets(workspaceSlug: string, dashboardId: string) {
    try {
      const response = await this.dashboardService.getWidgets(workspaceSlug, dashboardId);
      runInAction(() => {
        set(this.dashboardWidgets, dashboardId, response);
      });
    } catch (error) {
      console.error("Failed to fetch widgets", error);
    }
  }

  async createWidget(workspaceSlug: string, dashboardId: string, data: TDashboardWidgetCreate) {
    try {
      const response = await this.dashboardService.createWidget(workspaceSlug, dashboardId, data);
      runInAction(() => {
        const widgets = this.dashboardWidgets[dashboardId] || [];
        set(this.dashboardWidgets, dashboardId, [...widgets, response]);
      });
      // Fire-and-forget: fetch initial chart data for the new widget
      this.fetchWidgetChartData(workspaceSlug, dashboardId, response.id).catch(console.error);
    } catch (error) {
      console.error("Failed to create widget", error);
      throw error;
    }
  }

  // Local-only edit for "fake" live preview — no API call, used for visual config changes
  localWidgetEdit(dashboardId: string, widgetId: string, localData: Partial<IDashboardWidget>) {
    const widgets = this.dashboardWidgets[dashboardId];
    if (widgets) {
      const index = widgets.findIndex((w) => w.id === widgetId);
      if (index !== -1) {
        const updated = [...widgets];
        updated[index] = { ...widgets[index], ...localData };
        set(this.dashboardWidgets, dashboardId, updated);
      }
    }
  }

  async updateWidget(workspaceSlug: string, dashboardId: string, widgetId: string, data: TDashboardWidgetUpdate) {
    const original = this.dashboardWidgets[dashboardId]?.find((w) => w.id === widgetId);
    try {
      this.localWidgetEdit(dashboardId, widgetId, data as Partial<IDashboardWidget>);
      await this.dashboardService.updateWidget(workspaceSlug, dashboardId, widgetId, data);

      // Re-fetch chart data if data-affecting properties changed
      if (data.x_axis_property || data.y_axis_metric || data.group_by !== undefined || data.filters) {
        this.fetchWidgetChartData(workspaceSlug, dashboardId, widgetId).catch(console.error);
      }
    } catch (error) {
      // Rollback optimistic update on failure
      if (original) {
        runInAction(() => {
          this.localWidgetEdit(dashboardId, widgetId, original);
        });
      }
      throw error;
    }
  }

  async deleteWidget(workspaceSlug: string, dashboardId: string, widgetId: string) {
    try {
      await this.dashboardService.deleteWidget(workspaceSlug, dashboardId, widgetId);
      runInAction(() => {
        set(
          this.dashboardWidgets,
          dashboardId,
          this.dashboardWidgets[dashboardId].filter((w) => w.id !== widgetId)
        );
      });
    } catch (error) {
      console.error("Failed to delete widget", error);
      throw error;
    }
  }

  async fetchWidgetChartData(workspaceSlug: string, dashboardId: string, widgetId: string) {
    try {
      const response = await this.dashboardService.getWidgetChartData(workspaceSlug, dashboardId, widgetId);
      runInAction(() => {
        set(this.widgetChartData, widgetId, response.data);
      });
    } catch (error) {
      console.error("Failed to fetch widget chart data", error);
    }
  }

  /**
   * Optimistically update widget positions locally, then persist via bulk API.
   * Rolls back on failure.
   */
  async bulkUpdatePositions(workspaceSlug: string, dashboardId: string, positions: TWidgetPositionItem[]) {
    const prevWidgets = this.dashboardWidgets[dashboardId]?.slice() ?? [];

    // Optimistic update
    runInAction(() => {
      const widgets = this.dashboardWidgets[dashboardId];
      if (!widgets) return;
      const posMap = new Map(positions.map((p) => [p.id, p]));
      set(
        this.dashboardWidgets,
        dashboardId,
        widgets.map((w) => {
          const pos = posMap.get(w.id);
          return pos ? { ...w, ...pos } : w;
        })
      );
    });

    try {
      await this.dashboardService.updateWidgetPositions(workspaceSlug, dashboardId, positions);
    } catch (error) {
      // Rollback on API failure
      runInAction(() => {
        set(this.dashboardWidgets, dashboardId, prevWidgets);
      });
      console.error("Failed to bulk update widget positions", error);
      throw error;
    }
  }
}
