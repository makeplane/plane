import { enableStaticRendering } from "mobx-react";
// stores
import { CommandPaletteStore, ICommandPaletteStore } from "./command-palette.store";
import { CycleStore, ICycleStore } from "./cycle.store";
import { CycleFilterStore, ICycleFilterStore } from "./cycle_filter.store";
import { DashboardStore, IDashboardStore } from "./dashboard.store";
import { IProjectEstimateStore, ProjectEstimateStore } from "./estimates/project-estimate.store";
import { EventTrackerStore, IEventTrackerStore } from "./event-tracker.store";
import { FavoriteStore, IFavoriteStore } from "./favorite.store";
import { GlobalViewStore, IGlobalViewStore } from "./global-view.store";
import { IProjectInboxStore, ProjectInboxStore } from "./inbox/project-inbox.store";
import { InstanceStore, IInstanceStore } from "./instance.store";
import { IIssueRootStore, IssueRootStore } from "./issue/root.store";
import { ILabelStore, LabelStore } from "./label.store";
import { IMemberRootStore, MemberRootStore } from "./member";
import { IModuleStore, ModulesStore } from "./module.store";
import { IModuleFilterStore, ModuleFilterStore } from "./module_filter.store";
import { IMultipleSelectStore, MultipleSelectStore } from "./multiple_select.store";
import { IWorkspaceNotificationStore, WorkspaceNotificationStore } from "./notifications/workspace-notifications.store";
import { IProjectPageStore, ProjectPageStore } from "./pages/project-page.store";
import { IProjectRootStore, ProjectRootStore } from "./project";
import { IProjectViewStore, ProjectViewStore } from "./project-view.store";
import { RouterStore, IRouterStore } from "./router.store";
import { IStateStore, StateStore } from "./state.store";
import { ThemeStore, IThemeStore } from "./theme.store";
import { ITransientStore, TransientStore } from "./transient.store";
import { IUserStore, UserStore } from "./user";
import { IWorkspaceRootStore, WorkspaceRootStore } from "./workspace";

enableStaticRendering(typeof window === "undefined");

export class CoreRootStore {
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
  dashboard: IDashboardStore;
  projectPages: IProjectPageStore;
  router: IRouterStore;
  commandPalette: ICommandPaletteStore;
  theme: IThemeStore;
  eventTracker: IEventTrackerStore;
  instance: IInstanceStore;
  user: IUserStore;
  projectInbox: IProjectInboxStore;
  projectEstimate: IProjectEstimateStore;
  multipleSelect: IMultipleSelectStore;
  workspaceNotification: IWorkspaceNotificationStore;
  favorite: IFavoriteStore;
  transient: ITransientStore;

  constructor() {
    this.router = new RouterStore();
    this.commandPalette = new CommandPaletteStore();
    this.instance = new InstanceStore();
    this.user = new UserStore(this);
    this.theme = new ThemeStore();
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
    this.dashboard = new DashboardStore(this);
    this.eventTracker = new EventTrackerStore(this);
    this.multipleSelect = new MultipleSelectStore();
    this.projectInbox = new ProjectInboxStore(this);
    this.projectPages = new ProjectPageStore(this);
    this.projectEstimate = new ProjectEstimateStore(this);
    this.workspaceNotification = new WorkspaceNotificationStore(this);
    this.favorite = new FavoriteStore(this);
    this.transient = new TransientStore();
  }

  resetOnSignOut() {
    // handling the system theme when user logged out from the app
    localStorage.setItem("theme", "system");

    this.router = new RouterStore();
    this.commandPalette = new CommandPaletteStore();
    this.instance = new InstanceStore();
    this.user = new UserStore(this);
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
    this.dashboard = new DashboardStore(this);
    this.eventTracker = new EventTrackerStore(this);
    this.projectInbox = new ProjectInboxStore(this);
    this.projectPages = new ProjectPageStore(this);
    this.multipleSelect = new MultipleSelectStore();
    this.projectEstimate = new ProjectEstimateStore(this);
    this.workspaceNotification = new WorkspaceNotificationStore(this);
    this.favorite = new FavoriteStore(this);
    this.transient = new TransientStore();
  }
}
