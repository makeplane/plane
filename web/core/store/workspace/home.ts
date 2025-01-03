import { action, makeObservable, observable, runInAction } from "mobx";
import { IWorkspaceLinkStore, WorkspaceLinkStore } from "./link.store";
import { WorkspaceService } from "@/plane-web/services";

export interface IHomeStore {
  // observables
  showWidgetSettings: boolean;
  widgetsMap: Record<string, any>;
  //stores
  quickLinks: IWorkspaceLinkStore;
  // actions
  toggleWidgetSettings: (value?: boolean) => void;
  reorderWidgets: (workspaceSlug: string, widgetId: string, destinationId: string, edge: string | undefined) => void;
}

export class HomeStore implements IHomeStore {
  // observables
  showWidgetSettings = false;
  widgetsMap: Record<string, any> = {};
  // stores
  quickLinks: IWorkspaceLinkStore;
  // services
  workspaceService: WorkspaceService;

  constructor() {
    makeObservable(this, {
      // observables
      showWidgetSettings: observable,
      widgetsMap: observable,
      // actions
      toggleWidgetSettings: action,
      reorderWidgets: action,
    });
    // services
    this.workspaceService = new WorkspaceService();

    // stores
    this.quickLinks = new WorkspaceLinkStore();
  }

  toggleWidgetSettings = (value?: boolean) => {
    this.showWidgetSettings = value !== undefined ? value : !this.showWidgetSettings;
  };

  reorderWidgets = async (workspaceSlug: string, widgetId: string, destinationId: string, edge: string | undefined) => {
    // try {
    //   let resultSequence = 10000;
    //   if (edge) {
    //     const sortedIds = orderBy(Object.values(this.favoriteMap), "sequence", "desc").map((fav) => fav.id);
    //     const destinationSequence = this.favoriteMap[destinationId]?.sequence || undefined;
    //     if (destinationSequence) {
    //       const destinationIndex = sortedIds.findIndex((id) => id === destinationId);
    //       if (edge === "reorder-above") {
    //         const prevSequence = this.favoriteMap[sortedIds[destinationIndex - 1]]?.sequence || undefined;
    //         if (prevSequence) {
    //           resultSequence = (destinationSequence + prevSequence) / 2;
    //         } else {
    //           resultSequence = destinationSequence + resultSequence;
    //         }
    //       } else {
    //         resultSequence = destinationSequence - resultSequence;
    //       }
    //     }
    //   }
    //   await this.dashboardService.updateDashboardWidget(workspaceSlug, dashboardId, widgetId, {
    //     sequence: resultSequence,
    //   });
    //   runInAction(() => {
    //     set(this.favoriteMap, [favoriteId, "sequence"], resultSequence);
    //   });
    // } catch (error) {
    //   console.error("Failed to move favorite folder");
    //   throw error;
    // }
  };

  //   fetchRecentActivity = async (workspaceSlug: string) => {
  //     try {
  //       const response = await this.workspaceService.fetchWorkspaceRecents(workspaceSlug);
  //     } catch (error) {
  //       console.error("Failed to fetch recent activity");
  //       throw error;
  //     }
  //   };
}
