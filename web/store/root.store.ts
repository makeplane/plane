import { enableStaticRendering } from "mobx-react";
// root stores
import { AppRootStore, IAppRootStore } from "./application";
import { CycleStore, ICycleStore } from "./cycle.store";
import { DashboardStore, IDashboardStore } from "./dashboard.store";
import { EstimateStore, IEstimateStore } from "./estimate.store";
import { GlobalViewStore, IGlobalViewStore } from "./global-view.store";
import { IInboxRootStore, InboxRootStore } from "./inbox/root.store";
import { IIssueRootStore, IssueRootStore } from "./issue/root.store";
import { ILabelStore, LabelStore } from "./label.store";
import { IMemberRootStore, MemberRootStore } from "./member";
import { IMentionStore, MentionStore } from "./mention.store";
import { IModuleStore, ModulesStore } from "./module.store";
import { IProjectRootStore, ProjectRootStore } from "./project";
import { IProjectPageStore, ProjectPageStore } from "./project-page.store";
import { IProjectViewStore, ProjectViewStore } from "./project-view.store";
import { IStateStore, StateStore } from "./state.store";
import { IWorkspaceRootStore, WorkspaceRootStore } from "./workspace";
import { CycleFilterStore, ICycleFilterStore } from "./cycle_filter.store";
import { IModuleFilterStore, ModuleFilterStore } from "./module_filter.store";

// independent new store structure
import { RouterStore, IRouterStore } from "./application/router.store";
import { CommandPaletteStore, ICommandPaletteStore } from "./application/command-palette.store";
import { ThemeStore, IThemeStore } from "./application/theme.store";

import { EventTrackerStore, IEventTrackerStore } from "./event-tracker.store";

import { InstanceStore, IInstanceStore } from "./application/instance.store";
import { IUserStore, UserStore } from "./user";

enableStaticRendering(typeof window === "undefined");

export class RootStore {
  app: IAppRootStore;

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
  // independent new store structure
  router: IRouterStore;
  commandPalette: ICommandPaletteStore;
  theme: IThemeStore;

  eventTracker: IEventTrackerStore;

  instance: IInstanceStore;
  user: IUserStore;

  constructor() {
    this.app = new AppRootStore(this);

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
    this.inbox = new InboxRootStore(this);
    this.state = new StateStore(this);
    this.label = new LabelStore(this);
    this.estimate = new EstimateStore(this);
    this.mention = new MentionStore(this);
    this.dashboard = new DashboardStore(this);

    // independent new store structure
    // local data management stores
    this.router = new RouterStore();
    this.commandPalette = new CommandPaletteStore();
    this.theme = new ThemeStore(this);

    this.eventTracker = new EventTrackerStore(this);

    this.instance = new InstanceStore(this);
    this.user = new UserStore(this);

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
    this.inbox = new InboxRootStore(this);
    this.state = new StateStore(this);
    this.label = new LabelStore(this);
    this.estimate = new EstimateStore(this);
    this.mention = new MentionStore(this);
    this.dashboard = new DashboardStore(this);

    // independent new store structure
    // local data management stores
    this.router = new RouterStore();
    this.commandPalette = new CommandPaletteStore();
    this.theme = new ThemeStore(this);

    this.eventTracker = new EventTrackerStore(this);

    this.instance = new InstanceStore(this);
    this.user = new UserStore(this);

    this.projectPages = new ProjectPageStore(this);
  }
}
