import { enableStaticRendering } from "mobx-react-lite";
// root stores
import { AppRootStore, IAppRootStore } from "./application";
import { IProjectRootStore, ProjectRootStore } from "./project";
import { CycleStore, ICycleStore } from "./cycle.store";
import { IProjectViewStore, ProjectViewStore } from "./project-view.store";
import { IModuleStore, ModulesStore } from "./module.store";
import { IUserRootStore, UserRootStore } from "./user";
import { IWorkspaceRootStore, WorkspaceRootStore } from "./workspace";
import { IssueRootStore, IIssueRootStore } from "./issue/root.store";
import { IStateStore, StateStore } from "./state.store";
import { IMemberRootStore, MemberRootStore } from "./member";
import { IInboxRootStore, InboxRootStore } from "./inbox";
import { IEstimateStore, EstimateStore } from "./estimate.store";
import { GlobalViewStore, IGlobalViewStore } from "./global-view.store";
import { IMentionStore, MentionStore } from "./mention.store";
import { DashboardStore, IDashboardStore } from "./dashboard.store";
import { IProjectPageStore, ProjectPageStore } from "./project-page.store";
import { ILabelStore, LabelStore } from "./label.store";

enableStaticRendering(typeof window === "undefined");

export class RootStore {
  app: IAppRootStore;
  user: IUserRootStore;
  workspaceRoot: IWorkspaceRootStore;
  projectRoot: IProjectRootStore;
  memberRoot: IMemberRootStore;
  inboxRoot: IInboxRootStore;
  cycle: ICycleStore;
  module: IModuleStore;
  projectView: IProjectViewStore;
  globalView: IGlobalViewStore;
  issue: IIssueRootStore;
  state: IStateStore;
  label: ILabelStore;
  estimate: IEstimateStore;
  mention: IMentionStore;
  dashboard: IDashboardStore;
  projectPages: IProjectPageStore;

  constructor() {
    this.app = new AppRootStore(this);
    this.user = new UserRootStore(this);
    this.workspaceRoot = new WorkspaceRootStore(this);
    this.projectRoot = new ProjectRootStore(this);
    this.memberRoot = new MemberRootStore(this);
    this.inboxRoot = new InboxRootStore(this);
    // independent stores
    this.cycle = new CycleStore(this);
    this.module = new ModulesStore(this);
    this.projectView = new ProjectViewStore(this);
    this.globalView = new GlobalViewStore(this);
    this.issue = new IssueRootStore(this);
    this.state = new StateStore(this);
    this.label = new LabelStore(this);
    this.estimate = new EstimateStore(this);
    this.mention = new MentionStore(this);
    this.projectPages = new ProjectPageStore(this);
    this.dashboard = new DashboardStore(this);
  }
}
