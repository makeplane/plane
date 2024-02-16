import { action, autorun, makeObservable, observable, runInAction } from "mobx";
// stores
import { ViewRootStore } from "./view-root.store";
// services
import {
  WorkspacePrivateViewService,
  WorkspacePublicViewService,
  ProjectPublicViewService,
  ProjectPrivateViewService,
  WorkspaceFiltersService,
  ProjectFiltersService,
} from "services/view";
// types
import { RootStore } from "store/root.store";
// constants
import { EViewPageType, VIEW_TYPES } from "constants/view";
import { TViewTypes } from "@plane/types";

export class GlobalViewRootStore {
  workspaceSlug: string | undefined = undefined;
  projectId: string | undefined = undefined;
  currentViewId: string | undefined = undefined;
  currentViewType: TViewTypes | undefined = undefined;
  currentUserId: string | undefined = undefined;

  workspacePrivateViewStore: ViewRootStore;
  workspacePublicViewStore: ViewRootStore;
  projectPrivateViewStore: ViewRootStore;
  projectPublicViewStore: ViewRootStore;

  constructor(private store: RootStore) {
    makeObservable(this, {
      workspaceSlug: observable.ref,
      projectId: observable.ref,
      currentViewId: observable.ref,
      currentViewType: observable.ref,
      currentUserId: observable.ref,
      // actions
      setWorkspaceSlug: action,
      setProjectId: action,
      setCurrentViewId: action,
      setCurrentViewType: action,
      setCurrentUserId: action,
    });

    autorun(() => {
      this.currentUserId = store.user.currentUser?.id;
    });

    const workspacePrivateDefaultViews: any[] = [
      {
        id: "assigned",
        name: "Assigned",
        is_local_view: true,
      },
      {
        id: "created",
        name: "Created",
        is_local_view: true,
      },
      {
        id: "subscribed",
        name: "Subscribed",
        is_local_view: true,
      },
    ];

    const workspacePublicDefaultViews: any[] = [
      {
        id: "all-issues",
        name: "All Issues",
        is_local_view: true,
      },
    ];

    this.workspacePrivateViewStore = new ViewRootStore(
      this.store,
      workspacePrivateDefaultViews,
      new WorkspacePrivateViewService(),
      new WorkspaceFiltersService(),
      EViewPageType.ALL,
      VIEW_TYPES.WORKSPACE_PRIVATE_VIEWS
    );
    this.workspacePublicViewStore = new ViewRootStore(
      this.store,
      workspacePublicDefaultViews,
      new WorkspacePublicViewService(),
      new WorkspaceFiltersService(),
      EViewPageType.ALL,
      VIEW_TYPES.WORKSPACE_PUBLIC_VIEWS
    );
    this.projectPrivateViewStore = new ViewRootStore(
      this.store,
      undefined,
      new ProjectPrivateViewService(),
      new ProjectFiltersService(),
      EViewPageType.PROJECT,
      VIEW_TYPES.PROJECT_PRIVATE_VIEWS
    );
    this.projectPublicViewStore = new ViewRootStore(
      this.store,
      undefined,
      new ProjectPublicViewService(),
      new ProjectFiltersService(),
      EViewPageType.PROJECT,
      VIEW_TYPES.PROJECT_PUBLIC_VIEWS
    );
  }

  // helper actions
  setWorkspaceSlug = (workspaceSlug: string | undefined) => runInAction(() => (this.workspaceSlug = workspaceSlug));
  setProjectId = (projectId: string | undefined) => runInAction(() => (this.projectId = projectId));
  setCurrentViewId = (viewId: string | undefined) => runInAction(() => (this.currentViewId = viewId));
  setCurrentViewType = (viewType: TViewTypes | undefined) => runInAction(() => (this.currentViewType = viewType));
  setCurrentUserId = (userId: string | undefined) => runInAction(() => (this.currentUserId = userId));
}
