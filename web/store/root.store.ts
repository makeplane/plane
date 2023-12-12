import { enableStaticRendering } from "mobx-react-lite";
// root stores
import { AppRootStore, IAppRootStore } from "./application";
import { IProjectRootStore, ProjectRootStore } from "./project";
import { CycleStore, ICycleStore } from "./cycle.store";
import { IProjectViewsStore, ProjectViewsStore } from "./project-view.store";
import { IModuleStore, ModulesStore } from "./module.store";
import { IUserStore, UserStore } from "./user";
import { ILabelStore, LabelStore } from "./label.store";
import { IWorkspaceRootStore, WorkspaceRootStore } from "./workspace";

enableStaticRendering(typeof window === "undefined");

export class RootStore {
  app: IAppRootStore;
  user: IUserStore;
  workspace: IWorkspaceRootStore;
  project: IProjectRootStore;
  cycle: ICycleStore;
  module: IModuleStore;
  projectView: IProjectViewsStore;
  label: ILabelStore;

  constructor() {
    this.app = new AppRootStore(this);
    this.user = new UserStore(this);
    this.workspace = new WorkspaceRootStore(this);
    this.project = new ProjectRootStore(this);
    this.cycle = new CycleStore(this);
    this.module = new ModulesStore(this);
    this.projectView = new ProjectViewsStore(this);
    // this.page = new PageRootStore();
    // this.issue = new IssueRootStore();
    // independent stores
    this.label = new LabelStore(this);
    // this.state = new stateStore();
  }
}
