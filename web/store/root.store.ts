import { enableStaticRendering } from "mobx-react-lite";
// root stores
import { AppRootStore, IAppRootStore } from "./application";
import { ProjectRootStore } from "./project";
import { CycleStore } from "./cycle.store";
import { ProjectViewsStore } from "./project-view.store";
import { ModulesStore } from "./module.store";
import { UserStore, IUserStore } from "./user";
import { LabelStore, ILabelStore } from "./label.store";

enableStaticRendering(typeof window === "undefined");

export class RootStore {
  app: IAppRootStore;
  user: IUserStore;
  // workspace;
  project;
  cycle;
  module;
  projectView;
  label: ILabelStore;

  constructor() {
    this.app = new AppRootStore(this);
    this.user = new UserStore(this);
    // this.workspace = new WorkspaceRootStore();
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
