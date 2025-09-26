import { set } from "lodash-es";
import { action, computed, makeObservable, observable, runInAction } from "mobx";
// plane imports
import { E_FEATURE_FLAGS, WIDGET_CHART_MODELS_LIST } from "@plane/constants";
// plane types
import {
  EWidgetChartModels,
  EWidgetChartTypes,
  EWidgetXAxisDateGrouping,
  EWidgetXAxisProperty,
  EWidgetYAxisMetric,
  TDashboardWidget,
  TDashboardWidgetConfig,
  TDashboardWidgetData,
  TExternalDashboardWidgetFilterExpression,
} from "@plane/types";
// plane web store
import { RootStore } from "@/plane-web/store/root.store";
import { TDashboardWidgetHelpers } from "./dashboard-widgets.store";

export interface IDashboardWidgetInstance extends TDashboardWidget {
  isFetchingData: boolean;
  data: TDashboardWidgetData | null;
  // helpers
  asJSON: TDashboardWidget;
  mutateProperties: (data: Partial<TDashboardWidget>) => void;
  isConfigurationMissing: keyof TDashboardWidget | null;
  isWidgetAvailableInCurrentPlan: boolean;
  // permissions
  canCurrentUserDeleteWidget: boolean;
  canCurrentUserEditWidget: boolean;
  // actions
  updateWidget: (data: Partial<TDashboardWidget>) => Promise<TDashboardWidget>;
  fetchWidgetData: () => Promise<TDashboardWidgetData | undefined>;
}

export class DashboardWidgetInstance implements IDashboardWidgetInstance {
  // observables
  isFetchingData: boolean = false;
  data: TDashboardWidgetData | null = null;
  // widget properties
  chart_model: EWidgetChartModels | undefined;
  chart_type: EWidgetChartTypes | undefined;
  config: TDashboardWidgetConfig | undefined;
  filters: TExternalDashboardWidgetFilterExpression | undefined;
  created_at: Date | undefined;
  created_by: string | undefined;
  group_by: EWidgetXAxisProperty | null | undefined;
  height: number | undefined;
  id: string | undefined;
  name: string | undefined;
  updated_at: Date | undefined;
  updated_by: string | undefined;
  width: number | undefined;
  x_axis_coord: number | undefined;
  x_axis_date_grouping: EWidgetXAxisDateGrouping | null | undefined;
  x_axis_property: EWidgetXAxisProperty | null | undefined;
  y_axis_coord: number | undefined;
  y_axis_metric: EWidgetYAxisMetric | null | undefined;
  // helpers
  private helpers: TDashboardWidgetHelpers;
  // root store
  private rootStore: RootStore;

  constructor(store: RootStore, widget: TDashboardWidget, helpers: TDashboardWidgetHelpers) {
    // initialize widget properties
    this.chart_model = widget.chart_model;
    this.chart_type = widget.chart_type;
    this.config = widget.config;
    this.created_at = widget.created_at;
    this.created_by = widget.created_by;
    this.group_by = widget.group_by;
    this.height = widget.height === undefined ? 1 : widget.height;
    this.id = widget.id;
    this.name = widget.name;
    this.updated_at = widget.updated_at;
    this.updated_by = widget.updated_by;
    this.width = widget.width === undefined ? 1 : widget.width;
    this.x_axis_coord = widget.x_axis_coord === undefined ? 0 : widget.x_axis_coord;
    this.x_axis_date_grouping = widget.x_axis_date_grouping;
    this.x_axis_property = widget.x_axis_property;
    this.y_axis_coord = widget.y_axis_coord === undefined ? 0 : widget.y_axis_coord;
    this.y_axis_metric = widget.y_axis_metric;
    this.filters = widget.filters;
    // initialize helpers
    this.helpers = helpers;
    // initialize root store
    this.rootStore = store;

    makeObservable(this, {
      // observables
      isFetchingData: observable.ref,
      data: observable,
      filters: observable,
      chart_model: observable.ref,
      chart_type: observable.ref,
      config: observable,
      created_at: observable.ref,
      created_by: observable.ref,
      group_by: observable.ref,
      height: observable.ref,
      id: observable.ref,
      name: observable.ref,
      updated_at: observable.ref,
      updated_by: observable.ref,
      width: observable.ref,
      x_axis_coord: observable.ref,
      x_axis_date_grouping: observable.ref,
      x_axis_property: observable.ref,
      y_axis_coord: observable.ref,
      y_axis_metric: observable.ref,
      // computed
      asJSON: computed,
      isConfigurationMissing: computed,
      isWidgetAvailableInCurrentPlan: computed,
      canCurrentUserDeleteWidget: computed,
      canCurrentUserEditWidget: computed,
      // actions
      mutateProperties: action,
      updateWidget: action,
      fetchWidgetData: action,
    });
  }

  // helpers
  get asJSON() {
    return {
      chart_model: this.chart_model,
      chart_type: this.chart_type,
      config: this.config,
      created_at: this.created_at,
      created_by: this.created_by,
      group_by: this.group_by,
      height: this.height,
      id: this.id,
      name: this.name,
      updated_at: this.updated_at,
      updated_by: this.updated_by,
      width: this.width,
      x_axis_coord: this.x_axis_coord,
      x_axis_date_grouping: this.x_axis_date_grouping,
      x_axis_property: this.x_axis_property,
      y_axis_coord: this.y_axis_coord,
      y_axis_metric: this.y_axis_metric,
      filters: this.filters,
    };
  }

  get isConfigurationMissing() {
    const chartType = this.chart_type;
    const chartModel = this.chart_model;
    if (chartType === EWidgetChartTypes.BAR_CHART) {
      if (!this.x_axis_property) return "x_axis_property";
      if (!this.y_axis_metric) return "y_axis_metric";
      if ((chartModel === EWidgetChartModels.STACKED || chartModel === EWidgetChartModels.GROUPED) && !this.group_by)
        return "group_by";
    }
    if (chartType === EWidgetChartTypes.LINE_CHART) {
      if (!this.x_axis_property) return "x_axis_property";
      if (!this.y_axis_metric) return "y_axis_metric";
      if (chartModel === EWidgetChartModels.MULTI_LINE && !this.group_by) return "group_by";
    }
    if (chartType === EWidgetChartTypes.AREA_CHART) {
      if (!this.x_axis_property) return "x_axis_property";
      if (!this.y_axis_metric) return "y_axis_metric";
      if (chartModel === EWidgetChartModels.STACKED && !this.group_by) return "group_by";
    }
    if (chartType === EWidgetChartTypes.DONUT_CHART) {
      if (chartModel === EWidgetChartModels.PROGRESS) {
        if (!this.y_axis_metric) return "y_axis_metric";
      } else {
        if (!this.x_axis_property) return "x_axis_property";
        if (!this.y_axis_metric) return "y_axis_metric";
      }
    }
    if (chartType === EWidgetChartTypes.PIE_CHART) {
      if (!this.x_axis_property) return "x_axis_property";
      if (!this.y_axis_metric) return "y_axis_metric";
    }
    if (chartType === EWidgetChartTypes.NUMBER) {
      if (!this.y_axis_metric) return "y_axis_metric";
    }
    return null;
  }

  get isWidgetAvailableInCurrentPlan() {
    const chartType = this.chart_type;
    const chartModel = this.chart_model;
    if (!chartType || !chartModel) return false;
    const currentModelFlags = WIDGET_CHART_MODELS_LIST[chartType].find((model) => model.value === chartModel)?.flags;
    const getFeatureFlag = (flag: E_FEATURE_FLAGS) =>
      this.rootStore.featureFlags.getFeatureFlagForCurrentWorkspace(flag, false);
    return !!currentModelFlags?.some((flag) => getFeatureFlag(flag));
  }

  mutateProperties: IDashboardWidgetInstance["mutateProperties"] = (data) => {
    runInAction(() => {
      Object.keys(data).map((key) => {
        const dataKey = key as keyof TDashboardWidget;
        set(this, [dataKey], data[dataKey]);
      });
    });
  };

  // permissions
  get canCurrentUserDeleteWidget() {
    return this.helpers.permissions.canCurrentUserDeleteWidget;
  }

  get canCurrentUserEditWidget() {
    return this.helpers.permissions.canCurrentUserEditWidget;
  }

  // actions
  updateWidget: IDashboardWidgetInstance["updateWidget"] = async (data) => {
    const workspaceSlug = this.rootStore.workspaceRoot.currentWorkspace?.slug;
    if (!workspaceSlug || !this.id) throw new Error("Required fields not found");
    const originalWidget = { ...this.asJSON };
    try {
      // optimistically update
      this.mutateProperties(data);
      const res = await this.helpers.actions.updateWidget(this.id, data);
      return res;
    } catch (error) {
      // revert changes
      this.mutateProperties(originalWidget);
      // update loader
      console.error("Error in updating dashboard widget:", error);
      throw error;
    }
  };

  fetchWidgetData: IDashboardWidgetInstance["fetchWidgetData"] = async () => {
    const workspaceSlug = this.rootStore.workspaceRoot.currentWorkspace?.slug;
    const configurationMissing = this.isConfigurationMissing;
    if (configurationMissing) {
      return;
    }
    if (!workspaceSlug || !this.id) throw new Error("Required fields not found");
    try {
      runInAction(() => {
        this.isFetchingData = true;
      });
      // make api call
      const res = await this.helpers.actions.fetchWidgetData(this.id);
      runInAction(() => {
        this.data = res;
      });
      return res;
    } catch (error) {
      console.error("Error in fetching dashboard widget data:", error);
      throw error;
    } finally {
      runInAction(() => {
        this.isFetchingData = false;
      });
    }
  };
}
