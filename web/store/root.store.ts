import { enableStaticRendering } from "mobx-react-lite";
// root stores
import { AppRootStore } from "./application";
import { ProjectRootStore } from "./project";
import { CycleStore } from "./cycle.store";
import { ProjectViewsStore } from "./project-view.store";
import { ModulesStore } from "./module.store";
import { UserStore } from "./user";

enableStaticRendering(typeof window === "undefined");

export class RootStore {
  app: AppRootStore;
  user;
  workspace;
  project;
  cycle;
  module;
  projectView;

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
    // // independent stores
    // this.label = new labelStore();
    // this.state = new stateStore();
  }
}
