import { autorun, makeObservable, observable } from "mobx";
import isEmpty from "lodash/isEmpty";
// root store
import { RootStore } from "../root.store";
import { IStateStore, StateStore } from "../state.store";
// issues data store
import { IIssueLabel, IProject, IState, IUserLite } from "@plane/types";
import { IIssueStore, IssueStore } from "./issue.store";
import { IIssueDetail, IssueDetail } from "./issue-details/root.store";
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
import { IIssueKanBanViewStore, IssueKanBanViewStore } from "./issue_kanban_view.store";
import { ICalendarStore, CalendarStore } from "./issue_calendar_view.store";
import { IWorkspaceMembership } from "store/member/workspace-member.store";

export interface IIssueRootStore {
  currentUserId: string | undefined;
  workspaceSlug: string | undefined;
  projectId: string | undefined;
  cycleId: string | undefined;
  moduleId: string | undefined;
  viewId: string | undefined;
  globalViewId: string | undefined; // all issues view id
  userId: string | undefined; // user profile detail Id
  stateMap: Record<string, IState> | undefined;
  stateDetails: IState[] | undefined;
  labelMap: Record<string, IIssueLabel> | undefined;
  workSpaceMemberRolesMap: Record<string, IWorkspaceMembership> | undefined;
  memberMap: Record<string, IUserLite> | undefined;
  projectMap: Record<string, IProject> | undefined;

  rootStore: RootStore;

  issues: IIssueStore;

  state: IStateStore;

  issueDetail: IIssueDetail;

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

  issueKanBanView: IIssueKanBanViewStore;
  issueCalendarView: ICalendarStore;
}

export class IssueRootStore implements IIssueRootStore {
  currentUserId: string | undefined = undefined;
  workspaceSlug: string | undefined = undefined;
  projectId: string | undefined = undefined;
  cycleId: string | undefined = undefined;
  moduleId: string | undefined = undefined;
  viewId: string | undefined = undefined;
  globalViewId: string | undefined = undefined;
  userId: string | undefined = undefined;
  stateMap: Record<string, IState> | undefined = undefined;
  stateDetails: IState[] | undefined = undefined;
  labelMap: Record<string, IIssueLabel> | undefined = undefined;
  workSpaceMemberRolesMap: Record<string, IWorkspaceMembership> | undefined = undefined;
  memberMap: Record<string, IUserLite> | undefined = undefined;
  projectMap: Record<string, IProject> | undefined = undefined;

  rootStore: RootStore;

  issues: IIssueStore;

  state: IStateStore;

  issueDetail: IIssueDetail;

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

  issueKanBanView: IIssueKanBanViewStore;
  issueCalendarView: ICalendarStore;

  constructor(rootStore: RootStore) {
    makeObservable(this, {
      workspaceSlug: observable.ref,
      projectId: observable.ref,
      cycleId: observable.ref,
      moduleId: observable.ref,
      viewId: observable.ref,
      userId: observable.ref,
      globalViewId: observable.ref,
      stateMap: observable,
      stateDetails: observable,
      labelMap: observable,
      memberMap: observable,
      workSpaceMemberRolesMap: observable,
      projectMap: observable,
    });

    this.rootStore = rootStore;

    autorun(() => {
      if (rootStore.user.currentUser?.id) this.currentUserId = rootStore.user.currentUser?.id;
      if (rootStore.app.router.workspaceSlug) this.workspaceSlug = rootStore.app.router.workspaceSlug;
      if (rootStore.app.router.projectId) this.projectId = rootStore.app.router.projectId;
      if (rootStore.app.router.cycleId) this.cycleId = rootStore.app.router.cycleId;
      if (rootStore.app.router.moduleId) this.moduleId = rootStore.app.router.moduleId;
      if (rootStore.app.router.viewId) this.viewId = rootStore.app.router.viewId;
      if (rootStore.app.router.globalViewId) this.globalViewId = rootStore.app.router.globalViewId;
      if (rootStore.app.router.userId) this.userId = rootStore.app.router.userId;
      if (!isEmpty(rootStore?.state?.stateMap)) this.stateMap = rootStore?.state?.stateMap;
      if (!isEmpty(rootStore?.state?.projectStates)) this.stateDetails = rootStore?.state?.projectStates;
      if (!isEmpty(rootStore?.label?.labelMap)) this.labelMap = rootStore?.label?.labelMap;
      if (!isEmpty(rootStore?.memberRoot?.workspace?.workspaceMemberMap))
        this.workSpaceMemberRolesMap = rootStore?.memberRoot?.workspace?.memberMap || undefined;
      if (!isEmpty(rootStore?.memberRoot?.memberMap)) this.memberMap = rootStore?.memberRoot?.memberMap || undefined;
      if (!isEmpty(rootStore?.projectRoot?.project?.projectMap))
        this.projectMap = rootStore?.projectRoot?.project?.projectMap;
    });

    this.issues = new IssueStore();

    this.state = new StateStore(rootStore);

    this.issueDetail = new IssueDetail(this);

    this.workspaceIssuesFilter = new WorkspaceIssuesFilter(this);
    this.workspaceIssues = new WorkspaceIssues(this);

    this.profileIssuesFilter = new ProfileIssuesFilter(this);
    this.profileIssues = new ProfileIssues(this);

    this.projectIssuesFilter = new ProjectIssuesFilter(this);
    this.projectIssues = new ProjectIssues(this);

    this.cycleIssuesFilter = new CycleIssuesFilter(this);
    this.cycleIssues = new CycleIssues(this);

    this.moduleIssuesFilter = new ModuleIssuesFilter(this);
    this.moduleIssues = new ModuleIssues(this);

    this.projectViewIssuesFilter = new ProjectViewIssuesFilter(this);
    this.projectViewIssues = new ProjectViewIssues(this);

    this.archivedIssuesFilter = new ArchivedIssuesFilter(this);
    this.archivedIssues = new ArchivedIssues(this);

    this.draftIssuesFilter = new DraftIssuesFilter(this);
    this.draftIssues = new DraftIssues(this);

    this.issueKanBanView = new IssueKanBanViewStore(this);
    this.issueCalendarView = new CalendarStore();
  }
}
