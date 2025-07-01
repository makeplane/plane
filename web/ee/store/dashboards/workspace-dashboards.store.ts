import { action, computed, makeObservable, observable, runInAction } from "mobx";
// plane imports
import { EUserPermissions } from "@plane/constants";
import { WorkspaceDashboardsService } from "@plane/services";
import { EUserWorkspaceRoles, TDashboard } from "@plane/types";
// plane web store
import { RootStore } from "@/plane-web/store/root.store";
import { BaseDashboardsStore } from "./base-dashboards.store";

type TModalPayload = (Partial<TDashboard> & { id: string }) | null;

export interface IWorkspaceDashboardsStore {
  // observables
  fetchStatus: Record<string, boolean>;
  searchQuery: string;
  // modal data
  isCreateUpdateModalOpen: boolean;
  createUpdateModalPayload: TModalPayload;
  // helpers
  currentWorkspaceFetchStatus: boolean;
  isAnyDashboardAvailable: boolean;
  currentWorkspaceDashboardIds: string[];
  currentWorkspaceFilteredDashboardIds: string[];
  toggleCreateUpdateModal: (status?: boolean) => void;
  updateCreateUpdateModalPayload: (payload: TModalPayload) => void;
  // permissions
  canCurrentUserCreateDashboard: boolean;
  // actions
  fetchDashboards: () => Promise<TDashboard[]>;
  fetchDashboardDetails: (dashboardId: string) => Promise<TDashboard>;
  createDashboard: (data: Partial<TDashboard>) => Promise<TDashboard>;
  deleteDashboard: (dashboardId: string) => Promise<void>;
  updateSearchQuery: (query: string) => void;
}

export class WorkspaceDashboardsStore implements IWorkspaceDashboardsStore {
  // observables
  fetchStatus: Record<string, boolean> = {};
  searchQuery: string = "";
  // modal data
  isCreateUpdateModalOpen: boolean = false;
  createUpdateModalPayload: TModalPayload = null;
  // service
  service: WorkspaceDashboardsService;
  // root store
  baseStore: BaseDashboardsStore;
  rootStore: RootStore;

  constructor(baseStore: BaseDashboardsStore, rootStore: RootStore) {
    makeObservable(this, {
      // observables
      fetchStatus: observable,
      searchQuery: observable.ref,
      isCreateUpdateModalOpen: observable.ref,
      createUpdateModalPayload: observable.ref,
      // computed
      currentWorkspaceFetchStatus: computed,
      isAnyDashboardAvailable: computed,
      currentWorkspaceDashboardIds: computed,
      currentWorkspaceFilteredDashboardIds: computed,
      currentUserWorkspaceRole: computed,
      canCurrentUserCreateDashboard: computed,
      // actions
      toggleCreateUpdateModal: action,
      updateCreateUpdateModalPayload: action,
      updateSearchQuery: action,
    });
    // initialize service
    this.service = new WorkspaceDashboardsService();
    // initialize root store
    this.baseStore = baseStore;
    this.rootStore = rootStore;
  }

  private addDashboardToStore = (workspaceSlug: string, dashboardId: string, dashboard: TDashboard) => {
    const currentUser = this.rootStore.user.data;
    const currentUserWorkspaceRole = this.rootStore.user.permission.getWorkspaceRoleByWorkspaceSlug(workspaceSlug);
    this.baseStore.addDashboard(dashboard, "workspace", {
      dashboard: {
        actions: {
          update: async (payload) => await this.service.update(workspaceSlug, dashboardId, payload),
        },
        permissions: {
          canCurrentUserEditDashboard:
            currentUser?.id === dashboard.created_by || currentUserWorkspaceRole === EUserWorkspaceRoles.ADMIN,
          canCurrentUserFavoriteDashboard:
            currentUser?.id === dashboard.created_by || currentUserWorkspaceRole === EUserWorkspaceRoles.ADMIN,
          canCurrentUserDeleteDashboard:
            currentUser?.id === dashboard.created_by || currentUserWorkspaceRole === EUserWorkspaceRoles.ADMIN,
        },
      },
      widget: {
        actions: {
          listWidgets: async () => await this.service.listWidgets(workspaceSlug, dashboardId),
          retrieverWidget: async (widgetId) => await this.service.retrieveWidget(workspaceSlug, dashboardId, widgetId),
          createWidget: async (payload) => await this.service.createWidget(workspaceSlug, dashboardId, payload),
          updateWidget: async (widgetId, payload) =>
            await this.service.updateWidget(workspaceSlug, dashboardId, widgetId, payload),
          updateWidgetsLayout: async (payload) =>
            await this.service.updateWidgetsLayout(workspaceSlug, dashboardId, payload),
          deleteWidget: async (widgetId) => await this.service.destroyWidget(workspaceSlug, dashboardId, widgetId),
          fetchWidgetData: async (widgetId) =>
            await this.service.retrieveWidgetData(workspaceSlug, dashboardId, widgetId),
        },
        permissions: {
          canCurrentUserCreateWidget:
            currentUser?.id === dashboard.created_by || currentUserWorkspaceRole === EUserWorkspaceRoles.ADMIN,
          canCurrentUserDeleteWidget:
            currentUser?.id === dashboard.created_by || currentUserWorkspaceRole === EUserWorkspaceRoles.ADMIN,
          canCurrentUserEditWidget:
            currentUser?.id === dashboard.created_by || currentUserWorkspaceRole === EUserWorkspaceRoles.ADMIN,
        },
      },
    });
  };

  get currentWorkspaceFetchStatus() {
    const workspaceSlug = this.rootStore.workspaceRoot.currentWorkspace?.slug;
    if (!workspaceSlug) return false;
    return this.fetchStatus[workspaceSlug] ?? false;
  }

  get currentWorkspaceDashboardIds() {
    const { currentWorkspace } = this.rootStore.workspaceRoot;
    if (!currentWorkspace) return [];
    const allWorkspaceDashboards = this.baseStore.getAllDashboardsByLevel("workspace");
    const filteredWorkspaceDashboards = allWorkspaceDashboards.filter((d) => d.workspace === currentWorkspace.id);
    return filteredWorkspaceDashboards.map((d) => d.id ?? "");
  }

  get currentWorkspaceFilteredDashboardIds() {
    const { currentWorkspace } = this.rootStore.workspaceRoot;
    if (!currentWorkspace) return [];
    const allWorkspaceDashboards = this.baseStore.getAllDashboardsByLevel("workspace");
    const filteredWorkspaceDashboards = allWorkspaceDashboards.filter(
      (d) => d.workspace === currentWorkspace.id && d.name?.toLowerCase().includes(this.searchQuery.toLowerCase())
    );
    return filteredWorkspaceDashboards.map((d) => d.id ?? "");
  }

  get isAnyDashboardAvailable() {
    return this.currentWorkspaceDashboardIds.length > 0;
  }

  // permissions
  get currentUserWorkspaceRole(): EUserPermissions {
    const currentWorkspaceSlug = this.rootStore.workspaceRoot.currentWorkspace?.slug;
    const currentWorkspaceRole = currentWorkspaceSlug
      ? this.rootStore.user.permission.getWorkspaceRoleByWorkspaceSlug(currentWorkspaceSlug)
      : EUserPermissions.GUEST;
    return currentWorkspaceRole as EUserPermissions;
  }

  get canCurrentUserCreateDashboard() {
    return this.currentUserWorkspaceRole === EUserPermissions.ADMIN;
  }

  // dashboard crud
  fetchDashboards: IWorkspaceDashboardsStore["fetchDashboards"] = async () => {
    const workspaceSlug = this.rootStore.workspaceRoot.currentWorkspace?.slug;
    if (!workspaceSlug) throw new Error("workspaceSlug not found");
    try {
      // make api call
      const res = await this.service.list(workspaceSlug);
      if (!res) throw new Error("No response found");
      // update observable
      runInAction(() => {
        for (const dashboard of res) {
          if (dashboard.id) {
            const existingInstance = this.baseStore.getDashboardById(dashboard.id);
            if (existingInstance) {
              existingInstance.mutateProperties(dashboard);
            } else {
              this.addDashboardToStore(workspaceSlug, dashboard.id, dashboard);
            }
          }
        }
        this.fetchStatus[workspaceSlug] = true;
      });
      return res;
    } catch (error) {
      console.error("Error in fetching workspace dashboards:", error);
      throw error;
    }
  };

  fetchDashboardDetails: IWorkspaceDashboardsStore["fetchDashboardDetails"] = async (dashboardId) => {
    const workspaceSlug = this.rootStore.workspaceRoot.currentWorkspace?.slug;
    if (!workspaceSlug) throw new Error("workspaceSlug not found");
    try {
      // make api call
      const res = await this.service.retrieve(workspaceSlug, dashboardId);
      if (!res) throw new Error("No response found");
      // update observable
      runInAction(() => {
        const existingDashboard = this.baseStore.getDashboardById(dashboardId);
        if (existingDashboard) {
          existingDashboard.mutateProperties(res);
        } else {
          this.addDashboardToStore(workspaceSlug, res.id ?? "", res);
        }
        this.fetchStatus[workspaceSlug] = true;
      });
      return res;
    } catch (error) {
      console.error("Error in fetching workspace dashboard details:", error);
      throw error;
    }
  };

  createDashboard: IWorkspaceDashboardsStore["createDashboard"] = async (data) => {
    const workspaceSlug = this.rootStore.workspaceRoot.currentWorkspace?.slug;
    if (!workspaceSlug) throw new Error("workspaceSlug not found");
    try {
      // make api call
      const res = await this.service.create(workspaceSlug, data);
      const resId = res.id;
      if (!res || !resId) throw new Error("No response found");
      // update observable
      runInAction(() => {
        this.addDashboardToStore(workspaceSlug, resId, res);
      });
      return res;
    } catch (error) {
      console.error("Error in creating workspace dashboard:", error);
      throw error;
    }
  };

  deleteDashboard: IWorkspaceDashboardsStore["deleteDashboard"] = async (dashboardId) => {
    const workspaceSlug = this.rootStore.workspaceRoot.currentWorkspace?.slug;
    if (!workspaceSlug) throw new Error("workspaceSlug not found");
    try {
      // make api call
      await this.service.destroy(workspaceSlug, dashboardId);
      // update observable
      runInAction(() => {
        this.baseStore.removeDashboard(dashboardId);
      });
    } catch (error) {
      console.error("Error in deleting workspace dashboard:", error);
      throw error;
    }
  };

  // modal helpers
  toggleCreateUpdateModal: IWorkspaceDashboardsStore["toggleCreateUpdateModal"] = (status) => {
    if (status === undefined) {
      runInAction(() => {
        this.isCreateUpdateModalOpen = !this.isCreateUpdateModalOpen;
      });
    } else {
      runInAction(() => {
        this.isCreateUpdateModalOpen = status;
      });
    }
  };

  updateCreateUpdateModalPayload: IWorkspaceDashboardsStore["updateCreateUpdateModalPayload"] = (payload) => {
    runInAction(() => {
      this.createUpdateModalPayload = payload;
    });
  };

  updateSearchQuery: IWorkspaceDashboardsStore["updateSearchQuery"] = (query) => {
    runInAction(() => {
      this.searchQuery = query;
    });
  };
}
