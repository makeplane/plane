import { autorun, makeObservable, observable } from "mobx";
// root store
import { RootStore } from "../root.store";
// issues data store
import { IIssueStore, IssueStore } from "./issue.store";
// issues filter base store
import { IIssuesFilter, IssuesFilter } from "./base-issue-filter.store";
import { IWorkspaceIssuesFilter, WorkspaceIssuesFilter, IWorkspaceIssues, WorkspaceIssues } from "./workspace";
import { IProfileIssuesFilter, ProfileIssuesFilter, IProfileIssues, ProfileIssues } from "./profile";
import { IProjectIssuesFilter, ProjectIssuesFilter, IProjectIssues, ProjectIssues } from "./project";
import { ICycleIssuesFilter, CycleIssuesFilter, ICycleIssues, CycleIssues } from "./cycle";
import { IModuleIssuesFilter, ModuleIssuesFilter, IModuleIssues, ModuleIssues } from "./module";
import {
  IProjectViewIssuesFilter,
  ProjectViewIssuesFilter,
  IProjectViewIssues,
  ProjectViewIssues,
} from "./project-views";
import { IArchivedIssuesFilter, ArchivedIssuesFilter, IArchivedIssues, ArchivedIssues } from "./archived";
import { IDraftIssuesFilter, DraftIssuesFilter, IDraftIssues, DraftIssues } from "./draft";

export interface IIssueRootStore {
  currentUserId: string | undefined;
  workspaceSlug: string | undefined;
  profileView: string | undefined;
  projectId: string | undefined;
  cycleId: string | undefined;
  moduleId: string | undefined;
  projectViewId: string | undefined;
  states: any | undefined;
  labels: any | undefined;
  members: any | undefined;
  projects: any | undefined;

  issues: IIssueStore;

  issuesFilter: IIssuesFilter;

  workspaceIssuesFilter: IWorkspaceIssuesFilter;
  workspaceIssues: IWorkspaceIssues;

  profileIssuesFilter: IProfileIssuesFilter;
  profileIssues: IProfileIssues;

  projectIssuesFilter: IProjectIssuesFilter;
  projectIssues: IProjectIssues;

  cycleIssuesFilter: ICycleIssuesFilter;
  cycleIssues: ICycleIssues;

  moduleIssuesFilter: IModuleIssuesFilter;
  moduleIssues: IModuleIssues;

  projectViewIssuesFilter: IProjectViewIssuesFilter;
  projectViewIssues: IProjectViewIssues;

  archivedIssuesFilter: IArchivedIssuesFilter;
  archivedIssues: IArchivedIssues;

  draftIssuesFilter: IDraftIssuesFilter;
  draftIssues: IDraftIssues;
}

export class IssueRootStore {
  currentUserId: string | undefined = undefined;
  workspaceSlug: string | undefined = undefined;
  projectId: string | undefined = undefined;
  cycleId: string | undefined = undefined;
  moduleId: string | undefined = undefined;
  projectViewId: string | undefined = undefined;
  profileView: string | undefined = undefined;
  states: any | undefined = undefined;
  labels: any | undefined = undefined;
  members: any | undefined = undefined;
  projects: any | undefined = undefined;

  issues: IIssueStore;

  issuesFilter: IIssuesFilter;

  workspaceIssuesFilter: IWorkspaceIssuesFilter;
  workspaceIssues: IWorkspaceIssues;

  profileIssuesFilter: IProfileIssuesFilter;
  profileIssues: IProfileIssues;

  projectIssuesFilter: IProjectIssuesFilter;
  projectIssues: IProjectIssues;

  cycleIssuesFilter: ICycleIssuesFilter;
  cycleIssues: ICycleIssues;

  moduleIssuesFilter: IModuleIssuesFilter;
  moduleIssues: IModuleIssues;

  projectViewIssuesFilter: IProjectViewIssuesFilter;
  projectViewIssues: IProjectViewIssues;

  archivedIssuesFilter: IArchivedIssuesFilter;
  archivedIssues: IArchivedIssues;

  draftIssuesFilter: IDraftIssuesFilter;
  draftIssues: IDraftIssues;

  constructor(rootStore: RootStore) {
    makeObservable(this, {
      currentUserId: observable.ref,
      workspaceSlug: observable.ref,
      projectId: observable.ref,
      cycleId: observable.ref,
      moduleId: observable.ref,
      projectViewId: observable.ref,
      profileView: observable.ref,
      states: observable,
      labels: observable,
      members: observable,
      projects: observable,
    });

    autorun(() => {
      if (rootStore?.user?.currentUser?.id) this.currentUserId = rootStore?.user?.currentUser?.id;
      if (rootStore?.workspace?.currentWorkspace?.slug)
        this.workspaceSlug = rootStore?.workspace?.currentWorkspace?.slug;
      if (rootStore?.project?.projects?.projectId) this.projectId = rootStore?.project?.projects?.projectId;
      if (rootStore?.cycle?.cycleId) this.cycleId = rootStore?.cycle?.cycleId;
      if (rootStore?.module?.moduleId) this.moduleId = rootStore?.module?.moduleId;
      if (rootStore?.projectView?.viewId) this.projectViewId = rootStore?.projectView?.viewId;

      // if (rootStore?.workspace?.profileView) this.profileView = rootStore?.workspace?.profileView;
      // if (rootStore?.states) this.states = rootStore?.states;
      // if (rootStore?.labels) this.labels = rootStore?.labels;
      // if (rootStore?.members) this.members = rootStore?.members;
      // if (rootStore?.projects) this.projects = rootStore?.projects;
    });

    this.issues = new IssueStore(this);

    this.issuesFilter = new IssuesFilter(this);

    this.workspaceIssuesFilter = new WorkspaceIssuesFilter(this);
    this.workspaceIssues = new WorkspaceIssues();

    this.profileIssuesFilter = new ProfileIssuesFilter(this);
    this.profileIssues = new ProfileIssues();

    this.projectIssuesFilter = new ProjectIssuesFilter(this);
    this.projectIssues = new ProjectIssues(this);

    this.cycleIssuesFilter = new CycleIssuesFilter(this);
    this.cycleIssues = new CycleIssues(this);

    this.moduleIssuesFilter = new ModuleIssuesFilter(this);
    this.moduleIssues = new ModuleIssues();

    this.projectViewIssuesFilter = new ProjectViewIssuesFilter(this);
    this.projectViewIssues = new ProjectViewIssues();

    this.archivedIssuesFilter = new ArchivedIssuesFilter(this);
    this.archivedIssues = new ArchivedIssues();

    this.draftIssuesFilter = new DraftIssuesFilter(this);
    this.draftIssues = new DraftIssues();
  }
}
