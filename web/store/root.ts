// mobx lite
import { enableStaticRendering } from "mobx-react-lite";
// store imports
import UserStore from "./user";
import ThemeStore from "./theme";
import ProjectPublishStore, { IProjectPublishStore } from "./project_publish";
import IssueStore, { IIssueStore } from "./issue";
import DraftIssuesStore from "./issue_draft";
import WorkspaceStore, { IWorkspaceStore } from "./workspace";
import ProjectStore, { IProjectStore } from "./project";
import ModuleStore, { IModuleStore } from "./modules";
import CycleStore, { ICycleStore } from "./cycles";
import ViewStore, { IViewStore } from "./views";
import IssueFilterStore, { IIssueFilterStore } from "./issue_filters";
import IssueViewDetailStore from "./issue_detail";
import IssueKanBanViewStore from "./kanban_view";
import CalendarStore, { ICalendarStore } from "./calendar";
import ModuleFilterStore, { IModuleFilterStore } from "./module_filters";
import GlobalViewsStore, { IGlobalViewsStore } from "./global_views";
import GlobalViewIssuesStore, { IGlobalViewIssuesStore } from "./global_view_issues";
import WorkspaceFilterStore, { IWorkspaceFilterStore } from "./workspace_filters";

enableStaticRendering(typeof window === "undefined");

export class RootStore {
  user;
  theme;
  projectPublish: IProjectPublishStore;
  draftIssuesStore: DraftIssuesStore;
  workspace: IWorkspaceStore;
  workspaceFilter: IWorkspaceFilterStore;
  project: IProjectStore;
  issue: IIssueStore;
  module: IModuleStore;
  moduleFilter: IModuleFilterStore;
  cycle: ICycleStore;
  view: IViewStore;
  issueFilter: IIssueFilterStore;
  issueDetail: IssueViewDetailStore;
  issueKanBanView: IssueKanBanViewStore;
  calendar: ICalendarStore;
  globalViews: IGlobalViewsStore;
  globalViewIssues: IGlobalViewIssuesStore;

  constructor() {
    this.user = new UserStore(this);
    this.theme = new ThemeStore(this);
    this.workspace = new WorkspaceStore(this);
    this.workspaceFilter = new WorkspaceFilterStore(this);
    this.project = new ProjectStore(this);
    this.projectPublish = new ProjectPublishStore(this);
    this.module = new ModuleStore(this);
    this.moduleFilter = new ModuleFilterStore(this);
    this.cycle = new CycleStore(this);
    this.view = new ViewStore(this);
    this.issue = new IssueStore(this);
    this.issueFilter = new IssueFilterStore(this);
    this.issueDetail = new IssueViewDetailStore(this);
    this.issueKanBanView = new IssueKanBanViewStore(this);
    this.draftIssuesStore = new DraftIssuesStore(this);
    this.calendar = new CalendarStore(this);
    this.globalViews = new GlobalViewsStore(this);
    this.globalViewIssues = new GlobalViewIssuesStore(this);
  }
}
