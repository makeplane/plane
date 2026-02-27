import { makeObservable, observable, action, runInAction } from "mobx";
import { DashboardService } from "@/services/dashboards/dashboard.service";
import type { CoreRootStore } from "@/store/root.store";

export class DashboardStore {
  dashboards: any[] = [];
  dashboardWidgets: Record<string, any[]> = {}; // Keyed by dashboardId
  widgetChartData: Record<string, any> = {};    // Keyed by widgetId
  isLoading: boolean = false;

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
      runInAction(() => { this.isLoading = false; });
      console.error("Failed to fetch dashboards", error);
    }
  }

  async createDashboard(workspaceSlug: string, data: any) {
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

  async updateDashboard(workspaceSlug: string, dashboardId: string, data: any) {
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
        this.dashboardWidgets[dashboardId] = response;
      });
    } catch (error) {
      console.error("Failed to fetch widgets", error);
    }
  }

  async createWidget(workspaceSlug: string, dashboardId: string, data: any) {
    try {
      const response = await this.dashboardService.createWidget(workspaceSlug, dashboardId, data);
      runInAction(() => {
        const widgets = this.dashboardWidgets[dashboardId] || [];
        this.dashboardWidgets[dashboardId] = [...widgets, response];
      });
      // Fetch initial chart data
      this.fetchWidgetChartData(workspaceSlug, dashboardId, response.id);
    } catch (error) {
      console.error("Failed to create widget", error);
    }
  }

  // FAKE LIVE PREVIEW: Only call API on close panel. Use this for visual only.
  localWidgetEdit(dashboardId: string, widgetId: string, localData: any) {
    const widgets = this.dashboardWidgets[dashboardId];
    if (widgets) {
      const index = widgets.findIndex(w => w.id === widgetId);
      if (index !== -1) {
        // Replace array reference so MobX reactions fire reliably
        const updated = [...widgets];
        updated[index] = { ...widgets[index], ...localData };
        this.dashboardWidgets[dashboardId] = updated;
      }
    }
  }

  async updateWidget(workspaceSlug: string, dashboardId: string, widgetId: string, data: any) {
    try {
      // Immediate local reflect
      this.localWidgetEdit(dashboardId, widgetId, data);

      // Perform save
      const response = await this.dashboardService.updateWidget(workspaceSlug, dashboardId, widgetId, data);

      // If config changed impacting grouping/queries, refresh chart logic
      if (data.x_axis_property || data.y_axis_metric || data.group_by || data.filters) {
        this.fetchWidgetChartData(workspaceSlug, dashboardId, widgetId);
      }
    } catch (error) {
      console.error("Failed to update widget fallback UX", error);
    }
  }

  async deleteWidget(workspaceSlug: string, dashboardId: string, widgetId: string) {
    try {
      await this.dashboardService.deleteWidget(workspaceSlug, dashboardId, widgetId);
      runInAction(() => {
        this.dashboardWidgets[dashboardId] = this.dashboardWidgets[dashboardId].filter(
          w => w.id !== widgetId
        );
      });
    } catch (error) {
      console.error("Failed to delete widget", error);
    }
  }

  async fetchWidgetChartData(workspaceSlug: string, dashboardId: string, widgetId: string) {
    try {
      const response = await this.dashboardService.getWidgetChartData(workspaceSlug, dashboardId, widgetId);
      runInAction(() => {
        this.widgetChartData[widgetId] = response.data;
      });
    } catch (error) {
      console.error("Failed to map widget analytics graph render block", error);
    }
  }
}
