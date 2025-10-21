import { isEmpty } from "lodash-es";
import { reaction, runInAction, makeObservable, observable } from "mobx";
// types
import type { ICycle, IIssueLabel, IModule, IProject, IState, IUserLite, TIssueServiceType } from "@plane/types";
import { EIssueServiceType } from "@plane/types";
// plane web store
import type { IProjectEpics, IProjectEpicsFilter } from "@/plane-web/store/issue/epic";
import { ProjectEpics, ProjectEpicsFilter } from "@/plane-web/store/issue/epic";
import type { IIssueDetail } from "@/plane-web/store/issue/issue-details/root.store";
import { IssueDetail } from "@/plane-web/store/issue/issue-details/root.store";
import type { ITeamIssuesFilter, ITeamIssues } from "@/plane-web/store/issue/team";
import { TeamIssues, TeamIssuesFilter } from "@/plane-web/store/issue/team";
import type { ITeamProjectWorkItemsFilter } from "@/plane-web/store/issue/team-project/filter.store";
import { TeamProjectWorkItemsFilter } from "@/plane-web/store/issue/team-project/filter.store";
import type { ITeamProjectWorkItems } from "@/plane-web/store/issue/team-project/issue.store";
import { TeamProjectWorkItems } from "@/plane-web/store/issue/team-project/issue.store";
import type { ITeamViewIssues, ITeamViewIssuesFilter } from "@/plane-web/store/issue/team-views";
import { TeamViewIssues, TeamViewIssuesFilter } from "@/plane-web/store/issue/team-views";
// root store
import type { IWorkspaceIssues } from "@/plane-web/store/issue/workspace/issue.store";
import { WorkspaceIssues } from "@/plane-web/store/issue/workspace/issue.store";
import type { RootStore } from "@/plane-web/store/root.store";
import type { IWorkspaceMembership } from "@/store/member/workspace/workspace-member.store";
// issues data store
import type { IArchivedIssuesFilter, IArchivedIssues } from "./archived";
import { ArchivedIssuesFilter, ArchivedIssues } from "./archived";
import type { ICycleIssuesFilter, ICycleIssues } from "./cycle";
import { CycleIssuesFilter, CycleIssues } from "./cycle";
import type { IIssueStore } from "./issue.store";
import { IssueStore } from "./issue.store";
import type { ICalendarStore } from "./issue_calendar_view.store";
import { CalendarStore } from "./issue_calendar_view.store";
import type { IIssueKanBanViewStore } from "./issue_kanban_view.store";
import { IssueKanBanViewStore } from "./issue_kanban_view.store";
import type { IModuleIssuesFilter, IModuleIssues } from "./module";
import { ModuleIssuesFilter, ModuleIssues } from "./module";
import type { IProfileIssuesFilter, IProfileIssues } from "./profile";
import { ProfileIssuesFilter, ProfileIssues } from "./profile";
import type { IProjectIssuesFilter, IProjectIssues } from "./project";
import { ProjectIssuesFilter, ProjectIssues } from "./project";
import type { IProjectViewIssuesFilter, IProjectViewIssues } from "./project-views";
import { ProjectViewIssuesFilter, ProjectViewIssues } from "./project-views";
import type { IWorkspaceIssuesFilter } from "./workspace";
import { WorkspaceIssuesFilter } from "./workspace";
import type { IWorkspaceDraftIssues, IWorkspaceDraftIssuesFilter } from "./workspace-draft";
import { WorkspaceDraftIssues, WorkspaceDraftIssuesFilter } from "./workspace-draft";

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

  teamProjectWorkItemsFilter: ITeamProjectWorkItemsFilter;
  teamProjectWorkItems: ITeamProjectWorkItems;

  projectViewIssuesFilter: IProjectViewIssuesFilter;
  projectViewIssues: IProjectViewIssues;

  archivedIssuesFilter: IArchivedIssuesFilter;
  archivedIssues: IArchivedIssues;

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

  teamProjectWorkItemsFilter: ITeamProjectWorkItemsFilter;
  teamProjectWorkItems: ITeamProjectWorkItems;

  archivedIssuesFilter: IArchivedIssuesFilter;
  archivedIssues: IArchivedIssues;

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

    // initialize values asynchronously to avoid updates during render
    const setAsync = (fn: () => void) => queueMicrotask(fn);

    setAsync(() =>
      runInAction(() => {
        if (rootStore?.user?.data?.id) this.currentUserId = rootStore?.user?.data?.id;
        this.workspaceSlug = rootStore.router.workspaceSlug;
        this.teamspaceId = rootStore.router.teamspaceId;
        this.projectId = rootStore.router.projectId;
        this.cycleId = rootStore.router.cycleId;
        this.moduleId = rootStore.router.moduleId;
        this.viewId = rootStore.router.viewId;
        this.globalViewId = rootStore.router.globalViewId;
        this.userId = rootStore.router.userId;

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
      })
    );

    // reactions to keep values in sync without violating strict-mode
    reaction(
      () => rootStore?.user?.data?.id,
      (id) => setAsync(() => runInAction(() => void (this.currentUserId = id)))
    );

    reaction(
      () => rootStore.router.workspaceSlug,
      (v) => setAsync(() => runInAction(() => void (this.workspaceSlug = v)))
    );
    reaction(
      () => rootStore.router.teamspaceId,
      (v) => setAsync(() => runInAction(() => void (this.teamspaceId = v)))
    );
    reaction(
      () => rootStore.router.projectId,
      (v) => setAsync(() => runInAction(() => void (this.projectId = v)))
    );
    reaction(
      () => rootStore.router.cycleId,
      (v) => setAsync(() => runInAction(() => void (this.cycleId = v)))
    );
    reaction(
      () => rootStore.router.moduleId,
      (v) => setAsync(() => runInAction(() => void (this.moduleId = v)))
    );
    reaction(
      () => rootStore.router.viewId,
      (v) => setAsync(() => runInAction(() => void (this.viewId = v)))
    );
    reaction(
      () => rootStore.router.globalViewId,
      (v) => setAsync(() => runInAction(() => void (this.globalViewId = v)))
    );
    reaction(
      () => rootStore.router.userId,
      (v) => setAsync(() => runInAction(() => void (this.userId = v)))
    );

    reaction(
      () => rootStore?.state?.stateMap,
      (map) => setAsync(() => runInAction(() => void (this.stateMap = isEmpty(map) ? this.stateMap : map)))
    );
    reaction(
      () => rootStore?.state?.projectStates,
      (list) => setAsync(() => runInAction(() => void (this.stateDetails = isEmpty(list) ? this.stateDetails : list)))
    );
    reaction(
      () => rootStore?.state?.workspaceStates,
      (list) =>
        setAsync(() =>
          runInAction(() => void (this.workspaceStateDetails = isEmpty(list) ? this.workspaceStateDetails : list))
        )
    );
    reaction(
      () => rootStore?.label?.labelMap,
      (map) => setAsync(() => runInAction(() => void (this.labelMap = isEmpty(map) ? this.labelMap : map)))
    );
    reaction(
      () => rootStore?.memberRoot?.workspace?.workspaceMemberMap,
      () =>
        setAsync(() =>
          runInAction(() => {
            this.workSpaceMemberRolesMap = rootStore?.memberRoot?.workspace?.memberMap || undefined;
          })
        )
    );
    reaction(
      () => rootStore?.memberRoot?.memberMap,
      (map) => setAsync(() => runInAction(() => void (this.memberMap = isEmpty(map) ? this.memberMap : map)))
    );
    reaction(
      () => rootStore?.projectRoot?.project?.projectMap,
      (map) => setAsync(() => runInAction(() => void (this.projectMap = isEmpty(map) ? this.projectMap : map)))
    );
    reaction(
      () => rootStore?.module?.moduleMap,
      (map) => setAsync(() => runInAction(() => void (this.moduleMap = isEmpty(map) ? this.moduleMap : map)))
    );
    reaction(
      () => rootStore?.cycle?.cycleMap,
      (map) => setAsync(() => runInAction(() => void (this.cycleMap = isEmpty(map) ? this.cycleMap : map)))
    );

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

    this.teamProjectWorkItemsFilter = new TeamProjectWorkItemsFilter(this);
    this.teamProjectWorkItems = new TeamProjectWorkItems(this, this.teamProjectWorkItemsFilter);

    this.archivedIssuesFilter = new ArchivedIssuesFilter(this);
    this.archivedIssues = new ArchivedIssues(this, this.archivedIssuesFilter);

    this.issueKanBanView = new IssueKanBanViewStore(this);
    this.issueCalendarView = new CalendarStore();

    this.projectEpicsFilter = new ProjectEpicsFilter(this);
    this.projectEpics = new ProjectEpics(this, this.projectEpicsFilter);
  }
}
