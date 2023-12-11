import { enableStaticRendering } from "mobx-react-lite";
// root stores
import { AppRootStore } from "./application";

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
    this.app = new AppRootStore();
    this.user = new UserRootStore();
    this.workspace = new WorkspaceRootStore();
    this.project = new ProjectRootStore();
    this.cycle = new CycleRootStore();
    this.module = new ModuleRootStore();
    this.projectView = new ProjectViewRootStore();
    this.page = new PageRootStore();
    this.issue = new IssueRootStore();
    // independent stores
    this.label = new labelStore();
    this.state = new stateStore();
  }
}
