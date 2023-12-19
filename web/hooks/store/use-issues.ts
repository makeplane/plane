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
import { IIssueResponse } from "types";
// constants
import { EIssuesStoreType } from "constants/issue";

interface IStoreIssues {
  GLOBAL: {
    issueMap: IIssueResponse;
    issues: IWorkspaceIssues;
    issuesFilter: IWorkspaceIssuesFilter;
  };
  PROFILE: {
    issueMap: IIssueResponse;
    issues: IProfileIssues;
    issuesFilter: IProfileIssuesFilter;
  };
  PROJECT: {
    issueMap: IIssueResponse;
    issues: IProjectIssues;
    issuesFilter: IProjectIssuesFilter;
  };
  CYCLE: {
    issueMap: IIssueResponse;
    issues: ICycleIssues;
    issuesFilter: ICycleIssuesFilter;
  };
  MODULE: {
    issueMap: IIssueResponse;
    issues: IModuleIssues;
    issuesFilter: IModuleIssuesFilter;
  };
  PROJECT_VIEW: {
    issueMap: IIssueResponse;
    issues: IProjectViewIssues;
    issuesFilter: IProjectViewIssuesFilter;
  };
  ARCHIVED: {
    issueMap: IIssueResponse;
    issues: IArchivedIssues;
    issuesFilter: IArchivedIssuesFilter;
  };
  DRAFT: {
    issueMap: IIssueResponse;
    issues: IDraftIssues;
    issuesFilter: IDraftIssuesFilter;
  };
  DEFAULT: {
    issueMap: IIssueResponse;
    issues: undefined;
    issuesFilter: undefined;
  };
}

export const useIssues = (storeType: EIssuesStoreType | undefined = undefined) => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("useIssues must be used within StoreProvider");

  const storeIssues: IStoreIssues = {
    GLOBAL: {
      issueMap: context.issue.issues.issuesMap,
      issues: context.issue.workspaceIssues,
      issuesFilter: context.issue.workspaceIssuesFilter,
    },
    PROFILE: {
      issueMap: context.issue.issues.issuesMap,
      issues: context.issue.profileIssues,
      issuesFilter: context.issue.profileIssuesFilter,
    },
    PROJECT: {
      issueMap: context.issue.issues.issuesMap,
      issues: context.issue.projectIssues,
      issuesFilter: context.issue.projectIssuesFilter,
    },
    CYCLE: {
      issueMap: context.issue.issues.issuesMap,
      issues: context.issue.cycleIssues,
      issuesFilter: context.issue.cycleIssuesFilter,
    },
    MODULE: {
      issueMap: context.issue.issues.issuesMap,
      issues: context.issue.moduleIssues,
      issuesFilter: context.issue.moduleIssuesFilter,
    },
    PROJECT_VIEW: {
      issueMap: context.issue.issues.issuesMap,
      issues: context.issue.projectViewIssues,
      issuesFilter: context.issue.projectViewIssuesFilter,
    },
    ARCHIVED: {
      issueMap: context.issue.issues.issuesMap,
      issues: context.issue.archivedIssues,
      issuesFilter: context.issue.archivedIssuesFilter,
    },
    DRAFT: {
      issueMap: context.issue.issues.issuesMap,
      issues: context.issue.draftIssues,
      issuesFilter: context.issue.draftIssuesFilter,
    },
    DEFAULT: {
      issueMap: context.issue.issues.issuesMap,
      issues: undefined,
      issuesFilter: undefined,
    },
  };

  return storeIssues[storeType ? storeType : "DEFAULT"];
};
