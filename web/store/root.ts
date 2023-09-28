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

enableStaticRendering(typeof window === "undefined");

export class RootStore {
  user;
  theme;
  projectPublish: IProjectPublishStore;
  draftIssuesStore: DraftIssuesStore;
  workspace: IWorkspaceStore;
  project: IProjectStore;
  issue: IIssueStore;
  module: IModuleStore;
  cycle: ICycleStore;
  view: IViewStore;
  issueFilter: IIssueFilterStore;
  issueDetail: IssueViewDetailStore;
  issueKanBanView: IssueKanBanViewStore;
  calendar: ICalendarStore;

  constructor() {
    this.user = new UserStore(this);
    this.theme = new ThemeStore(this);
    this.workspace = new WorkspaceStore(this);
    this.project = new ProjectStore(this);
    this.projectPublish = new ProjectPublishStore(this);
    this.module = new ModuleStore(this);
    this.cycle = new CycleStore(this);
    this.view = new ViewStore(this);
    this.issue = new IssueStore(this);
    this.issueFilter = new IssueFilterStore(this);
    this.issueDetail = new IssueViewDetailStore(this);
    this.issueKanBanView = new IssueKanBanViewStore(this);
    this.draftIssuesStore = new DraftIssuesStore(this);
    this.calendar = new CalendarStore(this);
  }
}
