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
import { IssueRootStore, IIssueRootStore } from "./issue/root.store";
import { IStateStore, StateStore } from "./state.store";
import { IPageStore, PageStore } from "./page.store";

enableStaticRendering(typeof window === "undefined");

export class RootStore {
  app: IAppRootStore;
  user: IUserStore;
  workspaceRoot: IWorkspaceRootStore;
  projectRoot: IProjectRootStore;
  cycle: ICycleStore;
  module: IModuleStore;
  projectView: IProjectViewsStore;
  page: IPageStore;
  label: ILabelStore;
  issue: IIssueRootStore;
  state: IStateStore;

  constructor() {
    this.app = new AppRootStore(this);
    this.user = new UserStore(this);
    this.workspaceRoot = new WorkspaceRootStore(this);
    this.projectRoot = new ProjectRootStore(this);
    // independent stores
    this.label = new LabelStore(this);
    this.state = new StateStore(this);
    this.issue = new IssueRootStore(this);
    this.cycle = new CycleStore(this);
    this.module = new ModulesStore(this);
    this.projectView = new ProjectViewsStore(this);
    this.page = new PageStore(this);
  }
}
