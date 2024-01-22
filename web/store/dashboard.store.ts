import { action, computed, makeObservable, observable, runInAction } from "mobx";
import { computedFn } from "mobx-utils";
import set from "lodash/set";
// services
import { DashboardService } from "services/dashboard.service";
// types
import { RootStore } from "store/root.store";
import {
  THomeDashboardResponse,
  TWidget,
  TWidgetFiltersFormData,
  TWidgetStatsResponse,
  TWidgetKeys,
  TWidgetStatsRequestParams,
} from "@plane/types";

export interface IDashboardStore {
  // observables
  homeDashboardId: string | null;
  widgetDetails: { [workspaceSlug: string]: Record<string, TWidget[]> };
  // {
  //  workspaceSlug: {
  //    dashboardId: TWidget[]
  //   }
  // }
  widgetStats: { [workspaceSlug: string]: Record<string, Record<TWidgetKeys, TWidgetStatsResponse>> };
  //  {
  //    workspaceSlug: {
  //      dashboardId: {
  //        widgetKey: TWidgetStatsResponse;
  //        }
  //     }
  //  }
  // computed
  homeDashboardWidgets: TWidget[] | undefined;
  // computed actions
  getWidgetDetails: (workspaceSlug: string, dashboardId: string, widgetKey: TWidgetKeys) => TWidget | undefined;
  getWidgetStats: <T>(workspaceSlug: string, dashboardId: string, widgetKey: TWidgetKeys) => T | undefined;
  // actions
  fetchHomeDashboardWidgets: (workspaceSlug: string) => Promise<THomeDashboardResponse>;
  fetchWidgetStats: (
    workspaceSlug: string,
    dashboardId: string,
    params: TWidgetStatsRequestParams
  ) => Promise<TWidgetStatsResponse>;
  updateDashboardWidget: (
    workspaceSlug: string,
    dashboardId: string,
    widgetId: string,
    data: Partial<TWidget>
  ) => Promise<any>;
  updateDashboardWidgetFilters: (
    workspaceSlug: string,
    dashboardId: string,
    widgetId: string,
    data: TWidgetFiltersFormData
  ) => Promise<any>;
}

export class DashboardStore implements IDashboardStore {
  // observables
  homeDashboardId: string | null = null;
  widgetDetails: { [workspaceSlug: string]: Record<string, TWidget[]> } = {};
  widgetStats: { [workspaceSlug: string]: Record<string, Record<TWidgetKeys, TWidgetStatsResponse>> } = {};
  // stores
  routerStore;
  issueStore;
  // services
  dashboardService;

  constructor(_rootStore: RootStore) {
    makeObservable(this, {
      // observables
      homeDashboardId: observable.ref,
      widgetDetails: observable,
      widgetStats: observable,
      // computed
      homeDashboardWidgets: computed,
      // fetch actions
      fetchHomeDashboardWidgets: action,
      fetchWidgetStats: action,
      // update actions
      updateDashboardWidget: action,
      updateDashboardWidgetFilters: action,
    });

    // router store
    this.routerStore = _rootStore.app.router;
    this.issueStore = _rootStore.issue.issues;
    // services
    this.dashboardService = new DashboardService();
  }

  /**
   * @description get home dashboard widgets
   * @returns home dashboard widgets
   */
  get homeDashboardWidgets() {
    const workspaceSlug = this.routerStore.workspaceSlug;
    if (!workspaceSlug) return undefined;
    const { homeDashboardId, widgetDetails } = this;
    return homeDashboardId ? widgetDetails?.[workspaceSlug]?.[homeDashboardId] : undefined;
  }

  /**
   * @description get widget details
   * @param workspaceSlug
   * @param dashboardId
   * @param widgetId
   * @returns widget details
   */
  getWidgetDetails = computedFn((workspaceSlug: string, dashboardId: string, widgetKey: TWidgetKeys) => {
    const widgets = this.widgetDetails?.[workspaceSlug]?.[dashboardId];
    if (!widgets) return undefined;
    return widgets.find((widget) => widget.key === widgetKey);
  });

  /**
   * @description get widget stats
   * @param workspaceSlug
   * @param dashboardId
   * @param widgetKey
   * @returns widget stats
   */
  getWidgetStats = <T>(workspaceSlug: string, dashboardId: string, widgetKey: TWidgetKeys): T | undefined =>
    (this.widgetStats?.[workspaceSlug]?.[dashboardId]?.[widgetKey] as unknown as T) ?? undefined;

  /**
   * @description fetch home dashboard details and widgets
   * @param workspaceSlug
   * @returns home dashboard response
   */
  fetchHomeDashboardWidgets = async (workspaceSlug: string) => {
    try {
      const response = await this.dashboardService.getHomeDashboardWidgets(workspaceSlug);

      runInAction(() => {
        this.homeDashboardId = response.dashboard.id;
        set(this.widgetDetails, [workspaceSlug, response.dashboard.id], response.widgets);
      });

      return response;
    } catch (error) {
      runInAction(() => {
        this.homeDashboardId = null;
      });

      throw error;
    }
  };

  /**
   * @description fetch widget stats
   * @param workspaceSlug
   * @param dashboardId
   * @param widgetKey
   * @returns widget stats
   */
  fetchWidgetStats = async (workspaceSlug: string, dashboardId: string, params: TWidgetStatsRequestParams) =>
    this.dashboardService.getWidgetStats(workspaceSlug, dashboardId, params).then((res) => {
      runInAction(() => {
        // @ts-ignore
        if (res.issues) this.issueStore.addIssue(res.issues);
        set(this.widgetStats, [workspaceSlug, dashboardId, params.widget_key], res);
      });

      return res;
    });

  /**
   * @description update dashboard widget
   * @param dashboardId
   * @param widgetId
   * @param data
   * @returns updated widget
   */
  updateDashboardWidget = async (
    workspaceSlug: string,
    dashboardId: string,
    widgetId: string,
    data: Partial<TWidget>
  ): Promise<any> => {
    // find all widgets in dashboard
    const widgets = this.widgetDetails?.[workspaceSlug]?.[dashboardId];
    if (!widgets) throw new Error("Dashboard not found");
    // find widget index
    const widgetIndex = widgets.findIndex((widget) => widget.id === widgetId);
    // get original widget
    const originalWidget = { ...widgets[widgetIndex] };
    if (widgetIndex === -1) throw new Error("Widget not found");

    try {
      runInAction(() => {
        this.widgetDetails[workspaceSlug][dashboardId][widgetIndex] = {
          ...widgets[widgetIndex],
          ...data,
        };
      });
      const response = await this.dashboardService.updateDashboardWidget(dashboardId, widgetId, data);
      return response;
    } catch (error) {
      // revert changes
      runInAction(() => {
        this.widgetDetails[workspaceSlug][dashboardId][widgetIndex] = originalWidget;
      });
      throw error;
    }
  };

  /**
   * @description update dashboard widget filters
   * @param dashboardId
   * @param widgetId
   * @param data
   * @returns updated widget
   */
  updateDashboardWidgetFilters = async (
    workspaceSlug: string,
    dashboardId: string,
    widgetId: string,
    data: TWidgetFiltersFormData
  ): Promise<TWidget> => {
    const widgetDetails = this.getWidgetDetails(workspaceSlug, dashboardId, data.widgetKey);
    if (!widgetDetails) throw new Error("Widget not found");
    try {
      const updatedWidget = {
        ...widgetDetails,
        widget_filters: {
          ...widgetDetails.widget_filters,
          ...data.filters,
        },
      };
      // update widget details optimistically
      runInAction(() => {
        set(
          this.widgetDetails,
          [workspaceSlug, dashboardId],
          this.widgetDetails?.[workspaceSlug]?.[dashboardId]?.map((w) => (w.id === widgetId ? updatedWidget : w))
        );
      });
      const response = await this.updateDashboardWidget(workspaceSlug, dashboardId, widgetId, {
        filters: {
          ...widgetDetails.widget_filters,
          ...data.filters,
        },
      }).then((res) => res);

      return response;
    } catch (error) {
      // revert changes
      runInAction(() => {
        this.widgetDetails[workspaceSlug][dashboardId] = this.widgetDetails?.[workspaceSlug]?.[dashboardId]?.map((w) =>
          w.id === widgetId ? widgetDetails : w
        );
      });
      throw error;
    }
  };
}
