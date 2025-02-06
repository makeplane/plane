import set from "lodash/set";
import { action, computed, makeObservable, observable, runInAction } from "mobx";
// plane services
import { WorkspaceDashboardsService } from "@plane/services";
// plane types
import { TWorkspaceDashboard } from "@plane/types";
// plane web constants
import { EUserPermissions } from "@/plane-web/constants";
// plane web store
import { RootStore } from "@/plane-web/store/root.store";

export interface IWorkspaceDashboardInstance extends TWorkspaceDashboard {
  // permissions
  canCurrentUserEditDashboard: boolean;
  canCurrentUserFavoriteDashboard: boolean;
  // helpers
  asJSON: TWorkspaceDashboard;
  getRedirectionLink: () => string;
  mutateProperties: (data: Partial<TWorkspaceDashboard>) => void;
  // actions
  updateDashboard: (data: Partial<TWorkspaceDashboard>) => Promise<TWorkspaceDashboard>;
}

export class WorkspaceDashboardInstance implements IWorkspaceDashboardInstance {
  // dashboard properties
  created_at: Date | undefined;
  created_by: string | undefined;
  name: string | undefined;
  id: string | undefined;
  is_favorite: boolean | undefined;
  project_ids: string[] | undefined;
  updated_at: Date | undefined;
  updated_by: string | undefined;
  // service
  service: WorkspaceDashboardsService;
  // root store
  rootStore: RootStore;

  constructor(store: RootStore, dashboard: TWorkspaceDashboard) {
    makeObservable(this, {
      // observables
      created_at: observable.ref,
      created_by: observable.ref,
      name: observable.ref,
      id: observable.ref,
      is_favorite: observable.ref,
      project_ids: observable,
      updated_at: observable.ref,
      updated_by: observable.ref,
      // computed
      currentUserWorkspaceRole: computed,
      canCurrentUserEditDashboard: computed,
      canCurrentUserFavoriteDashboard: computed,
      asJSON: computed,
      // actions
      mutateProperties: action,
      updateDashboard: action,
    });
    // initialize dashboard properties
    this.created_at = dashboard.created_at;
    this.created_by = dashboard.created_by;
    this.name = dashboard.name;
    this.id = dashboard.id;
    this.is_favorite = dashboard.is_favorite;
    this.project_ids = dashboard.project_ids;
    this.updated_at = dashboard.updated_at;
    this.updated_by = dashboard.updated_by;
    // initialize service
    this.service = new WorkspaceDashboardsService();
    // initialize root store
    this.rootStore = store;
  }

  get currentUserWorkspaceRole(): EUserPermissions {
    const currentWorkspaceSlug = this.rootStore.workspaceRoot.currentWorkspace?.slug;
    const currentWorkspaceRole = this.rootStore.user.permission.workspaceInfoBySlug(currentWorkspaceSlug ?? "")
      ?.role as EUserPermissions;
    return currentWorkspaceRole ?? EUserPermissions.GUEST;
  }

  // permissions
  get canCurrentUserEditDashboard() {
    return this.currentUserWorkspaceRole >= EUserPermissions.MEMBER;
  }

  get canCurrentUserFavoriteDashboard() {
    return this.currentUserWorkspaceRole >= EUserPermissions.MEMBER;
  }

  // helpers
  get asJSON() {
    return {
      created_at: this.created_at,
      created_by: this.created_by,
      name: this.name,
      id: this.id,
      is_favorite: this.is_favorite,
      project_ids: this.project_ids,
      updated_at: this.updated_at,
      updated_by: this.updated_by,
    };
  }

  getRedirectionLink: IWorkspaceDashboardInstance["getRedirectionLink"] = () => {
    const currentWorkspaceSlug = this.rootStore.workspaceRoot.currentWorkspace?.slug;
    return `/${currentWorkspaceSlug}/dashboards/${this.id}`;
  };

  mutateProperties: IWorkspaceDashboardInstance["mutateProperties"] = (data) => {
    runInAction(() => {
      Object.keys(data).map((key) => {
        const dataKey = key as keyof TWorkspaceDashboard;
        set(this, [dataKey], data[dataKey]);
      });
    });
  };

  updateDashboard: IWorkspaceDashboardInstance["updateDashboard"] = async (data) => {
    const workspaceSlug = this.rootStore.workspaceRoot.currentWorkspace?.slug;
    if (!workspaceSlug || !this.id) throw new Error("Required fields not found");
    const originalPage = { ...this.asJSON };
    try {
      // optimistically update
      this.mutateProperties(data);
      const res = await this.service.update(workspaceSlug, this.id, data);
      return res;
    } catch (error) {
      // revert changes
      this.mutateProperties(originalPage);
      // update loader
      console.error("Error in updating workspace dashboard:", error);
      throw error;
    }
  };
}
