import set from "lodash/set";
import unset from "lodash/unset";
import { computed, makeObservable, observable, runInAction } from "mobx";
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

export interface IWorkspaceDashboardsStore {
  // observables
  loader: TLoader;
  data: Record<string, WorkspaceDashboardInstance>;
  // helpers
  isAnyDashboardAvailable: boolean;
  getDashboardById: (dashboardId: string) => IWorkspaceDashboardInstance | undefined;
  // permissions
  canCurrentUserCreateDashboard: boolean;
  canCurrentUserDeleteDashboard: boolean;
  // actions
  fetchDashboards: (workspaceSlug: string) => Promise<TWorkspaceDashboard[]>;
  fetchDashboardDetails: (workspaceSlug: string, dashboardId: string) => Promise<TWorkspaceDashboard>;
  createDashboard: (workspaceSlug: string, data: Partial<TWorkspaceDashboard>) => Promise<TWorkspaceDashboard>;
  deleteDashboard: (workspaceSlug: string, dashboardId: string) => Promise<void>;
}

export class WorkspaceDashboardsStore implements IWorkspaceDashboardsStore {
  // observables
  loader: TLoader = "init-loader";
  data: Record<string, WorkspaceDashboardInstance> = {}; // dashboardId => DashboardInstance
  // service
  service: WorkspaceDashboardsService;
  // store
  rootStore: RootStore;

  constructor(store: RootStore) {
    makeObservable(this, {
      // observables
      loader: observable.ref,
      data: observable,
      // computed
      isAnyDashboardAvailable: computed,
      currentUserWorkspaceRole: computed,
      canCurrentUserCreateDashboard: computed,
      canCurrentUserDeleteDashboard: computed,
    });
    // initialize root store
    this.rootStore = store;
    // initialize service
    this.service = new WorkspaceDashboardsService();
  }

  get isAnyDashboardAvailable() {
    return Object.values(this.data ?? {}).length > 0;
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

  fetchDashboards: IWorkspaceDashboardsStore["fetchDashboards"] = async (workspaceSlug) => {
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

  fetchDashboardDetails: IWorkspaceDashboardsStore["fetchDashboardDetails"] = async (workspaceSlug, dashboardId) => {
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

  createDashboard: IWorkspaceDashboardsStore["createDashboard"] = async (workspaceSlug, data) => {
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

  deleteDashboard: IWorkspaceDashboardsStore["deleteDashboard"] = async (workspaceSlug, dashboardId) => {
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
}
