import { enableStaticRendering } from "mobx-react-lite";
// root stores
import { ProjectInboxStore, IProjectInboxStore } from "@/store/inbox/project-inbox.store";
import { AppRootStore, IAppRootStore } from "./application";
import { CycleStore, ICycleStore } from "./cycle.store";
import { CycleFilterStore, ICycleFilterStore } from "./cycle_filter.store";
import { DashboardStore, IDashboardStore } from "./dashboard.store";
import { IEstimateStore, EstimateStore } from "./estimate.store";
import { EventTrackerStore, IEventTrackerStore } from "./event-tracker.store";
import { GlobalViewStore, IGlobalViewStore } from "./global-view.store";
import { IssueRootStore, IIssueRootStore } from "./issue/root.store";
import { ILabelStore, LabelStore } from "./label.store";
import { IMemberRootStore, MemberRootStore } from "./member";
import { IModuleStore, ModulesStore } from "./module.store";
import { IModuleFilterStore, ModuleFilterStore } from "./module_filter.store";
import { IProjectPageStore, ProjectPageStore } from "./pages/project-page.store";
import { IProjectRootStore, ProjectRootStore } from "./project";
import { IProjectViewStore, ProjectViewStore } from "./project-view.store";
import { IStateStore, StateStore } from "./state.store";
import { IUserRootStore, UserRootStore } from "./user";
import { IWorkspaceRootStore, WorkspaceRootStore } from "./workspace";

enableStaticRendering(typeof window === "undefined");

export class RootStore {
  app: IAppRootStore;
  eventTracker: IEventTrackerStore;
  user: IUserRootStore;
  workspaceRoot: IWorkspaceRootStore;
  projectRoot: IProjectRootStore;
  memberRoot: IMemberRootStore;
  cycle: ICycleStore;
  cycleFilter: ICycleFilterStore;
  module: IModuleStore;
  moduleFilter: IModuleFilterStore;
  projectView: IProjectViewStore;
  globalView: IGlobalViewStore;
  issue: IIssueRootStore;
  state: IStateStore;
  label: ILabelStore;
  estimate: IEstimateStore;
  dashboard: IDashboardStore;
  projectPages: IProjectPageStore;
  projectInbox: IProjectInboxStore;

  constructor() {
    this.app = new AppRootStore(this);
    this.eventTracker = new EventTrackerStore(this);
    this.user = new UserRootStore(this);
    this.workspaceRoot = new WorkspaceRootStore(this);
    this.projectRoot = new ProjectRootStore(this);
    this.memberRoot = new MemberRootStore(this);
    // independent stores
    this.cycle = new CycleStore(this);
    this.cycleFilter = new CycleFilterStore(this);
    this.module = new ModulesStore(this);
    this.moduleFilter = new ModuleFilterStore(this);
    this.projectView = new ProjectViewStore(this);
    this.globalView = new GlobalViewStore(this);
    this.issue = new IssueRootStore(this);
    this.state = new StateStore(this);
    this.label = new LabelStore(this);
    this.estimate = new EstimateStore(this);
    this.dashboard = new DashboardStore(this);
    // inbox
    this.projectInbox = new ProjectInboxStore(this);
    this.projectPages = new ProjectPageStore(this);
  }

  resetOnSignout() {
    this.workspaceRoot = new WorkspaceRootStore(this);
    this.projectRoot = new ProjectRootStore(this);
    this.memberRoot = new MemberRootStore(this);
    // independent stores
    this.cycle = new CycleStore(this);
    this.cycleFilter = new CycleFilterStore(this);
    this.module = new ModulesStore(this);
    this.moduleFilter = new ModuleFilterStore(this);
    this.projectView = new ProjectViewStore(this);
    this.globalView = new GlobalViewStore(this);
    this.issue = new IssueRootStore(this);
    this.state = new StateStore(this);
    this.label = new LabelStore(this);
    this.estimate = new EstimateStore(this);
    this.dashboard = new DashboardStore(this);
    this.projectInbox = new ProjectInboxStore(this);
    this.projectPages = new ProjectPageStore(this);
  }
}
