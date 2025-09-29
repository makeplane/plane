import { set } from "lodash-es";
import { action, computed, makeObservable, observable, runInAction } from "mobx";
import { computedFn } from "mobx-utils";
// plane types
import { TDashboard, TDashboardLevel, TLogoProps } from "@plane/types";
// plane web store
import { RootStore } from "@/plane-web/store/root.store";
import { DashboardWidgetsStore, IDashboardWidgetsStore, TDashboardWidgetHelpers } from "./dashboard-widgets.store";

export interface IDashboardInstance extends TDashboard {
  // observables
  viewModeToggle: boolean;
  dashboardLevel: TDashboardLevel;
  // permissions
  canCurrentUserEditDashboard: boolean;
  canCurrentUserFavoriteDashboard: boolean;
  canCurrentUserDeleteDashboard: boolean;
  // helpers
  asJSON: TDashboard;
  getRedirectionLink: () => string;
  mutateProperties: (data: Partial<TDashboard>) => void;
  isViewModeEnabled: boolean;
  // actions
  updateDashboard: (data: Partial<TDashboard>) => Promise<TDashboard>;
  toggleViewingMode: (status?: boolean) => void;
  addToFavorites: () => Promise<void>;
  removeFromFavorites: () => Promise<void>;
  // sub-stores
  widgetsStore: IDashboardWidgetsStore;
}

type TDashboardHelpers = {
  actions: {
    update: (payload: Partial<TDashboard>) => Promise<TDashboard>;
  };
  permissions: {
    canCurrentUserEditDashboard: boolean;
    canCurrentUserFavoriteDashboard: boolean;
    canCurrentUserDeleteDashboard: boolean;
  };
};

export type TDashboardCombinedHelpers = {
  dashboard: TDashboardHelpers;
  widget: TDashboardWidgetHelpers;
};

export class DashboardInstance implements IDashboardInstance {
  // observables
  dashboardLevel: TDashboardLevel;
  viewModeToggle: boolean = true;
  // dashboard properties
  created_at: Date | undefined;
  created_by: string | undefined;
  id: string | undefined;
  is_favorite: boolean | undefined;
  logo_props: TLogoProps | undefined;
  name: string | undefined;
  owned_by: string | undefined;
  project_ids: string[] | undefined;
  updated_at: Date | undefined;
  updated_by: string | undefined;
  workspace: string | undefined;
  // actions
  private helpers: TDashboardHelpers;
  // root store
  private rootStore: RootStore;
  // sub-store
  widgetsStore: IDashboardWidgetsStore;

  constructor(
    store: RootStore,
    dashboard: TDashboard,
    dashboardLevel: TDashboardLevel,
    combinedHelpers: TDashboardCombinedHelpers
  ) {
    // initialize dashboard level
    this.dashboardLevel = dashboardLevel;
    // initialize dashboard properties
    this.created_at = dashboard.created_at;
    this.created_by = dashboard.created_by;
    this.id = dashboard.id;
    this.is_favorite = dashboard.is_favorite;
    this.logo_props = dashboard.logo_props;
    this.name = dashboard.name;
    this.owned_by = dashboard.owned_by;
    this.project_ids = dashboard.project_ids;
    this.updated_at = dashboard.updated_at;
    this.updated_by = dashboard.updated_by;
    this.workspace = dashboard.workspace;
    // initialize helpers
    this.helpers = combinedHelpers.dashboard;
    // initialize root store
    this.rootStore = store;
    // initialize sub-store
    this.widgetsStore = new DashboardWidgetsStore(store, combinedHelpers.widget);

    makeObservable(this, {
      // observables
      dashboardLevel: observable.ref,
      viewModeToggle: observable.ref,
      created_at: observable.ref,
      created_by: observable.ref,
      id: observable.ref,
      is_favorite: observable.ref,
      logo_props: observable,
      name: observable.ref,
      owned_by: observable.ref,
      project_ids: observable,
      updated_at: observable.ref,
      updated_by: observable.ref,
      workspace: observable.ref,
      // computed
      canCurrentUserEditDashboard: computed,
      canCurrentUserFavoriteDashboard: computed,
      canCurrentUserDeleteDashboard: computed,
      asJSON: computed,
      isViewModeEnabled: computed,
      // actions
      mutateProperties: action,
      updateDashboard: action,
      toggleViewingMode: action,
      addToFavorites: action,
      removeFromFavorites: action,
    });
  }

  // permissions
  get canCurrentUserEditDashboard() {
    return this.helpers.permissions.canCurrentUserEditDashboard;
  }

  get canCurrentUserFavoriteDashboard() {
    return this.helpers.permissions.canCurrentUserFavoriteDashboard;
  }

  get canCurrentUserDeleteDashboard() {
    return this.helpers.permissions.canCurrentUserDeleteDashboard;
  }

  // helpers
  get asJSON() {
    return {
      created_at: this.created_at,
      created_by: this.created_by,
      id: this.id,
      is_favorite: this.is_favorite,
      logo_props: this.logo_props,
      name: this.name,
      owned_by: this.owned_by,
      project_ids: this.project_ids,
      updated_at: this.updated_at,
      updated_by: this.updated_by,
      workspace: this.workspace,
    };
  }

  get isViewModeEnabled() {
    return !this.canCurrentUserEditDashboard || this.viewModeToggle;
  }

  getRedirectionLink: IDashboardInstance["getRedirectionLink"] = computedFn(() => {
    const currentWorkspaceSlug = this.rootStore.workspaceRoot.currentWorkspace?.slug;
    return `/${currentWorkspaceSlug}/dashboards/${this.id}`;
  });

  mutateProperties: IDashboardInstance["mutateProperties"] = (data) => {
    runInAction(() => {
      Object.keys(data).map((key) => {
        const dataKey = key as keyof TDashboard;
        set(this, [dataKey], data[dataKey]);
      });
    });
  };

  updateDashboard: IDashboardInstance["updateDashboard"] = async (data) => {
    const workspaceSlug = this.rootStore.workspaceRoot.currentWorkspace?.slug;
    if (!workspaceSlug || !this.id) throw new Error("Required fields not found");
    const originalPage = { ...this.asJSON };
    try {
      // optimistically update
      this.mutateProperties(data);
      const res = await this.helpers.actions.update(data);
      return res;
    } catch (error) {
      // revert changes
      this.mutateProperties(originalPage);
      // update loader
      console.error("Error in updating dashboard:", error);
      throw error;
    }
  };

  toggleViewingMode: IDashboardInstance["toggleViewingMode"] = (status) => {
    const updatedStatus = status === undefined ? !this.viewModeToggle : status;
    runInAction(() => {
      this.viewModeToggle = updatedStatus;
      if (updatedStatus) {
        this.widgetsStore.toggleDeleteWidget(null);
        this.widgetsStore.toggleEditWidget(null);
      }
    });
  };

  addToFavorites: IDashboardInstance["addToFavorites"] = async () => {
    const { workspaceSlug } = this.rootStore.router;
    if (!workspaceSlug || !this.id) return undefined;

    const isDashboardFavorite = this.is_favorite;

    runInAction(() => {
      this.is_favorite = true;
    });

    await this.rootStore.favorite
      .addFavorite(workspaceSlug.toString(), {
        entity_type: this.dashboardLevel === "workspace" ? "workspace_dashboard" : "dashboard",
        entity_identifier: this.id,
        entity_data: { name: this.name || "" },
      })
      .catch((error) => {
        runInAction(() => {
          this.is_favorite = isDashboardFavorite;
        });
        throw error;
      });
  };

  removeFromFavorites: IDashboardInstance["removeFromFavorites"] = async () => {
    const { workspaceSlug } = this.rootStore.router;
    if (!workspaceSlug || !this.id) return undefined;
    const isDashboardFavorite = this.is_favorite;

    runInAction(() => {
      this.is_favorite = false;
    });

    await this.rootStore.favorite.removeFavoriteEntity(workspaceSlug, this.id).catch((error) => {
      runInAction(() => {
        this.is_favorite = isDashboardFavorite;
      });
      throw error;
    });
  };
}
