import { useContext } from "react";
// mobx store
import { StoreContext } from "contexts/store-context";
// types
import { IWorkspaceIssues, IWorkspaceIssuesFilter } from "store/issue/workspace";
import { IProfileIssues, IProfileIssuesFilter } from "store/issue/profile";
import { IProjectIssues, IProjectIssuesFilter } from "store/issue/project";
import { ICycleIssues, ICycleIssuesFilter } from "store/issue/cycle";
import { IModuleIssues, IModuleIssuesFilter } from "store/issue/module";
import { IProjectViewIssues, IProjectViewIssuesFilter } from "store/issue/project-views";
import { IArchivedIssues, IArchivedIssuesFilter } from "store/issue/archived";
import { IDraftIssues, IDraftIssuesFilter } from "store/issue/draft";
import { TIssueMap } from "@plane/types";
// constants
import { EIssuesStoreType } from "constants/issue";

export interface IStoreIssues {
  [EIssuesStoreType.GLOBAL]: {
    issueMap: TIssueMap;
    issues: IWorkspaceIssues;
    issuesFilter: IWorkspaceIssuesFilter;
  };
  [EIssuesStoreType.PROFILE]: {
    issueMap: TIssueMap;
    issues: IProfileIssues;
    issuesFilter: IProfileIssuesFilter;
  };
  [EIssuesStoreType.PROJECT]: {
    issueMap: TIssueMap;
    issues: IProjectIssues;
    issuesFilter: IProjectIssuesFilter;
  };
  [EIssuesStoreType.CYCLE]: {
    issueMap: TIssueMap;
    issues: ICycleIssues;
    issuesFilter: ICycleIssuesFilter;
  };
  [EIssuesStoreType.MODULE]: {
    issueMap: TIssueMap;
    issues: IModuleIssues;
    issuesFilter: IModuleIssuesFilter;
  };
  [EIssuesStoreType.PROJECT_VIEW]: {
    issueMap: TIssueMap;
    issues: IProjectViewIssues;
    issuesFilter: IProjectViewIssuesFilter;
  };
  [EIssuesStoreType.ARCHIVED]: {
    issueMap: TIssueMap;
    issues: IArchivedIssues;
    issuesFilter: IArchivedIssuesFilter;
  };
  [EIssuesStoreType.DRAFT]: {
    issueMap: TIssueMap;
    issues: IDraftIssues;
    issuesFilter: IDraftIssuesFilter;
  };
  [EIssuesStoreType.DEFAULT]: {
    issueMap: TIssueMap;
    issues: undefined;
    issuesFilter: undefined;
  };
}

export const useIssues = <T extends EIssuesStoreType>(storeType?: T): IStoreIssues[T] => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("useIssues must be used within StoreProvider");

  switch (storeType) {
    case EIssuesStoreType.GLOBAL:
      return {
        issueMap: context.issue.issues.issuesMap,
        issues: context.issue.workspaceIssues,
        issuesFilter: context.issue.workspaceIssuesFilter,
      } as IStoreIssues[T];
    case EIssuesStoreType.PROFILE:
      return {
        issueMap: context.issue.issues.issuesMap,
        issues: context.issue.profileIssues,
        issuesFilter: context.issue.profileIssuesFilter,
      } as IStoreIssues[T];
    case EIssuesStoreType.PROJECT:
      return {
        issueMap: context.issue.issues.issuesMap,
        issues: context.issue.projectIssues,
        issuesFilter: context.issue.projectIssuesFilter,
      } as IStoreIssues[T];
    case EIssuesStoreType.CYCLE:
      return {
        issueMap: context.issue.issues.issuesMap,
        issues: context.issue.cycleIssues,
        issuesFilter: context.issue.cycleIssuesFilter,
      } as IStoreIssues[T];
    case EIssuesStoreType.MODULE:
      return {
        issueMap: context.issue.issues.issuesMap,
        issues: context.issue.moduleIssues,
        issuesFilter: context.issue.moduleIssuesFilter,
      } as IStoreIssues[T];
    case EIssuesStoreType.PROJECT_VIEW:
      return {
        issueMap: context.issue.issues.issuesMap,
        issues: context.issue.projectViewIssues,
        issuesFilter: context.issue.projectViewIssuesFilter,
      } as IStoreIssues[T];
    case EIssuesStoreType.ARCHIVED:
      return {
        issueMap: context.issue.issues.issuesMap,
        issues: context.issue.archivedIssues,
        issuesFilter: context.issue.archivedIssuesFilter,
      } as IStoreIssues[T];
    case EIssuesStoreType.DRAFT:
      return {
        issueMap: context.issue.issues.issuesMap,
        issues: context.issue.draftIssues,
        issuesFilter: context.issue.draftIssuesFilter,
      } as IStoreIssues[T];
    default:
      return {
        issueMap: context.issue.issues.issuesMap,
        issues: undefined,
        issuesFilter: undefined,
      } as IStoreIssues[T];
  }
};
