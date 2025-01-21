import orderBy from "lodash/orderBy";
import set from "lodash/set";
import { action, computed, makeObservable, observable, runInAction } from "mobx";
import { THomeWidgetKeys, TWidgetEntityData } from "@plane/types";
import { WorkspaceService } from "@/plane-web/services";
import { IWorkspaceLinkStore, WorkspaceLinkStore } from "./link.store";

export interface IHomeStore {
  // observables
  showWidgetSettings: boolean;
  widgetsMap: Record<string, TWidgetEntityData>;
  widgets: THomeWidgetKeys[];
  // computed
  isAnyWidgetEnabled: boolean;
  orderedWidgets: THomeWidgetKeys[];
  //stores
  quickLinks: IWorkspaceLinkStore;
  // actions
  toggleWidgetSettings: (value?: boolean) => void;
  fetchWidgets: (workspaceSlug: string) => Promise<void>;
  reorderWidget: (workspaceSlug: string, widgetKey: string, destinationId: string, edge: string | undefined) => void;
  toggleWidget: (workspaceSlug: string, widgetKey: string, is_enabled: boolean) => void;
}

export class HomeStore implements IHomeStore {
  // observables
  showWidgetSettings = false;
  widgetsMap: Record<string, TWidgetEntityData> = {};
  widgets: THomeWidgetKeys[] = [];
  // stores
  quickLinks: IWorkspaceLinkStore;
  // services
  workspaceService: WorkspaceService;

  constructor() {
    makeObservable(this, {
      // observables
      showWidgetSettings: observable,
      widgetsMap: observable,
      widgets: observable,
      // computed
      isAnyWidgetEnabled: computed,
      orderedWidgets: computed,
      // actions
      toggleWidgetSettings: action,
      fetchWidgets: action,
      reorderWidget: action,
      toggleWidget: action,
    });
    // services
    this.workspaceService = new WorkspaceService();

    // stores
    this.quickLinks = new WorkspaceLinkStore();
  }

  get isAnyWidgetEnabled() {
    return Object.values(this.widgetsMap).some((widget) => widget.is_enabled);
  }

  get orderedWidgets() {
    return orderBy(Object.values(this.widgetsMap), "sort_order", "desc").map((widget) => widget.key);
  }

  toggleWidgetSettings = (value?: boolean) => {
    this.showWidgetSettings = value !== undefined ? value : !this.showWidgetSettings;
  };

  fetchWidgets = async (workspaceSlug: string) => {
    try {
      const widgets = await this.workspaceService.fetchWorkspaceWidgets(workspaceSlug);
      runInAction(() => {
        this.widgets = orderBy(Object.values(widgets), "sort_order", "desc").map((widget) => widget.key);
        widgets.forEach((widget) => {
          this.widgetsMap[widget.key] = widget;
        });
      });
    } catch (error) {
      console.error("Failed to fetch widgets");
      throw error;
    }
  };

  toggleWidget = async (workspaceSlug: string, widgetKey: string, is_enabled: boolean) => {
    try {
      await this.workspaceService.updateWorkspaceWidget(workspaceSlug, widgetKey, {
        is_enabled,
      });
      runInAction(() => {
        this.widgetsMap[widgetKey].is_enabled = is_enabled;
      });
    } catch (error) {
      console.error("Failed to toggle widget");
      throw error;
    }
  };

  reorderWidget = async (workspaceSlug: string, widgetKey: string, destinationId: string, edge: string | undefined) => {
    try {
      let resultSequence = 10000;
      if (edge) {
        const sortedIds = orderBy(Object.values(this.widgetsMap), "sort_order", "desc").map((widget) => widget.key);
        const destinationSequence = this.widgetsMap[destinationId]?.sort_order || undefined;
        if (destinationSequence) {
          const destinationIndex = sortedIds.findIndex((id) => id === destinationId);
          if (edge === "reorder-above") {
            const prevSequence = this.widgetsMap[sortedIds[destinationIndex - 1]]?.sort_order || undefined;
            if (prevSequence) {
              resultSequence = (destinationSequence + prevSequence) / 2;
            } else {
              resultSequence = destinationSequence + resultSequence;
            }
          } else {
            resultSequence = destinationSequence - resultSequence;
          }
        }
      }
      await this.workspaceService.updateWorkspaceWidget(workspaceSlug, widgetKey, {
        sort_order: resultSequence,
      });
      runInAction(() => {
        set(this.widgetsMap, [widgetKey, "sort_order"], resultSequence);
      });
    } catch (error) {
      console.error("Failed to move widget");
      throw error;
    }
  };
}
