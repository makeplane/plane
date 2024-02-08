// stores
import { autorun, makeObservable, observable } from "mobx";
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

export class GlobalViewRootStore {
  workspacePrivateViewStore: ViewRootStore;
  workspacePublicViewStore: ViewRootStore;
  projectPrivateViewStore: ViewRootStore;
  projectPublicViewStore: ViewRootStore;

  constructor(private store: RootStore) {
    const workspacePrivateDefaultViews: any[] = [
      {
        id: "assigned",
        name: "Assigned",
        filters: {
          assignees: store?.user?.currentUser?.id ? [store?.user?.currentUser?.id] : [],
        },
        is_local_view: true,
      },
      {
        id: "created",
        name: "Created",
        filters: {
          created_by: store?.user?.currentUser?.id ? [store?.user?.currentUser?.id] : [],
        },
        is_local_view: true,
      },
      {
        id: "subscribed",
        name: "Subscribed",
        filters: {
          subscriber: store?.user?.currentUser?.id ? [store?.user?.currentUser?.id] : [],
        },
        is_local_view: true,
      },
    ];

    const workspacePublicDefaultViews: any[] = [
      {
        id: "all-issues",
        name: "All Issues",
        filters: {},
        is_local_view: true,
      },
    ];

    this.workspacePrivateViewStore = new ViewRootStore(
      this.store,
      workspacePrivateDefaultViews,
      new WorkspacePrivateViewService(),
      new WorkspaceFiltersService()
    );
    this.workspacePublicViewStore = new ViewRootStore(
      this.store,
      workspacePublicDefaultViews,
      new WorkspacePublicViewService(),
      new WorkspaceFiltersService()
    );
    this.projectPrivateViewStore = new ViewRootStore(
      this.store,
      undefined,
      new ProjectPrivateViewService(),
      new ProjectFiltersService()
    );
    this.projectPublicViewStore = new ViewRootStore(
      this.store,
      undefined,
      new ProjectPublicViewService(),
      new ProjectFiltersService()
    );
  }
}
