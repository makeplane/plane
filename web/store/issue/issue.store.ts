import get from "lodash/get";
// store
import { action, makeObservable, observable, runInAction } from "mobx";
import { IIssueRootStore } from "./root.store";
// types
import { IIssue } from "types";

export interface IIssueStore {
  allIssues: { [key: string]: IIssue };
  // actions
  addIssue(issues: IIssue[]): void;
  updateIssue(issueId: string, issue: Partial<IIssue>): void;
  removeIssue(issueId: string): void;
  // helper Methods
  getIssueById(id: string): undefined | IIssue;
  getIssuesByKey(issueKey: string, value: string): undefined | { [key: string]: IIssue };
}

export class IssueStore implements IIssueStore {
  allIssues: { [key: string]: IIssue } = {};
  // root store
  rootStore: IIssueRootStore;

  constructor(rootStore: IIssueRootStore) {
    this.rootStore = rootStore;

    makeObservable(this, {
      // observable
      allIssues: observable,
      // actions
<<<<<<< HEAD
      addIssue: action,
      updateIssue: action,
      removeIssue: action,
=======
      fetchIssues: action,
      updateIssueStructure: action,
      removeIssueFromStructure: action,
      updateGanttIssueStructure: action,
    });

    this.rootStore = _rootStore;
    this.issueService = new IssueService();

    autorun(() => {
      const workspaceSlug = this.rootStore.workspace.workspaceSlug;
      const projectId = this.rootStore.project.projectId;
      const hasPermissionToCurrentProject = this.rootStore.user.hasPermissionToCurrentProject;
      if (
        workspaceSlug &&
        projectId &&
        hasPermissionToCurrentProject &&
        this.rootStore.issueFilter.userFilters &&
        this.rootStore.issueFilter.userDisplayFilters
      )
        this.fetchIssues(workspaceSlug, projectId, "mutation");
>>>>>>> a86dafc11c3e52699f4050e9d9c97393e29f0434
    });
  }

  addIssue = (issues: IIssue[]) => {
    if (issues && issues.length <= 0) return;

<<<<<<< HEAD
    const _issues = { ...this.allIssues };
    issues.forEach((issue) => {
      _issues[issue.id] = issue;
    });
=======
    const issueLayout = this.rootStore?.issueFilter?.userDisplayFilters?.layout || null;
    const issueGroup = this.rootStore?.issueFilter?.userDisplayFilters?.group_by || null;
    const issueSubGroup = this.rootStore?.issueFilter?.userDisplayFilters?.sub_group_by || null;
    if (!issueLayout) return null;

    const _issueState = groupedLayouts.includes(issueLayout)
      ? issueGroup
        ? issueSubGroup
          ? "groupWithSubGroups"
          : "grouped"
        : "ungrouped"
      : ungroupedLayouts.includes(issueLayout)
      ? "ungrouped"
      : null;

    return _issueState || null;
  }

  get getIssues() {
    const projectId: string | null = this.rootStore?.project?.projectId;
    const issueType = this.getIssueType;
    if (!projectId || !issueType) return null;

    return this.issues?.[projectId]?.[issueType] || null;
  }

  get getIssuesCount() {
    const issueType = this.getIssueType;

    let issuesCount = 0;

    if (issueType === "grouped") {
      const issues = this.getIssues as IIssueGroupedStructure;

      if (!issues) return 0;

      Object.keys(issues).map((group_id) => {
        issuesCount += issues[group_id].length;
      });
    }

    if (issueType === "groupWithSubGroups") {
      const issues = this.getIssues as IIssueGroupWithSubGroupsStructure;

      if (!issues) return 0;

      Object.keys(issues).map((sub_group_id) => {
        Object.keys(issues[sub_group_id]).map((group_id) => {
          issuesCount += issues[sub_group_id][group_id].length;
        });
      });
    }

    if (issueType === "ungrouped") {
      const issues = this.getIssues as IIssueUnGroupedStructure;

      if (!issues) return 0;

      issuesCount = issues.length;
    }

    return issuesCount;
  }

  updateIssueStructure = async (group_id: string | null, sub_group_id: string | null, issue: IIssue) => {
    const projectId: string | null = issue?.project;
    const issueType = this.getIssueType;
    if (!projectId || !issueType) return null;

    let issues: IIssueGroupedStructure | IIssueGroupWithSubGroupsStructure | IIssueUnGroupedStructure | null =
      this.getIssues;
    if (!issues) return null;

    if (issueType === "grouped" && group_id) {
      issues = issues as IIssueGroupedStructure;
      const _currentIssueId = issues?.[group_id]?.find((_i) => _i?.id === issue.id);
      issues = {
        ...issues,
        [group_id]: _currentIssueId
          ? issues[group_id]?.map((i: IIssue) => (i?.id === issue?.id ? { ...i, ...issue } : i))
          : [...(issues?.[group_id] ?? []), issue],
      };
    }
    if (issueType === "groupWithSubGroups" && group_id && sub_group_id) {
      issues = issues as IIssueGroupWithSubGroupsStructure;
      const _currentIssueId = issues?.[sub_group_id]?.[group_id]?.find((_i) => _i?.id === issue.id);
      issues = {
        ...issues,
        [sub_group_id]: {
          ...issues[sub_group_id],
          [group_id]: _currentIssueId
            ? issues?.[sub_group_id]?.[group_id]?.map((i: IIssue) => (i?.id === issue?.id ? { ...i, ...issue } : i))
            : [...(issues?.[sub_group_id]?.[group_id] ?? []), issue],
        },
      };
    }
    if (issueType === "ungrouped") {
      issues = issues as IIssueUnGroupedStructure;
      const _currentIssueId = issues?.find((_i) => _i?.id === issue.id);
      issues = _currentIssueId
        ? issues?.map((i: IIssue) => (i?.id === issue?.id ? { ...i, ...issue } : i))
        : [...(issues ?? []), issue];
    }
>>>>>>> a86dafc11c3e52699f4050e9d9c97393e29f0434

    runInAction(() => {
      this.allIssues = _issues;
    });
  };

  updateIssue = (issueId: string, issue: Partial<IIssue>) => {
    if (!issue || !issueId || !this.allIssues[issueId]) return;
    this.allIssues[issueId] = { ...this.allIssues[issueId], ...issue };
  };

  removeIssue = (issueId: string) => {
    if (issueId) return;
    delete this.allIssues[issueId];
  };

  // helper methods
  getIssueById = (id: string) => {
    if (!id) return undefined;
    return this.allIssues[id];
  };

  getIssuesByKey = (issueKey: keyof IIssue, value: string) => {
    if (!issueKey || !value || !this.allIssues) return undefined;
    const filteredIssues: { [key: string]: IIssue } = {};

    Object.values(this.allIssues).forEach((issue) => {
      const issueKeyValue = get(issue, issueKey);
      if (issueKeyValue == value) {
        filteredIssues[issue.id] = issue;
      }
    });

    return filteredIssues;
  };
}
