// services
import { WorkspaceViewService } from "services/view/workspace.service";
import { WorkspaceMeViewService } from "services/view/workspace_me.service";
import { ProjectViewService } from "services/view/project.service";
import { ProjectViewMeService } from "services/view/project_me.service";
// stores
import { ViewRoot } from "./view-root.store";
// types
import { RootStore } from "store/root.store";

export class ViewRootStore {
  workspaceViewStore: ViewRoot;
  workspaceViewMeStore: ViewRoot;
  projectViewStore: ViewRoot;
  projectViewMeStore: ViewRoot;

  constructor(private store: RootStore) {
    this.workspaceViewStore = new ViewRoot(this.store, new WorkspaceViewService());
    this.workspaceViewMeStore = new ViewRoot(this.store, new WorkspaceMeViewService());
    this.projectViewStore = new ViewRoot(this.store, new ProjectViewService());
    this.projectViewMeStore = new ViewRoot(this.store, new ProjectViewMeService());
  }
}
