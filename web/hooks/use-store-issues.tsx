// issue store provider
import { useMobxIssueStore } from "lib/mobx/store-issues-provider";
// types
import { IWorkspaceIssues, IWorkspaceIssuesFilter } from "store/issue/workspace";
import { IProfileIssues, IProfileIssuesFilter } from "store/issue/profile";
import { IProjectIssues, IProjectIssuesFilter } from "store/issue/project";
import { ICycleIssues, ICycleIssuesFilter } from "store/issue/cycle";
import { IModuleIssues, IModuleIssuesFilter } from "store/issue/module";
import { IProjectViewIssues, IProjectViewIssuesFilter } from "store/issue/project-views";
import { IArchivedIssues, IArchivedIssuesFilter } from "store/issue/archived";
import { IDraftIssues, IDraftIssuesFilter } from "store/issue/draft";

interface IStoreIssues {
  // workspace: {
  //   issues: IWorkspaceIssues;
  //   issuesFilter: IWorkspaceIssuesFilter;
  // };
  // profile: {
  //   issues: IProfileIssues;
  //   issuesFilter: IProfileIssuesFilter;
  // };
  project: {
    issues: IProjectIssues;
    issuesFilter: IProjectIssuesFilter;
  };
  // cycle: {
  //   issues: ICycleIssues;
  //   issuesFilter: ICycleIssuesFilter;
  // };
  // module: {
  //   issues: IModuleIssues;
  //   issuesFilter: IModuleIssuesFilter;
  // };
  // projectView: {
  //   issues: IProjectViewIssues;
  //   issuesFilter: IProjectViewIssuesFilter;
  // };
  // archived: {
  //   issues: IArchivedIssues;
  //   issuesFilter: IArchivedIssuesFilter;
  // };
  // draft: {
  //   issues: IDraftIssues;
  //   issuesFilter: IDraftIssuesFilter;
  // };
}

interface IStoreIssuesWithHelpers extends IStoreIssues {
  calendarHelper: any;
  kanbanHelper: any;
}

const useStoreIssues = (issueSpace: keyof IStoreIssues) => {
  const {
    issue: {
      workspaceSlug,
      issues,
      workspaceIssues,
      workspaceIssuesFilter,
      profileIssues,
      profileIssuesFilter,
      projectIssues,
      projectIssuesFilter,
      cycleIssues,
      cycleIssuesFilter,
      moduleIssues,
      moduleIssuesFilter,
      projectViewIssues,
      projectViewIssuesFilter,
      archivedIssues,
      archivedIssuesFilter,
      draftIssues,
      draftIssuesFilter,
    },
  } = useMobxIssueStore();

  const storeIssues: IStoreIssues = {
    // workspace: {
    //   issues: workspaceIssues,
    //   issuesFilter: workspaceIssuesFilter,
    // },
    // profile: {
    //   issues: profileIssues,
    //   issuesFilter: profileIssuesFilter,
    // },
    project: {
      issues: projectIssues,
      issuesFilter: projectIssuesFilter,
    },
    // cycle: {
    //   issues: cycleIssues,
    //   issuesFilter: cycleIssuesFilter,
    // },
    // module: {
    //   issues: moduleIssues,
    //   issuesFilter: moduleIssuesFilter,
    // },
    // projectView: {
    //   issues: projectViewIssues,
    //   issuesFilter: projectViewIssuesFilter,
    // },
    // archived: {
    //   issues: archivedIssues,
    //   issuesFilter: archivedIssuesFilter,
    // },
    // draft: {
    //   issues: draftIssues,
    //   issuesFilter: draftIssuesFilter,
    // },
  };

  return {
    issues: storeIssues[issueSpace].issues,
    issuesFilter: storeIssues[issueSpace].issuesFilter,
  };
};

export default useStoreIssues;
