import { enableStaticRendering } from "mobx-react";
// stores
import { CommandPaletteStore, ICommandPaletteStore } from "./command-palette.store";
import { CycleStore, ICycleStore } from "./cycle.store";
import { CycleFilterStore, ICycleFilterStore } from "./cycle_filter.store";
import { DashboardStore, IDashboardStore } from "./dashboard.store";
import { EstimateStore, IEstimateStore } from "./estimate.store";
import { EventTrackerStore, IEventTrackerStore } from "./event-tracker.store";
import { GlobalViewStore, IGlobalViewStore } from "./global-view.store";
import { IInboxRootStore, InboxRootStore } from "./inbox/root.store";
import { InstanceStore, IInstanceStore } from "./instance.store";
import { IIssueRootStore, IssueRootStore } from "./issue/root.store";
import { ILabelStore, LabelStore } from "./label.store";
import { IMemberRootStore, MemberRootStore } from "./member";
import { IMentionStore, MentionStore } from "./mention.store";
import { IModuleStore, ModulesStore } from "./module.store";
import { IModuleFilterStore, ModuleFilterStore } from "./module_filter.store";
import { IProjectRootStore, ProjectRootStore } from "./project";
import { IProjectPageStore, ProjectPageStore } from "./project-page.store";
import { IProjectViewStore, ProjectViewStore } from "./project-view.store";
import { RouterStore, IRouterStore } from "./router.store";
import { IStateStore, StateStore } from "./state.store";
import { ThemeStore, IThemeStore } from "./theme.store";
import { IUserStore, UserStore } from "./user/user.store";
import { IWorkspaceRootStore, WorkspaceRootStore } from "./workspace";

enableStaticRendering(typeof window === "undefined");

export class RootStore {
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
  inbox: IInboxRootStore;
  state: IStateStore;
  label: ILabelStore;
  estimate: IEstimateStore;
  mention: IMentionStore;
  dashboard: IDashboardStore;
  projectPages: IProjectPageStore;
  router: IRouterStore;
  commandPalette: ICommandPaletteStore;
  theme: IThemeStore;
  eventTracker: IEventTrackerStore;
  instance: IInstanceStore;
  user: IUserStore;

  constructor() {
    this.workspaceRoot = new WorkspaceRootStore(this);
    this.projectRoot = new ProjectRootStore(this);
    this.memberRoot = new MemberRootStore(this);
    this.cycle = new CycleStore(this);
    this.cycleFilter = new CycleFilterStore(this);
    this.module = new ModulesStore(this);
    this.moduleFilter = new ModuleFilterStore(this);
    this.projectView = new ProjectViewStore(this);
    this.globalView = new GlobalViewStore(this);
    this.issue = new IssueRootStore(this);
    this.inbox = new InboxRootStore(this);
    this.state = new StateStore(this);
    this.label = new LabelStore(this);
    this.estimate = new EstimateStore(this);
    this.mention = new MentionStore(this);
    this.dashboard = new DashboardStore(this);
    this.router = new RouterStore();
    this.commandPalette = new CommandPaletteStore();
    this.theme = new ThemeStore(this);
    this.eventTracker = new EventTrackerStore(this);
    this.instance = new InstanceStore(this);
    this.user = new UserStore(this);
    this.projectPages = new ProjectPageStore(this);
    this.theme = new ThemeStore(this);
  }

  resetOnSignout() {
    this.workspaceRoot = new WorkspaceRootStore(this);
    this.projectRoot = new ProjectRootStore(this);
    this.memberRoot = new MemberRootStore(this);
    this.cycle = new CycleStore(this);
    this.cycleFilter = new CycleFilterStore(this);
    this.module = new ModulesStore(this);
    this.moduleFilter = new ModuleFilterStore(this);
    this.projectView = new ProjectViewStore(this);
    this.globalView = new GlobalViewStore(this);
    this.issue = new IssueRootStore(this);
    this.inbox = new InboxRootStore(this);
    this.state = new StateStore(this);
    this.label = new LabelStore(this);
    this.estimate = new EstimateStore(this);
    this.mention = new MentionStore(this);
    this.dashboard = new DashboardStore(this);
    this.router = new RouterStore();
    this.commandPalette = new CommandPaletteStore();
    this.theme = new ThemeStore(this);
    this.eventTracker = new EventTrackerStore(this);
    this.instance = new InstanceStore(this);
    this.user = new UserStore(this);
    this.projectPages = new ProjectPageStore(this);
  }
}
