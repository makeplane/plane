// mobx lite
import { enableStaticRendering } from "mobx-react-lite";
// store imports
import UserStore from "./user";
import ThemeStore from "./theme";
import ProjectPublishStore, { IProjectPublishStore } from "./project-publish";
import IssuesStore from "./issues";

import WorkspaceStore, { IWorkspaceStore } from "./workspaces";
import ProjectStore, { IProjectStore } from "./projects";
import IssueStore, { IIssueStore } from "./issue-store";
import ModuleStore, { IModuleStore } from "./modules";
import CycleStore, { ICycleStore } from "./cycles";
import ViewStore, { IViewStore } from "./views";
import IssueFilterStore, { IIssueFilterStore } from "./issue-filters";

import IssueViewDetailStore from "./issue_detail";
import IssueKanBanViewStore from "./issue-views/kanban-view";

enableStaticRendering(typeof window === "undefined");

export class RootStore {
  user;
  theme;
  projectPublish: IProjectPublishStore;
  issues: IssuesStore;

  workspace: IWorkspaceStore;
  project: IProjectStore;
  issue: IIssueStore;
  module: IModuleStore;
  cycle: ICycleStore;
  view: IViewStore;
  issueFilter: IIssueFilterStore;
  issueDetail: IssueViewDetailStore;
  issueKanBanView: IssueKanBanViewStore;

  constructor() {
    this.user = new UserStore(this);
    this.theme = new ThemeStore(this);
    this.projectPublish = new ProjectPublishStore(this);
    this.issues = new IssuesStore(this);

    this.workspace = new WorkspaceStore(this);
    this.project = new ProjectStore(this);
    this.issue = new IssueStore(this);
    this.module = new ModuleStore(this);
    this.cycle = new CycleStore(this);
    this.view = new ViewStore(this);
    this.issueFilter = new IssueFilterStore(this);

    this.issueDetail = new IssueViewDetailStore(this);
    this.issueKanBanView = new IssueKanBanViewStore(this);
  }
}
