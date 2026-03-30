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

import { useContext } from "react";
import { merge } from "lodash-es";
import { EIssuesStoreType } from "@plane/types";
import type { TIssue } from "@plane/types";
import { StoreContext } from "@/lib/store-context";
// plane web types
import type { IProjectEpics, IProjectEpicsFilter } from "@/store/work-items/epic";
import type { IInitiativeEpicStore } from "@/store/initiatives/initiative-epics.store";
import type { IInitiativeEpicsFilterStore } from "@/store/initiatives/initiative-epics-filter.store";
// types
import type { ITeamIssues, ITeamIssuesFilter } from "@/store/work-items/team";
import type { ITeamProjectWorkItemsFilter, ITeamProjectWorkItems } from "@/store/work-items/team-project";
import type { ITeamViewIssues, ITeamViewIssuesFilter } from "@/store/work-items/team-views";
import type { IWorkspaceIssues } from "@/store/work-items/workspace/issue.store";
import type { IArchivedIssues, IArchivedIssuesFilter } from "@/store/work-items/archived";
import type { IArchivedEpics, IArchivedEpicsFilter } from "@/store/issue/archived-epics";
import type { ICycleIssues, ICycleIssuesFilter } from "@/store/work-items/cycle";
import type { IModuleIssues, IModuleIssuesFilter } from "@/store/work-items/module";
import type { IProfileIssues, IProfileIssuesFilter } from "@/store/work-items/profile";
import type { IProjectIssues, IProjectIssuesFilter } from "@/store/work-items/project";
import type { IProjectViewIssues, IProjectViewIssuesFilter } from "@/store/work-items/project-views";
import type { IWorkspaceIssuesFilter } from "@/store/work-items/workspace";
import type { IWorkspaceDraftIssues, IWorkspaceDraftIssuesFilter } from "@/store/work-items/workspace-draft";
import type { IReleaseIssues, IReleaseIssuesFilter } from "@/store/work-items/release";
// constants

type defaultIssueStore = {
  getWorkItemById: (workItemId: string) => TIssue | undefined;
};

export type TStoreIssues = {
  [EIssuesStoreType.GLOBAL]: defaultIssueStore & {
    issues: IWorkspaceIssues;
    issuesFilter: IWorkspaceIssuesFilter;
  };
  [EIssuesStoreType.WORKSPACE_DRAFT]: defaultIssueStore & {
    issues: IWorkspaceDraftIssues;
    issuesFilter: IWorkspaceDraftIssuesFilter;
  };
  [EIssuesStoreType.PROFILE]: defaultIssueStore & {
    issues: IProfileIssues;
    issuesFilter: IProfileIssuesFilter;
  };
  [EIssuesStoreType.TEAM]: defaultIssueStore & {
    issues: ITeamIssues;
    issuesFilter: ITeamIssuesFilter;
  };
  [EIssuesStoreType.PROJECT]: defaultIssueStore & {
    issues: IProjectIssues;
    issuesFilter: IProjectIssuesFilter;
  };
  [EIssuesStoreType.CYCLE]: defaultIssueStore & {
    issues: ICycleIssues;
    issuesFilter: ICycleIssuesFilter;
  };
  [EIssuesStoreType.MODULE]: defaultIssueStore & {
    issues: IModuleIssues;
    issuesFilter: IModuleIssuesFilter;
  };
  [EIssuesStoreType.TEAM_VIEW]: defaultIssueStore & {
    issues: ITeamViewIssues;
    issuesFilter: ITeamViewIssuesFilter;
  };
  [EIssuesStoreType.PROJECT_VIEW]: defaultIssueStore & {
    issues: IProjectViewIssues;
    issuesFilter: IProjectViewIssuesFilter;
  };
  [EIssuesStoreType.ARCHIVED]: defaultIssueStore & {
    issues: IArchivedIssues;
    issuesFilter: IArchivedIssuesFilter;
  };
  [EIssuesStoreType.ARCHIVED_EPIC]: defaultIssueStore & {
    issues: IArchivedEpics;
    issuesFilter: IArchivedEpicsFilter;
  };
  [EIssuesStoreType.DEFAULT]: defaultIssueStore & {
    issues: IProjectIssues;
    issuesFilter: IProjectIssuesFilter;
  };
  [EIssuesStoreType.EPIC]: defaultIssueStore & {
    issues: IProjectEpics;
    issuesFilter: IProjectEpicsFilter;
  };
  [EIssuesStoreType.TEAM_PROJECT_WORK_ITEMS]: defaultIssueStore & {
    issues: ITeamProjectWorkItems;
    issuesFilter: ITeamProjectWorkItemsFilter;
  };
  [EIssuesStoreType.INITIATIVE_EPIC]: defaultIssueStore & {
    issues: IInitiativeEpicStore;
    issuesFilter: IInitiativeEpicsFilterStore;
  };
  [EIssuesStoreType.RELEASE]: defaultIssueStore & {
    issues: IReleaseIssues;
    issuesFilter: IReleaseIssuesFilter;
  };
};

export const useIssues = <T extends EIssuesStoreType>(storeType?: T): TStoreIssues[T] => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("useIssues must be used within StoreProvider");

  const defaultStore: defaultIssueStore = {
    getWorkItemById: (workItemId: string) => context.issue.issues.getIssueById(workItemId),
  };

  switch (storeType) {
    case EIssuesStoreType.GLOBAL:
      return merge(defaultStore, {
        issues: context.issue.workspaceIssues,
        issuesFilter: context.issue.workspaceIssuesFilter,
      }) as TStoreIssues[T];
    case EIssuesStoreType.WORKSPACE_DRAFT:
      return merge(defaultStore, {
        issues: context.issue.workspaceDraftIssues,
        issuesFilter: context.issue.workspaceDraftIssuesFilter,
      }) as TStoreIssues[T];
    case EIssuesStoreType.PROFILE:
      return merge(defaultStore, {
        issues: context.issue.profileIssues,
        issuesFilter: context.issue.profileIssuesFilter,
      }) as TStoreIssues[T];
    case EIssuesStoreType.TEAM:
      return merge(defaultStore, {
        issues: context.issue.teamIssues,
        issuesFilter: context.issue.teamIssuesFilter,
      }) as TStoreIssues[T];
    case EIssuesStoreType.PROJECT:
      return merge(defaultStore, {
        issues: context.issue.projectIssues,
        issuesFilter: context.issue.projectIssuesFilter,
      }) as TStoreIssues[T];
    case EIssuesStoreType.CYCLE:
      return merge(defaultStore, {
        issues: context.issue.cycleIssues,
        issuesFilter: context.issue.cycleIssuesFilter,
      }) as TStoreIssues[T];
    case EIssuesStoreType.MODULE:
      return merge(defaultStore, {
        issues: context.issue.moduleIssues,
        issuesFilter: context.issue.moduleIssuesFilter,
      }) as TStoreIssues[T];
    case EIssuesStoreType.TEAM_VIEW:
      return merge(defaultStore, {
        issues: context.issue.teamViewIssues,
        issuesFilter: context.issue.teamViewIssuesFilter,
      }) as TStoreIssues[T];
    case EIssuesStoreType.PROJECT_VIEW:
      return merge(defaultStore, {
        issues: context.issue.projectViewIssues,
        issuesFilter: context.issue.projectViewIssuesFilter,
      }) as TStoreIssues[T];
    case EIssuesStoreType.ARCHIVED:
      return merge(defaultStore, {
        issues: context.issue.archivedIssues,
        issuesFilter: context.issue.archivedIssuesFilter,
      }) as TStoreIssues[T];
    case EIssuesStoreType.ARCHIVED_EPIC:
      return merge(defaultStore, {
        issues: context.issue.archivedEpics,
        issuesFilter: context.issue.archivedEpicsFilter,
      }) as TStoreIssues[T];
    case EIssuesStoreType.EPIC:
      return merge(defaultStore, {
        issues: context.issue.projectEpics,
        issuesFilter: context.issue.projectEpicsFilter,
      }) as TStoreIssues[T];
    case EIssuesStoreType.TEAM_PROJECT_WORK_ITEMS:
      return merge(defaultStore, {
        issues: context.issue.teamProjectWorkItems,
        issuesFilter: context.issue.teamProjectWorkItemsFilter,
      }) as TStoreIssues[T];
    case EIssuesStoreType.INITIATIVE_EPIC:
      return merge(defaultStore, {
        issues: context.initiativeStore.scope.epics,
        issuesFilter: context.initiativeStore.scope.epics.filters,
      }) as TStoreIssues[T];
    case EIssuesStoreType.RELEASE:
      return merge(defaultStore, {
        issues: context.issue.releaseIssues,
        issuesFilter: context.issue.releaseIssuesFilter,
      }) as TStoreIssues[T];
    default:
      return merge(defaultStore, {
        issues: context.issue.projectIssues,
        issuesFilter: context.issue.projectIssuesFilter,
      }) as TStoreIssues[T];
  }
};
