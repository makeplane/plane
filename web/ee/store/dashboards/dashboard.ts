import set from "lodash/set";
import { action, computed, makeObservable, observable } from "mobx";
// plane types
import { TWorkspaceDashboard } from "@plane/types";
// plane web constants
import { EUserPermissions } from "@/plane-web/constants";
// plane web store
import { RootStore } from "@/plane-web/store/root.store";

export interface IWorkspaceDashboardInstance extends TWorkspaceDashboard {
  // helpers
  mutateProperties: (data: Partial<TWorkspaceDashboard>) => void;
  // permissions
  canCurrentUserEditDashboard: boolean;
}

export class WorkspaceDashboardInstance implements IWorkspaceDashboardInstance {
  // dashboard properties
  id: string | undefined;
  // root store
  rootStore: RootStore;

  constructor(store: RootStore, dashboard: TWorkspaceDashboard) {
    makeObservable(this, {
      // observables
      id: observable.ref,
      // actions
      mutateProperties: action,
      // computed
      currentUserWorkspaceRole: computed,
      canCurrentUserEditDashboard: computed,
    });
    // initialize dashboard properties
    this.id = dashboard.id;
    // initialize root store
    this.rootStore = store;
  }

  get currentUserWorkspaceRole(): EUserPermissions {
    const currentWorkspaceSlug = this.rootStore.workspaceRoot.currentWorkspace?.slug;
    const currentWorkspaceRole = this.rootStore.user.permission.workspaceInfoBySlug(currentWorkspaceSlug ?? "")
      ?.role as EUserPermissions;
    return currentWorkspaceRole ?? EUserPermissions.GUEST;
  }

  get canCurrentUserEditDashboard() {
    return this.currentUserWorkspaceRole >= EUserPermissions.MEMBER;
  }

  mutateProperties: IWorkspaceDashboardInstance["mutateProperties"] = (data) => {
    Object.keys(data).map((key) => {
      const dataKey = key as keyof TWorkspaceDashboard;
      set(this, [dataKey], data[dataKey]);
    });
  };
}
