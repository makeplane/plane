import isEmpty from "lodash/isEmpty";
import { autorun, makeObservable, observable } from "mobx";
// types
import {
  EIssueServiceType,
  ICycle,
  IIssueLabel,
  IModule,
  IProject,
  IState,
  IUserLite,
  TIssueServiceType,
} from "@plane/types";
// plane web store
import { IProjectEpics, IProjectEpicsFilter, ProjectEpics, ProjectEpicsFilter } from "@/plane-web/store/issue/epic";
import { IIssueDetail, IssueDetail } from "@/plane-web/store/issue/issue-details/root.store";
import { ITeamIssuesFilter, ITeamIssues, TeamIssues, TeamIssuesFilter } from "@/plane-web/store/issue/team";
import {
  ITeamViewIssues,
  ITeamViewIssuesFilter,
  TeamViewIssues,
  TeamViewIssuesFilter,
} from "@/plane-web/store/issue/team-views";
// root store
import { IWorkspaceIssues, WorkspaceIssues } from "@/plane-web/store/issue/workspace/issue.store";
import { RootStore } from "@/plane-web/store/root.store";
import { IWorkspaceMembership } from "@/store/member/workspace-member.store";
// issues data store
import { IArchivedIssuesFilter, ArchivedIssuesFilter, IArchivedIssues, ArchivedIssues } from "./archived";
import { ICycleIssuesFilter, CycleIssuesFilter, ICycleIssues, CycleIssues } from "./cycle";
import { IDraftIssuesFilter, DraftIssuesFilter, IDraftIssues, DraftIssues } from "./draft";
import { IIssueStore, IssueStore } from "./issue.store";
import { ICalendarStore, CalendarStore } from "./issue_calendar_view.store";
import { IIssueKanBanViewStore, IssueKanBanViewStore } from "./issue_kanban_view.store";
import { IModuleIssuesFilter, ModuleIssuesFilter, IModuleIssues, ModuleIssues } from "./module";
import { IProfileIssuesFilter, ProfileIssuesFilter, IProfileIssues, ProfileIssues } from "./profile";
import { IProjectIssuesFilter, ProjectIssuesFilter, IProjectIssues, ProjectIssues } from "./project";
import {
  IProjectViewIssuesFilter,
  ProjectViewIssuesFilter,
  IProjectViewIssues,
  ProjectViewIssues,
} from "./project-views";
import { WorkspaceIssuesFilter, IWorkspaceIssuesFilter } from "./workspace";
import {
  IWorkspaceDraftIssues,
  IWorkspaceDraftIssuesFilter,
  WorkspaceDraftIssues,
  WorkspaceDraftIssuesFilter,
} from "./workspace-draft";

export interface IIssueRootStore {
  currentUserId: string | undefined;
  workspaceSlug: string | undefined;
  teamspaceId: string | undefined;
  projectId: string | undefined;
  cycleId: string | undefined;
  moduleId: string | undefined;
  viewId: string | undefined;
  globalViewId: string | undefined; // all issues view id
  userId: string | undefined; // user profile detail Id
  stateMap: Record<string, IState> | undefined;
  stateDetails: IState[] | undefined;
  workspaceStateDetails: IState[] | undefined;
  labelMap: Record<string, IIssueLabel> | undefined;
  workSpaceMemberRolesMap: Record<string, IWorkspaceMembership> | undefined;
  memberMap: Record<string, IUserLite> | undefined;
  projectMap: Record<string, IProject> | undefined;
  moduleMap: Record<string, IModule> | undefined;
  cycleMap: Record<string, ICycle> | undefined;

  rootStore: RootStore;
  serviceType: TIssueServiceType;

  issues: IIssueStore;

  issueDetail: IIssueDetail;
  epicDetail: IIssueDetail;

  workspaceIssuesFilter: IWorkspaceIssuesFilter;
  workspaceIssues: IWorkspaceIssues;

  workspaceDraftIssuesFilter: IWorkspaceDraftIssuesFilter;
  workspaceDraftIssues: IWorkspaceDraftIssues;

  profileIssuesFilter: IProfileIssuesFilter;
  profileIssues: IProfileIssues;

  teamIssuesFilter: ITeamIssuesFilter;
  teamIssues: ITeamIssues;

  projectIssuesFilter: IProjectIssuesFilter;
  projectIssues: IProjectIssues;

  cycleIssuesFilter: ICycleIssuesFilter;
  cycleIssues: ICycleIssues;

  moduleIssuesFilter: IModuleIssuesFilter;
  moduleIssues: IModuleIssues;

  teamViewIssuesFilter: ITeamViewIssuesFilter;
  teamViewIssues: ITeamViewIssues;

  projectViewIssuesFilter: IProjectViewIssuesFilter;
  projectViewIssues: IProjectViewIssues;

  archivedIssuesFilter: IArchivedIssuesFilter;
  archivedIssues: IArchivedIssues;

  draftIssuesFilter: IDraftIssuesFilter;
  draftIssues: IDraftIssues;

  issueKanBanView: IIssueKanBanViewStore;
  issueCalendarView: ICalendarStore;

  projectEpicsFilter: IProjectEpicsFilter;
  projectEpics: IProjectEpics;
}

export class IssueRootStore implements IIssueRootStore {
  currentUserId: string | undefined = undefined;
  workspaceSlug: string | undefined = undefined;
  teamspaceId: string | undefined = undefined;
  projectId: string | undefined = undefined;
  cycleId: string | undefined = undefined;
  moduleId: string | undefined = undefined;
  viewId: string | undefined = undefined;
  globalViewId: string | undefined = undefined;
  userId: string | undefined = undefined;
  stateMap: Record<string, IState> | undefined = undefined;
  stateDetails: IState[] | undefined = undefined;
  workspaceStateDetails: IState[] | undefined = undefined;
  labelMap: Record<string, IIssueLabel> | undefined = undefined;
  workSpaceMemberRolesMap: Record<string, IWorkspaceMembership> | undefined = undefined;
  memberMap: Record<string, IUserLite> | undefined = undefined;
  projectMap: Record<string, IProject> | undefined = undefined;
  moduleMap: Record<string, IModule> | undefined = undefined;
  cycleMap: Record<string, ICycle> | undefined = undefined;

  rootStore: RootStore;
  serviceType: TIssueServiceType;

  issues: IIssueStore;

  issueDetail: IIssueDetail;
  epicDetail: IIssueDetail;

  workspaceIssuesFilter: IWorkspaceIssuesFilter;
  workspaceIssues: IWorkspaceIssues;

  workspaceDraftIssuesFilter: IWorkspaceDraftIssuesFilter;
  workspaceDraftIssues: IWorkspaceDraftIssues;

  profileIssuesFilter: IProfileIssuesFilter;
  profileIssues: IProfileIssues;

  teamIssuesFilter: ITeamIssuesFilter;
  teamIssues: ITeamIssues;

  projectIssuesFilter: IProjectIssuesFilter;
  projectIssues: IProjectIssues;

  cycleIssuesFilter: ICycleIssuesFilter;
  cycleIssues: ICycleIssues;

  moduleIssuesFilter: IModuleIssuesFilter;
  moduleIssues: IModuleIssues;

  teamViewIssuesFilter: ITeamViewIssuesFilter;
  teamViewIssues: ITeamViewIssues;

  projectViewIssuesFilter: IProjectViewIssuesFilter;
  projectViewIssues: IProjectViewIssues;

  archivedIssuesFilter: IArchivedIssuesFilter;
  archivedIssues: IArchivedIssues;

  draftIssuesFilter: IDraftIssuesFilter;
  draftIssues: IDraftIssues;

  issueKanBanView: IIssueKanBanViewStore;
  issueCalendarView: ICalendarStore;

  projectEpicsFilter: IProjectEpicsFilter;
  projectEpics: IProjectEpics;

  constructor(rootStore: RootStore, serviceType: TIssueServiceType = EIssueServiceType.ISSUES) {
    makeObservable(this, {
      workspaceSlug: observable.ref,
      teamspaceId: observable.ref,
      projectId: observable.ref,
      cycleId: observable.ref,
      moduleId: observable.ref,
      viewId: observable.ref,
      userId: observable.ref,
      globalViewId: observable.ref,
      stateMap: observable,
      stateDetails: observable,
      workspaceStateDetails: observable,
      labelMap: observable,
      memberMap: observable,
      workSpaceMemberRolesMap: observable,
      projectMap: observable,
      moduleMap: observable,
      cycleMap: observable,
    });

    this.serviceType = serviceType;
    this.rootStore = rootStore;

    autorun(() => {
      if (rootStore?.user?.data?.id) this.currentUserId = rootStore?.user?.data?.id;
      if (this.workspaceSlug !== rootStore.router.workspaceSlug) this.workspaceSlug = rootStore.router.workspaceSlug;
      if (this.teamspaceId !== rootStore.router.teamspaceId) this.teamspaceId = rootStore.router.teamspaceId;
      if (this.projectId !== rootStore.router.projectId) this.projectId = rootStore.router.projectId;
      if (this.cycleId !== rootStore.router.cycleId) this.cycleId = rootStore.router.cycleId;
      if (this.moduleId !== rootStore.router.moduleId) this.moduleId = rootStore.router.moduleId;
      if (this.viewId !== rootStore.router.viewId) this.viewId = rootStore.router.viewId;
      if (this.globalViewId !== rootStore.router.globalViewId) this.globalViewId = rootStore.router.globalViewId;
      if (this.userId !== rootStore.router.userId) this.userId = rootStore.router.userId;
      if (!isEmpty(rootStore?.state?.stateMap)) this.stateMap = rootStore?.state?.stateMap;
      if (!isEmpty(rootStore?.state?.projectStates)) this.stateDetails = rootStore?.state?.projectStates;
      if (!isEmpty(rootStore?.state?.workspaceStates)) this.workspaceStateDetails = rootStore?.state?.workspaceStates;
      if (!isEmpty(rootStore?.label?.labelMap)) this.labelMap = rootStore?.label?.labelMap;
      if (!isEmpty(rootStore?.memberRoot?.workspace?.workspaceMemberMap))
        this.workSpaceMemberRolesMap = rootStore?.memberRoot?.workspace?.memberMap || undefined;
      if (!isEmpty(rootStore?.memberRoot?.memberMap)) this.memberMap = rootStore?.memberRoot?.memberMap || undefined;
      if (!isEmpty(rootStore?.projectRoot?.project?.projectMap))
        this.projectMap = rootStore?.projectRoot?.project?.projectMap;
      if (!isEmpty(rootStore?.module?.moduleMap)) this.moduleMap = rootStore?.module?.moduleMap;
      if (!isEmpty(rootStore?.cycle?.cycleMap)) this.cycleMap = rootStore?.cycle?.cycleMap;
    });

    this.issues = new IssueStore();

    this.issueDetail = new IssueDetail(this, EIssueServiceType.ISSUES);
    this.epicDetail = new IssueDetail(this, EIssueServiceType.EPICS);

    this.workspaceIssuesFilter = new WorkspaceIssuesFilter(this);
    this.workspaceIssues = new WorkspaceIssues(this, this.workspaceIssuesFilter);

    this.profileIssuesFilter = new ProfileIssuesFilter(this);
    this.profileIssues = new ProfileIssues(this, this.profileIssuesFilter);

    this.workspaceDraftIssuesFilter = new WorkspaceDraftIssuesFilter(this);
    this.workspaceDraftIssues = new WorkspaceDraftIssues(this);

    this.projectIssuesFilter = new ProjectIssuesFilter(this);
    this.projectIssues = new ProjectIssues(this, this.projectIssuesFilter);

    this.teamIssuesFilter = new TeamIssuesFilter(this);
    this.teamIssues = new TeamIssues(this, this.teamIssuesFilter);

    this.cycleIssuesFilter = new CycleIssuesFilter(this);
    this.cycleIssues = new CycleIssues(this, this.cycleIssuesFilter);

    this.moduleIssuesFilter = new ModuleIssuesFilter(this);
    this.moduleIssues = new ModuleIssues(this, this.moduleIssuesFilter);

    this.teamViewIssuesFilter = new TeamViewIssuesFilter(this);
    this.teamViewIssues = new TeamViewIssues(this, this.teamViewIssuesFilter);

    this.projectViewIssuesFilter = new ProjectViewIssuesFilter(this);
    this.projectViewIssues = new ProjectViewIssues(this, this.projectViewIssuesFilter);

    this.archivedIssuesFilter = new ArchivedIssuesFilter(this);
    this.archivedIssues = new ArchivedIssues(this, this.archivedIssuesFilter);

    this.draftIssuesFilter = new DraftIssuesFilter(this);
    this.draftIssues = new DraftIssues(this, this.draftIssuesFilter);

    this.issueKanBanView = new IssueKanBanViewStore(this);
    this.issueCalendarView = new CalendarStore();

    this.projectEpicsFilter = new ProjectEpicsFilter(this);
    this.projectEpics = new ProjectEpics(this, this.projectEpicsFilter);
  }
}
