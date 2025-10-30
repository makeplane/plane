import { useContext } from "react";
import { merge } from "lodash-es";
import type { TIssueMap } from "@plane/types";
import { EIssuesStoreType } from "@plane/types";
import { StoreContext } from "@/lib/store-context";
// plane web types
import type { IProjectEpics, IProjectEpicsFilter } from "@/plane-web/store/issue/epic";
// types
import type { ITeamIssues, ITeamIssuesFilter } from "@/plane-web/store/issue/team";
import type { ITeamProjectWorkItemsFilter, ITeamProjectWorkItems } from "@/plane-web/store/issue/team-project";
import type { ITeamViewIssues, ITeamViewIssuesFilter } from "@/plane-web/store/issue/team-views";
import type { IWorkspaceIssues } from "@/plane-web/store/issue/workspace/issue.store";
import type { IArchivedIssues, IArchivedIssuesFilter } from "@/store/issue/archived";
import type { ICycleIssues, ICycleIssuesFilter } from "@/store/issue/cycle";
import type { IModuleIssues, IModuleIssuesFilter } from "@/store/issue/module";
import type { IProfileIssues, IProfileIssuesFilter } from "@/store/issue/profile";
import type { IProjectIssues, IProjectIssuesFilter } from "@/store/issue/project";
import type { IProjectViewIssues, IProjectViewIssuesFilter } from "@/store/issue/project-views";
import type { IWorkspaceIssuesFilter } from "@/store/issue/workspace";
import type { IWorkspaceDraftIssues, IWorkspaceDraftIssuesFilter } from "@/store/issue/workspace-draft";
// constants

type defaultIssueStore = {
  issueMap: TIssueMap;
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
};

export const useIssues = <T extends EIssuesStoreType>(storeType?: T): TStoreIssues[T] => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("useIssues must be used within StoreProvider");

  const defaultStore: defaultIssueStore = {
    issueMap: context.issue.issues.issuesMap,
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
    default:
      return merge(defaultStore, {
        issues: context.issue.projectIssues,
        issuesFilter: context.issue.projectIssuesFilter,
      }) as TStoreIssues[T];
  }
};
