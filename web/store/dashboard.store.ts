import { action, computed, makeObservable, observable, runInAction } from "mobx";
import set from "lodash/set";
// services
import { DashboardService } from "services/dashboard.service";
// types
import { RootStore } from "store/root.store";
import { IHomeDashboardResponse, IWidget, IWidgetStatsResponse, TWidgetKeys } from "@plane/types";

export interface IDashboardStore {
  // observables
  homeDashboardId: string | null;
  visibleWidgetsDetails: { [workspaceSlug: string]: Record<string, IWidget[]> }; // { dashboardId: IWidget[] }
  widgetStats: { [workspaceSlug: string]: Record<string, Record<TWidgetKeys, IWidgetStatsResponse>> };
  //  {
  //    workspaceSlug: {
  //      dashboardId: {
  //        widgetKey: IWidgetStatsResponse;
  //        }
  //     }
  //  }
  // computed
  homeDashboardWidgets: IWidget[] | undefined;
  // computed actions
  getWidgetStats: <T>(workspaceSlug: string, dashboardId: string, widgetKey: TWidgetKeys) => T | undefined;
  // actions
  fetchHomeDashboardWidgets: (workspaceSlug: string) => Promise<IHomeDashboardResponse>;
  fetchWidgetStats: (
    workspaceSlug: string,
    dashboardId: string,
    widgetKey: TWidgetKeys
  ) => Promise<IWidgetStatsResponse>;
}

export class DashboardStore implements IDashboardStore {
  // observables
  homeDashboardId: string | null = null;
  visibleWidgetsDetails: { [workspaceSlug: string]: Record<string, IWidget[]> } = {};
  widgetStats: { [workspaceSlug: string]: Record<string, Record<TWidgetKeys, IWidgetStatsResponse>> } = {};
  // root store
  routerStore;
  // services
  dashboardService;

  constructor(_rootStore: RootStore) {
    makeObservable(this, {
      // observables
      homeDashboardId: observable.ref,
      visibleWidgetsDetails: observable,
      widgetStats: observable,
      // computed
      homeDashboardWidgets: computed,
      // computed actions
      getWidgetStats: action,
      // actions
      fetchHomeDashboardWidgets: action,
      fetchWidgetStats: action,
    });

    // router store
    this.routerStore = _rootStore.app.router;
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
    const { homeDashboardId, visibleWidgetsDetails } = this;
    return homeDashboardId ? visibleWidgetsDetails?.[workspaceSlug]?.[homeDashboardId] : undefined;
  }

  /**
   * @description get widget stats
   * @param dashboardId
   * @param widgetKey
   * @returns widget stats
   */
  getWidgetStats = <T>(workspaceSlug: string, dashboardId: string, widgetKey: TWidgetKeys): T | undefined =>
    (this.widgetStats?.[workspaceSlug]?.[dashboardId]?.[widgetKey] as T) ?? undefined;

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
        set(this.visibleWidgetsDetails, [workspaceSlug, response.dashboard.id], response.widgets);
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
  fetchWidgetStats = async (workspaceSlug: string, dashboardId: string, widgetKey: TWidgetKeys) =>
    this.dashboardService.getWidgetStats(workspaceSlug, dashboardId, widgetKey).then((res) => {
      runInAction(() => {
        set(this.widgetStats, [workspaceSlug, dashboardId, widgetKey], res);
      });

      return res;
    });
}
