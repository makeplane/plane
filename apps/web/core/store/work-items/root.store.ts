/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import { isEmpty } from "lodash-es";
import { autorun, makeObservable, observable } from "mobx";
// types
import type { ICycle, IIssueLabel, IModule, IProject, IState, IUserLite, TIssueServiceType } from "@plane/types";
import { EIssueServiceType } from "@plane/types";
// plane web store
import type { IProjectEpics, IProjectEpicsFilter } from "@/store/work-items/epic";
import { ProjectEpics, ProjectEpicsFilter } from "@/store/work-items/epic";
import type { IIssueDetail } from "@/store/work-items/details/root.store";
import { IssueDetail } from "@/store/work-items/details/root.store";
import type { ITeamIssuesFilter, ITeamIssues } from "@/store/work-items/team";
import { TeamIssues, TeamIssuesFilter } from "@/store/work-items/team";
import type { ITeamProjectWorkItemsFilter } from "@/store/work-items/team-project/filter.store";
import { TeamProjectWorkItemsFilter } from "@/store/work-items/team-project/filter.store";
import type { ITeamProjectWorkItems } from "@/store/work-items/team-project/issue.store";
import { TeamProjectWorkItems } from "@/store/work-items/team-project/issue.store";
import type { ITeamViewIssues, ITeamViewIssuesFilter } from "@/store/work-items/team-views";
import { TeamViewIssues, TeamViewIssuesFilter } from "@/store/work-items/team-views";
// root store
import type { IWorkspaceIssues } from "@/store/work-items/workspace/issue.store";
import { WorkspaceIssues } from "@/store/work-items/workspace/issue.store";
import type { RootStore } from "@/plane-web/store/root.store";
import type { WorkspaceMembership } from "@/store/member/workspace/types";
// issues data store
import type { IArchivedIssuesFilter, IArchivedIssues } from "./archived";
import { ArchivedIssuesFilter, ArchivedIssues } from "./archived";
import type { IArchivedEpics, IArchivedEpicsFilter } from "../issue/archived-epics";
import { ArchivedEpicsFilter, ArchivedEpics } from "../issue/archived-epics";
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
import type { AdditionalWorkItemPermissionMeta, WorkItemPermissions } from "./permissions/root";
import { WorkItemPermissionsInstance } from "./permissions/root";
import type { IReleaseIssuesFilter, IReleaseIssues } from "./release";
import { ReleaseIssuesFilter, ReleaseIssues } from "./release";

export interface IIssueRootStore {
  currentUserId: string | undefined;
  workspaceSlug: string | undefined;
  teamspaceId: string | undefined;
  projectId: string | undefined;
  cycleId: string | undefined;
  moduleId: string | undefined;
  releaseId: string | undefined;
  viewId: string | undefined;
  globalViewId: string | undefined; // all issues view id
  userId: string | undefined; // user profile detail Id
  stateMap: Record<string, IState> | undefined;
  stateDetails: IState[] | undefined;
  workspaceStateDetails: IState[] | undefined;
  labelMap: Record<string, IIssueLabel> | undefined;
  workSpaceMemberRolesMap: Record<string, WorkspaceMembership> | undefined;
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

  archivedEpicsFilter: IArchivedEpicsFilter;
  archivedEpics: IArchivedEpics;

  releaseIssuesFilter: IReleaseIssuesFilter;
  releaseIssues: IReleaseIssues;

  issueKanBanView: IIssueKanBanViewStore;
  issueCalendarView: ICalendarStore;

  projectEpicsFilter: IProjectEpicsFilter;
  projectEpics: IProjectEpics;

  permissions: WorkItemPermissions;
}

export class IssueRootStore implements IIssueRootStore {
  currentUserId: string | undefined = undefined;
  workspaceSlug: string | undefined = undefined;
  teamspaceId: string | undefined = undefined;
  projectId: string | undefined = undefined;
  cycleId: string | undefined = undefined;
  moduleId: string | undefined = undefined;
  releaseId: string | undefined = undefined;
  viewId: string | undefined = undefined;
  globalViewId: string | undefined = undefined;
  userId: string | undefined = undefined;
  stateMap: Record<string, IState> | undefined = undefined;
  stateDetails: IState[] | undefined = undefined;
  workspaceStateDetails: IState[] | undefined = undefined;
  labelMap: Record<string, IIssueLabel> | undefined = undefined;
  workSpaceMemberRolesMap: Record<string, WorkspaceMembership> | undefined = undefined;
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

  teamProjectWorkItemsFilter: ITeamProjectWorkItemsFilter;
  teamProjectWorkItems: ITeamProjectWorkItems;

  projectViewIssuesFilter: IProjectViewIssuesFilter;
  projectViewIssues: IProjectViewIssues;

  archivedIssuesFilter: IArchivedIssuesFilter;
  archivedIssues: IArchivedIssues;

  archivedEpicsFilter: IArchivedEpicsFilter;
  archivedEpics: IArchivedEpics;

  releaseIssuesFilter: IReleaseIssuesFilter;
  releaseIssues: IReleaseIssues;

  issueKanBanView: IIssueKanBanViewStore;
  issueCalendarView: ICalendarStore;

  projectEpicsFilter: IProjectEpicsFilter;
  projectEpics: IProjectEpics;

  permissions: WorkItemPermissions;

  constructor(rootStore: RootStore, serviceType: TIssueServiceType = EIssueServiceType.ISSUES) {
    makeObservable(this, {
      workspaceSlug: observable.ref,
      teamspaceId: observable.ref,
      projectId: observable.ref,
      cycleId: observable.ref,
      moduleId: observable.ref,
      releaseId: observable.ref,
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
      if (this.releaseId !== rootStore.router.releaseId) this.releaseId = rootStore.router.releaseId;
      if (this.viewId !== rootStore.router.viewId) this.viewId = rootStore.router.viewId;
      if (this.globalViewId !== rootStore.router.globalViewId) this.globalViewId = rootStore.router.globalViewId;
      if (this.userId !== rootStore.router.userId) this.userId = rootStore.router.userId;
      if (!isEmpty(rootStore?.state?.stateMap)) this.stateMap = rootStore?.state?.stateMap;
      if (!isEmpty(rootStore?.state?.projectStates)) this.stateDetails = rootStore?.state?.projectStates;
      if (!isEmpty(rootStore?.state?.workspaceStates)) this.workspaceStateDetails = rootStore?.state?.workspaceStates;
      if (!isEmpty(rootStore?.label?.labelMap)) this.labelMap = rootStore?.label?.labelMap;
      if (!isEmpty(rootStore?.memberRoot?.workspace?.workspaceMemberMap))
        this.workSpaceMemberRolesMap = rootStore?.memberRoot?.workspace?.memberMap || undefined;
      if (!isEmpty(rootStore?.projectRoot?.project?.projectMap))
        this.projectMap = rootStore?.projectRoot?.project?.projectMap;
      if (!isEmpty(rootStore?.module?.moduleMap)) this.moduleMap = rootStore?.module?.moduleMap;
      if (!isEmpty(rootStore?.cycle?.cycleMap)) this.cycleMap = rootStore?.cycle?.cycleMap;
    });

    this.issues = new IssueStore();

    this.permissions = new WorkItemPermissionsInstance({
      can: rootStore.permissionAccessStore.can,
      getWorkItemConditionContext: this.getWorkItemConditionContext.bind(this),
      getWorkItemCommentConditionContext: this.getWorkItemCommentConditionContext.bind(this),
      getAdditionalWorkItemPermissionMeta: this.getAdditionalWorkItemPermissionMeta.bind(this),
    });

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

    this.teamProjectWorkItemsFilter = new TeamProjectWorkItemsFilter(this);
    this.teamProjectWorkItems = new TeamProjectWorkItems(this, this.teamProjectWorkItemsFilter);

    this.projectViewIssuesFilter = new ProjectViewIssuesFilter(this);
    this.projectViewIssues = new ProjectViewIssues(this, this.projectViewIssuesFilter);

    this.archivedIssuesFilter = new ArchivedIssuesFilter(this);
    this.archivedIssues = new ArchivedIssues(this, this.archivedIssuesFilter);

    this.archivedEpicsFilter = new ArchivedEpicsFilter(this);
    this.archivedEpics = new ArchivedEpics(this, this.archivedEpicsFilter);

    this.releaseIssuesFilter = new ReleaseIssuesFilter(this);
    this.releaseIssues = new ReleaseIssues(this, this.releaseIssuesFilter);

    this.issueKanBanView = new IssueKanBanViewStore(this);
    this.issueCalendarView = new CalendarStore(this);

    this.projectEpicsFilter = new ProjectEpicsFilter(this);
    this.projectEpics = new ProjectEpics(this, this.projectEpicsFilter);
  }

  private getWorkItemConditionContext(issueId: string): { creator: boolean } {
    const issue = this.issues.getIssueById(issueId);
    const currentUserId = this.rootStore.user.data?.id;
    return { creator: !!(issue?.created_by && currentUserId && issue.created_by === currentUserId) };
  }

  private getWorkItemCommentConditionContext(_workItemId: string, commentId: string): { creator: boolean } {
    const comment = this.issueDetail.comment.getCommentById(commentId);
    const currentUserId = this.rootStore.user.data?.id;
    return { creator: !!(comment?.created_by && currentUserId && comment.created_by === currentUserId) };
  }

  private getAdditionalWorkItemPermissionMeta(workItemId: string): AdditionalWorkItemPermissionMeta {
    const workItem = this.issues.getIssueById(workItemId);
    if (!workItem) return { isArchived: false, isIntakeWorkItem: false };
    return { isArchived: !!workItem.archived_at, isIntakeWorkItem: !!workItem.is_intake };
  }
}
