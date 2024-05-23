import { enableStaticRendering } from "mobx-react";
// stores
import { CommandPaletteStore, ICommandPaletteStore } from "./command-palette.store";
import { CycleStore, ICycleStore } from "./cycle.store";
import { CycleFilterStore, ICycleFilterStore } from "./cycle_filter.store";
import { DashboardStore, IDashboardStore } from "./dashboard.store";
import { EstimateStore, IEstimateStore } from "./estimate.store";
import { EventTrackerStore, IEventTrackerStore } from "./event-tracker.store";
import { GlobalViewStore, IGlobalViewStore } from "./global-view.store";
import { IProjectInboxStore, ProjectInboxStore } from "./inbox/project-inbox.store";
import { InstanceStore, IInstanceStore } from "./instance.store";
import { IIssueRootStore, IssueRootStore } from "./issue/root.store";
import { ILabelStore, LabelStore } from "./label.store";
import { IMemberRootStore, MemberRootStore } from "./member";
import { IModuleStore, ModulesStore } from "./module.store";
import { IModuleFilterStore, ModuleFilterStore } from "./module_filter.store";
import { IMultipleSelectStore, MultipleSelectStore } from "./multiple_select.store";
import { IProjectPageStore, ProjectPageStore } from "./pages/project-page.store";
import { IProjectRootStore, ProjectRootStore } from "./project";
import { IProjectViewStore, ProjectViewStore } from "./project-view.store";
import { RouterStore, IRouterStore } from "./router.store";
import { IStateStore, StateStore } from "./state.store";
import { ThemeStore, IThemeStore } from "./theme.store";
import { IUserStore, UserStore } from "./user";
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
  state: IStateStore;
  label: ILabelStore;
  estimate: IEstimateStore;
  dashboard: IDashboardStore;
  projectPages: IProjectPageStore;
  router: IRouterStore;
  commandPalette: ICommandPaletteStore;
  theme: IThemeStore;
  eventTracker: IEventTrackerStore;
  instance: IInstanceStore;
  user: IUserStore;
  projectInbox: IProjectInboxStore;
  multipleSelect: IMultipleSelectStore;

  constructor() {
    this.router = new RouterStore();
    this.workspaceRoot = new WorkspaceRootStore(this);
    this.projectRoot = new ProjectRootStore(this);
    this.user = new UserStore(this);
    this.memberRoot = new MemberRootStore(this);
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
    this.commandPalette = new CommandPaletteStore();
    this.theme = new ThemeStore(this);
    this.eventTracker = new EventTrackerStore(this);
    this.instance = new InstanceStore();
    this.multipleSelect = new MultipleSelectStore();
    // inbox
    this.projectInbox = new ProjectInboxStore(this);
    this.projectPages = new ProjectPageStore(this);
    this.theme = new ThemeStore(this);
  }

  resetOnSignOut() {
    // handling the system theme when user logged out from the app
    localStorage.setItem("theme", "system");

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
    this.state = new StateStore(this);
    this.label = new LabelStore(this);
    this.estimate = new EstimateStore(this);
    this.dashboard = new DashboardStore(this);
    this.router = new RouterStore();
    this.commandPalette = new CommandPaletteStore();
    this.eventTracker = new EventTrackerStore(this);
    this.instance = new InstanceStore();
    this.user = new UserStore(this);
    this.projectInbox = new ProjectInboxStore(this);
    this.projectPages = new ProjectPageStore(this);
    this.multipleSelect = new MultipleSelectStore();
  }
}
