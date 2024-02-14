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
}
