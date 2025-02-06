import set from "lodash/set";
import unset from "lodash/unset";
import { action, computed, makeObservable, observable, runInAction } from "mobx";
import { computedFn } from "mobx-utils";
// plane services
import { WorkspaceDashboardsService } from "@plane/services";
// plane types
import { TWorkspaceDashboard } from "@plane/types";
// plane web constants
import { EUserPermissions } from "@/plane-web/constants";
// plane web store
import { RootStore } from "@/plane-web/store/root.store";
import { IWorkspaceDashboardInstance, WorkspaceDashboardInstance } from "./dashboard";

type TLoader = "init-loader" | "mutation-loader" | undefined;

type TModalPayload = (Partial<TWorkspaceDashboard> & { id: string }) | null;

export interface IWorkspaceDashboardsStore {
  // observables
  loader: TLoader;
  data: Record<string, WorkspaceDashboardInstance>;
  // modal data
  isCreateUpdateModalOpen: boolean;
  createUpdateModalPayload: TModalPayload;
  // helpers
  isAnyDashboardAvailable: boolean;
  currentWorkspaceDashboardIds: string[];
  getDashboardById: (dashboardId: string) => IWorkspaceDashboardInstance | undefined;
  toggleCreateUpdateModal: (status?: boolean) => void;
  updateCreateUpdateModalPayload: (payload: TModalPayload) => void;
  // permissions
  canCurrentUserCreateDashboard: boolean;
  canCurrentUserDeleteDashboard: boolean;
  // actions
  fetchDashboards: () => Promise<TWorkspaceDashboard[]>;
  fetchDashboardDetails: (dashboardId: string) => Promise<TWorkspaceDashboard>;
  createDashboard: (data: Partial<TWorkspaceDashboard>) => Promise<TWorkspaceDashboard>;
  deleteDashboard: (dashboardId: string) => Promise<void>;
}

export class WorkspaceDashboardsStore implements IWorkspaceDashboardsStore {
  // observables
  loader: TLoader = "init-loader";
  data: Record<string, WorkspaceDashboardInstance> = {}; // dashboardId => DashboardInstance
  // modal data
  isCreateUpdateModalOpen: boolean = false;
  createUpdateModalPayload: TModalPayload = null;
  // service
  service: WorkspaceDashboardsService;
  // root store
  rootStore: RootStore;

  constructor(store: RootStore) {
    makeObservable(this, {
      // observables
      loader: observable.ref,
      isCreateUpdateModalOpen: observable.ref,
      createUpdateModalPayload: observable.ref,
      data: observable,
      // computed
      isAnyDashboardAvailable: computed,
      currentWorkspaceDashboardIds: computed,
      currentUserWorkspaceRole: computed,
      canCurrentUserCreateDashboard: computed,
      canCurrentUserDeleteDashboard: computed,
      // actions
      toggleCreateUpdateModal: action,
      updateCreateUpdateModalPayload: action,
    });
    // initialize service
    this.service = new WorkspaceDashboardsService();
    // initialize root store
    this.rootStore = store;
  }

  get isAnyDashboardAvailable() {
    return Object.values(this.data ?? {}).length > 0;
  }

  get currentWorkspaceDashboardIds() {
    return Object.keys(this.data ?? {});
  }

  getDashboardById: IWorkspaceDashboardsStore["getDashboardById"] = computedFn((dashboardId) => {
    const dashboardInstance = this.data[dashboardId];
    return dashboardInstance ?? undefined;
  });

  // permissions
  get currentUserWorkspaceRole(): EUserPermissions {
    const currentWorkspaceSlug = this.rootStore.workspaceRoot.currentWorkspace?.slug;
    const currentWorkspaceRole = this.rootStore.user.permission.workspaceInfoBySlug(currentWorkspaceSlug ?? "")
      ?.role as EUserPermissions;
    return currentWorkspaceRole ?? EUserPermissions.GUEST;
  }

  get canCurrentUserCreateDashboard() {
    return this.currentUserWorkspaceRole >= EUserPermissions.MEMBER;
  }

  get canCurrentUserDeleteDashboard() {
    return this.currentUserWorkspaceRole >= EUserPermissions.MEMBER;
  }

  // dashboard crud
  fetchDashboards: IWorkspaceDashboardsStore["fetchDashboards"] = async () => {
    const workspaceSlug = this.rootStore.workspaceRoot.currentWorkspace?.slug;
    if (!workspaceSlug) throw new Error("workspaceSlug not found");
    try {
      // update loader
      if (this.isAnyDashboardAvailable) {
        this.loader = "mutation-loader";
      } else {
        this.loader = "init-loader";
      }
      // make api call
      const res = await this.service.list(workspaceSlug);
      if (!res) throw new Error("No response found");
      // update observable
      runInAction(() => {
        for (const dashboard of res) {
          if (dashboard.id) set(this.data, [dashboard.id], new WorkspaceDashboardInstance(this.rootStore, dashboard));
        }
      });
      // update loader
      this.loader = undefined;
      return res;
    } catch (error) {
      // update loader
      this.loader = undefined;
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
        if (this.data[dashboardId]) {
          this.data[dashboardId].mutateProperties(res);
        } else {
          set(this.data, [dashboardId], new WorkspaceDashboardInstance(this.rootStore, res));
        }
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
        set(this.data, [resId], new WorkspaceDashboardInstance(this.rootStore, res));
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
        unset(this.data, [dashboardId]);
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
}
