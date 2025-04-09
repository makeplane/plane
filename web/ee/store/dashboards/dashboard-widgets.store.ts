import set from "lodash/set";
import unset from "lodash/unset";
import { action, computed, makeObservable, observable, runInAction } from "mobx";
import { computedFn } from "mobx-utils";
import { Layout, Layouts } from "react-grid-layout";
// plane imports
import {
  DEFAULT_WIDGET_CHART_TYPE_PAYLOAD,
  EWidgetChartModels,
  EWidgetChartTypes,
  EWidgetGridBreakpoints,
} from "@plane/constants";
import { TDashboardWidget, TDashboardWidgetData, TDashboardWidgetsLayoutPayload } from "@plane/types";
// plane web store
import { RootStore } from "@/plane-web/store/root.store";
import { DashboardWidgetInstance } from "./widget";

const TOTAL_COLUMNS = 4;
const NEW_WIDGET_WIDTH = 2;

type TLoader = "init-loader" | "mutation-loader" | undefined;

type Coordinates = {
  x: number;
  y: number;
};

export interface IDashboardWidgetsStore {
  // observables
  widgetsData: Record<string, DashboardWidgetInstance>;
  widgetsLoader: TLoader;
  isEditingWidget: string | null;
  isDeletingWidget: string | null;
  // grid layout helpers
  layoutItems: Layouts;
  // permissions
  canCurrentUserCreateWidget: boolean;
  // widget helpers
  allWidgetIds: string[];
  isAnyWidgetAvailable: boolean;
  getNewWidgetPayload: (chartType: EWidgetChartTypes, chartModel: EWidgetChartModels) => Partial<TDashboardWidget>;
  getWidgetById: (widgetId: string) => DashboardWidgetInstance | undefined;
  // widget actions
  fetchWidgets: () => Promise<TDashboardWidget[]>;
  fetchWidgetDetails: (widgetId: string) => Promise<TDashboardWidget>;
  createWidget: (payload: Partial<TDashboardWidget>) => Promise<TDashboardWidget>;
  deleteWidget: (widgetId: string) => Promise<void>;
  updateWidgetsLayout: (updatedWidgets: Layout[]) => Promise<void>;
  toggleEditWidget: (widgetId: string | null) => void;
  toggleDeleteWidget: (widgetId: string | null) => void;
}

export type TDashboardWidgetHelpers = {
  actions: {
    listWidgets: () => Promise<TDashboardWidget[]>;
    retrieverWidget: (widgetId: string) => Promise<TDashboardWidget>;
    createWidget: (payload: Partial<TDashboardWidget>) => Promise<TDashboardWidget>;
    updateWidget: (widgetId: string, payload: Partial<TDashboardWidget>) => Promise<TDashboardWidget>;
    updateWidgetsLayout: (payload: TDashboardWidgetsLayoutPayload[]) => Promise<void>;
    deleteWidget: (widgetId: string) => Promise<void>;
    fetchWidgetData: (widgetId: string) => Promise<TDashboardWidgetData>;
  };
  permissions: {
    canCurrentUserCreateWidget: boolean;
    canCurrentUserDeleteWidget: boolean;
    canCurrentUserEditWidget: boolean;
  };
};

const findNextAvailablePosition = (widgets: TDashboardWidget[]): Coordinates => {
  if (!widgets.length) return { x: 0, y: 0 };
  // find the last row
  const lastRow = Math.max(...widgets.map((w) => w.y_axis_coord ?? 0));
  // get widgets in the last row
  const widgetsInLastRow = widgets.filter((w) => w.y_axis_coord === lastRow);
  // find the last occupied x-coordinate in this row
  const lastOccupiedX = Math.max(...widgetsInLastRow.map((w) => (w.x_axis_coord ?? 0) + (w.width ?? 1)));
  // check if there's enough space in the current row
  const remainingColumns = TOTAL_COLUMNS - lastOccupiedX;

  if (remainingColumns >= NEW_WIDGET_WIDTH) {
    return {
      x: lastOccupiedX,
      y: lastRow,
    };
  }

  return {
    x: 0,
    y: lastRow + (widgetsInLastRow[0]?.height ?? 1),
  };
};

export class DashboardWidgetsStore implements IDashboardWidgetsStore {
  // widget observables
  widgetsData: Record<string, DashboardWidgetInstance> = {}; // widgetId => WidgetInstance
  widgetsLoader: TLoader = "init-loader";
  isEditingWidget: string | null = null;
  isDeletingWidget: string | null = null;
  // helpers
  private helpers: TDashboardWidgetHelpers;
  // root store
  private rootStore: RootStore;

  constructor(store: RootStore, helpers: TDashboardWidgetHelpers) {
    // initialize helpers
    this.helpers = helpers;
    // initialize root store
    this.rootStore = store;

    makeObservable(this, {
      // widget observables
      widgetsData: observable,
      widgetsLoader: observable.ref,
      isDeletingWidget: observable.ref,
      isEditingWidget: observable.ref,
      // widget computed
      canCurrentUserCreateWidget: computed,
      allWidgetIds: computed,
      isAnyWidgetAvailable: computed,
      nextAvailablePosition: computed,
      layoutItems: computed,
      // widget actions
      fetchWidgets: action,
      fetchWidgetDetails: action,
      createWidget: action,
      deleteWidget: action,
      updateWidgetsLayout: action,
      toggleEditWidget: action,
      toggleDeleteWidget: action,
    });
  }

  // permissions
  get canCurrentUserCreateWidget() {
    return this.helpers.permissions.canCurrentUserCreateWidget;
  }

  // widget helpers
  get allWidgetIds() {
    return Object.keys(this.widgetsData ?? {});
  }

  get isAnyWidgetAvailable() {
    return this.allWidgetIds?.length > 0;
  }

  get nextAvailablePosition() {
    return findNextAvailablePosition(Object.values(this.widgetsData ?? {}));
  }

  getNewWidgetPayload: IDashboardWidgetsStore["getNewWidgetPayload"] = (chartType, chartModel) => {
    const lastCoords = this.nextAvailablePosition;
    const chartTypeDefaultDetails = DEFAULT_WIDGET_CHART_TYPE_PAYLOAD[chartType];
    const defaultModelPayload = chartTypeDefaultDetails[chartModel];
    return {
      ...defaultModelPayload,
      chart_type: chartType,
      chart_model: chartModel,
      name: "New widget",
      x_axis_coord: lastCoords.x,
      y_axis_coord: lastCoords.y,
      width: 2,
      height: 2,
      config: {
        ...chartTypeDefaultDetails.config,
        ...defaultModelPayload?.config,
      },
    };
  };

  getWidgetById: IDashboardWidgetsStore["getWidgetById"] = computedFn((widgetId) => {
    const widgetInstance = this.widgetsData?.[widgetId];
    return widgetInstance ?? undefined;
  });

  get layoutItems() {
    const widgetDetails = (this.allWidgetIds ?? []).map((widgetId) => {
      const details = this.getWidgetById?.(widgetId);
      return {
        id: widgetId,
        x: details?.x_axis_coord ?? 0,
        y: details?.y_axis_coord ?? 0,
        width: details?.width ?? 1,
        height: details?.height ?? 1,
      };
    });

    // sort widgets by y-axis first, then x-axis for XXS layout
    const sortedWidgets = [...widgetDetails].sort((a, b) => {
      if (a.y !== b.y) {
        return a.y - b.y; // primary sort by y position
      }
      return a.x - b.x; // secondary sort by x position when y is the same
    });

    const layouts: Layouts = {
      [EWidgetGridBreakpoints.XXS]: sortedWidgets.map((widget, index) => ({
        i: widget.id,
        x: 0,
        y: index * 2,
        w: 1,
        h: 2,
        resizeHandles: [],
      })),
      [EWidgetGridBreakpoints.MD]: widgetDetails.map((widget) => ({
        i: widget.id,
        x: widget.x,
        y: widget.y,
        w: widget.width,
        h: widget.height,
        resizeHandles: ["nw", "ne", "se", "sw"],
      })),
    };

    return layouts;
  }

  // widget actions
  fetchWidgets: IDashboardWidgetsStore["fetchWidgets"] = async () => {
    const workspaceSlug = this.rootStore.workspaceRoot.currentWorkspace?.slug;
    if (!workspaceSlug) throw new Error("workspaceSlug not found");
    try {
      // update loader
      if (this.isAnyWidgetAvailable) {
        this.widgetsLoader = "mutation-loader";
      } else {
        this.widgetsLoader = "init-loader";
      }
      // make api call
      const res = await this.helpers.actions.listWidgets();
      if (!res) throw new Error("No response found");
      // update observable
      runInAction(() => {
        for (const widget of res) {
          if (widget.id) {
            if (this.widgetsData[widget.id]) {
              this.widgetsData[widget.id].mutateProperties(widget);
            } else {
              set(this.widgetsData, [widget.id], new DashboardWidgetInstance(this.rootStore, widget, this.helpers));
            }
          }
        }
      });
      // update loader
      this.widgetsLoader = undefined;
      return res;
    } catch (error) {
      // update loader
      this.widgetsLoader = undefined;
      console.error("Error in fetching dashboard widgets:", error);
      throw error;
    }
  };

  fetchWidgetDetails: IDashboardWidgetsStore["fetchWidgetDetails"] = async (widgetId) => {
    const workspaceSlug = this.rootStore.workspaceRoot.currentWorkspace?.slug;
    if (!workspaceSlug) throw new Error("Required fields not found");
    try {
      // make api call
      const res = await this.helpers.actions.retrieverWidget(widgetId);
      if (!res) throw new Error("No response found");
      // update observable
      runInAction(() => {
        if (this.widgetsData[widgetId]) {
          this.widgetsData[widgetId].mutateProperties(res);
        } else {
          set(this.widgetsData, [widgetId], new DashboardWidgetInstance(this.rootStore, res, this.helpers));
        }
      });
      return res;
    } catch (error) {
      console.error("Error in fetching dashboard widget details:", error);
      throw error;
    }
  };

  createWidget: IDashboardWidgetsStore["createWidget"] = async (payload) => {
    const workspaceSlug = this.rootStore.workspaceRoot.currentWorkspace?.slug;
    if (!workspaceSlug) throw new Error("Required fields not found");
    try {
      // make api call
      const res = await this.helpers.actions.createWidget(payload);
      const resId = res.id;
      if (!res || !resId) throw new Error("No response found");
      // update observable
      runInAction(() => {
        set(this.widgetsData, [resId], new DashboardWidgetInstance(this.rootStore, res, this.helpers));
      });
      return res;
    } catch (error) {
      console.error("Error in creating dashboard widget:", error);
      throw error;
    }
  };

  deleteWidget: IDashboardWidgetsStore["deleteWidget"] = async (widgetId) => {
    const workspaceSlug = this.rootStore.workspaceRoot.currentWorkspace?.slug;
    if (!workspaceSlug) throw new Error("Required fields not found");
    try {
      // make api call
      await this.helpers.actions.deleteWidget(widgetId);
      // update observable
      runInAction(() => {
        unset(this.widgetsData, widgetId);
      });
    } catch (error) {
      console.error("Error in deleting dashboard widget:", error);
      throw error;
    }
  };

  updateWidgetsLayout: IDashboardWidgetsStore["updateWidgetsLayout"] = async (updatedWidgets) => {
    if (!updatedWidgets.length) return;
    const originalWidgets: TDashboardWidgetsLayoutPayload[] = [];
    try {
      const widgetsToUpdate: (TDashboardWidgetsLayoutPayload | null)[] = updatedWidgets.map((layout) => {
        const widgetId = layout.i;
        const widgetInstance = this.getWidgetById(widgetId);
        if (!widgetInstance) return null;
        return {
          id: widgetId,
          x_axis_coord: layout.x,
          y_axis_coord: layout.y,
          width: layout.w,
          height: layout.h,
        };
      });
      const filteredWidgets = widgetsToUpdate.filter((w): w is TDashboardWidgetsLayoutPayload => w !== null);
      if (!filteredWidgets.length) return;
      // optimistic update
      runInAction(() => {
        filteredWidgets.forEach((widget) => {
          const widgetInstance = this.getWidgetById(widget.id ?? "");
          if (widgetInstance) {
            originalWidgets.push({
              id: widget.id,
              x_axis_coord: widgetInstance.x_axis_coord,
              y_axis_coord: widgetInstance.y_axis_coord,
              height: widgetInstance.height,
              width: widgetInstance.width,
            });
            widgetInstance.mutateProperties(widget);
          }
        });
      });
      await this.helpers.actions.updateWidgetsLayout(filteredWidgets);
    } catch (error) {
      console.error("Error in updating widgets layout:", error);
      // revert optimistic update
      runInAction(() => {
        originalWidgets.forEach((widget) => {
          const widgetInstance = this.getWidgetById(widget.id ?? "");
          if (widgetInstance) {
            widgetInstance.mutateProperties(widget);
          }
        });
      });
      throw error;
    }
  };

  toggleEditWidget: IDashboardWidgetsStore["toggleEditWidget"] = (widgetId) => {
    runInAction(() => {
      this.isEditingWidget = widgetId;
    });
  };

  toggleDeleteWidget: IDashboardWidgetsStore["toggleDeleteWidget"] = (widgetId) => {
    runInAction(() => {
      this.isDeletingWidget = widgetId;
    });
  };
}
