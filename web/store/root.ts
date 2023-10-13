// mobx lite
import { enableStaticRendering } from "mobx-react-lite";
// store imports
import UserStore from "store/user.store";
import ThemeStore from "store/theme.store";
import {
  DraftIssuesStore,
  IIssueDetailStore,
  IIssueFilterStore,
  IIssueKanBanViewStore,
  IIssueStore,
  IssueDetailStore,
  IssueFilterStore,
  IssueKanBanViewStore,
  IssueStore,
} from "store/issue";
import { IWorkspaceFilterStore, IWorkspaceStore, WorkspaceFilterStore, WorkspaceStore } from "store/workspace";
import { IProjectPublishStore, IProjectStore, ProjectPublishStore, ProjectStore } from "store/project";
import {
  IModuleFilterStore,
  IModuleIssueKanBanViewStore,
  IModuleIssueStore,
  IModuleStore,
  ModuleFilterStore,
  ModuleIssueKanBanViewStore,
  ModuleIssueStore,
  ModuleStore,
} from "store/module";
import {
  CycleIssueFilterStore,
  CycleIssueKanBanViewStore,
  CycleIssueStore,
  CycleStore,
  ICycleIssueFilterStore,
  ICycleIssueKanBanViewStore,
  ICycleIssueStore,
  ICycleStore,
} from "store/cycle";
import {
  IProjectViewFiltersStore,
  IProjectViewIssuesStore,
  IProjectViewsStore,
  ProjectViewFiltersStore,
  ProjectViewIssuesStore,
  ProjectViewsStore,
} from "store/project-view";
import CalendarStore, { ICalendarStore } from "store/calendar.store";
import {
  GlobalViewFiltersStore,
  GlobalViewIssuesStore,
  GlobalViewsStore,
  IGlobalViewFiltersStore,
  IGlobalViewIssuesStore,
  IGlobalViewsStore,
} from "store/global-view";

enableStaticRendering(typeof window === "undefined");

export class RootStore {
  user;
  theme;

  workspace: IWorkspaceStore;
  workspaceFilter: IWorkspaceFilterStore;

  projectPublish: IProjectPublishStore;
  project: IProjectStore;
  issue: IIssueStore;

  module: IModuleStore;
  moduleIssue: IModuleIssueStore;
  moduleFilter: IModuleFilterStore;
  moduleIssueKanBanView: IModuleIssueKanBanViewStore;

  cycle: ICycleStore;
  cycleIssue: ICycleIssueStore;
  cycleIssueFilter: ICycleIssueFilterStore;
  cycleIssueKanBanView: ICycleIssueKanBanViewStore;

  projectViews: IProjectViewsStore;
  projectViewIssues: IProjectViewIssuesStore;
  projectViewFilters: IProjectViewFiltersStore;

  issueFilter: IIssueFilterStore;
  issueDetail: IIssueDetailStore;
  issueKanBanView: IIssueKanBanViewStore;
  draftIssuesStore: DraftIssuesStore;

  calendar: ICalendarStore;

  globalViews: IGlobalViewsStore;
  globalViewIssues: IGlobalViewIssuesStore;
  globalViewFilters: IGlobalViewFiltersStore;

  constructor() {
    this.user = new UserStore(this);
    this.theme = new ThemeStore(this);

    this.workspace = new WorkspaceStore(this);
    this.workspaceFilter = new WorkspaceFilterStore(this);

    this.project = new ProjectStore(this);
    this.projectPublish = new ProjectPublishStore(this);

    this.module = new ModuleStore(this);
    this.moduleIssue = new ModuleIssueStore(this);
    this.moduleFilter = new ModuleFilterStore(this);
    this.moduleIssueKanBanView = new ModuleIssueKanBanViewStore(this);

    this.cycle = new CycleStore(this);
    this.cycleIssue = new CycleIssueStore(this);
    this.cycleIssueFilter = new CycleIssueFilterStore(this);
    this.cycleIssueKanBanView = new CycleIssueKanBanViewStore(this);

    this.projectViews = new ProjectViewsStore(this);
    this.projectViewIssues = new ProjectViewIssuesStore(this);
    this.projectViewFilters = new ProjectViewFiltersStore(this);

    this.issue = new IssueStore(this);
    this.issueFilter = new IssueFilterStore(this);
    this.issueDetail = new IssueDetailStore(this);
    this.issueKanBanView = new IssueKanBanViewStore(this);
    this.draftIssuesStore = new DraftIssuesStore(this);

    this.calendar = new CalendarStore(this);

    this.globalViews = new GlobalViewsStore(this);
    this.globalViewIssues = new GlobalViewIssuesStore(this);
    this.globalViewFilters = new GlobalViewFiltersStore(this);
  }
}
