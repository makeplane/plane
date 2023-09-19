// mobx lite
import { enableStaticRendering } from "mobx-react-lite";
// store imports
import UserStore from "./user";
import ThemeStore from "./theme";
import ProjectStore, { IProjectStore } from "./project";
import ProjectPublishStore, { IProjectPublishStore } from "./project-publish";
import IssuesStore from "./issues";
// issues views and filters
import IssueWorkspace from "./issue-views/workspace";
import IssueProject from "./issue-views/project";
import IssueFilterStore from "./issue-views/issue_filters";
import IssueViewStore from "./issue-views/Issues";
import IssueViewDetailStore from "./issue-views/issue_detail";
import IssueKanBanViewStore from "./issue-views/kanban-view";

enableStaticRendering(typeof window === "undefined");

export class RootStore {
  user;
  theme;
  project: IProjectStore;
  projectPublish: IProjectPublishStore;
  issues: IssuesStore;
  // issues views and filters
  issueWorkspace: IssueWorkspace;
  issueProject: IssueProject;
  issueFilters: IssueFilterStore;
  issueView: IssueViewStore;
  issueDetail: IssueViewDetailStore;
  issueKanBanView: IssueKanBanViewStore;

  constructor() {
    this.user = new UserStore(this);
    this.theme = new ThemeStore(this);
    this.project = new ProjectStore(this);
    this.projectPublish = new ProjectPublishStore(this);
    this.issues = new IssuesStore(this);
    // issues views and filters
    this.issueWorkspace = new IssueWorkspace(this);
    this.issueProject = new IssueProject(this);
    this.issueFilters = new IssueFilterStore(this);
    this.issueView = new IssueViewStore(this);
    this.issueDetail = new IssueViewDetailStore(this);
    this.issueKanBanView = new IssueKanBanViewStore(this);
  }
}
