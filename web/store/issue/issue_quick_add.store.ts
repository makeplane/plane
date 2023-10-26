import { observable, action, makeObservable, runInAction } from "mobx";
// services
import { IssueService } from "services/issue";
// types
import { RootStore } from "../root";
import { IIssue } from "types";
// uuid
import { sortArrayByDate, sortArrayByPriority } from "constants/kanban-helpers";
import { IIssueGroupWithSubGroupsStructure, IIssueGroupedStructure, IIssueUnGroupedStructure } from "./issue.store";

export interface IIssueQuickAddStore {
  loader: boolean;
  error: any | null;

  createIssue: (
    workspaceSlug: string,
    projectId: string,
    grouping: {
      group_id: string | null;
      sub_group_id: string | null;
    },
    data: Partial<IIssue>
  ) => Promise<IIssue>;
  updateIssueStructure: (group_id: string | null, sub_group_id: string | null, issue: IIssue) => void;
  updateQuickAddIssueStructure: (group_id: string | null, sub_group_id: string | null, issue: IIssue) => void;
}

export class IssueQuickAddStore implements IIssueQuickAddStore {
  loader: boolean = false;
  error: any | null = null;

  // root store
  rootStore;
  // service
  issueService;

  constructor(_rootStore: RootStore) {
    makeObservable(this, {
      // observable
      loader: observable.ref,
      error: observable.ref,

      createIssue: action,
      updateIssueStructure: action,
    });

    this.rootStore = _rootStore;
    this.issueService = new IssueService();
  }

  createIssue = async (
    workspaceSlug: string,
    projectId: string,
    grouping: {
      group_id: string | null;
      sub_group_id: string | null;
    },
    data: Partial<IIssue>
  ) => {
    runInAction(() => {
      this.loader = true;
      this.error = null;
    });

    const { group_id, sub_group_id } = grouping;

    try {
      this.updateIssueStructure(group_id, sub_group_id, data as IIssue);

      const response = await this.issueService.createIssue(
        workspaceSlug,
        projectId,
        data,
        this.rootStore.user.currentUser!
      );

      this.updateQuickAddIssueStructure(group_id, sub_group_id, {
        ...data,
        ...response,
      });

      runInAction(() => {
        this.loader = false;
        this.error = null;
      });

      return response;
    } catch (error) {
      this.loader = false;
      this.error = error;

      throw error;
    }
  };

  updateIssueStructure = async (group_id: string | null, sub_group_id: string | null, issue: IIssue) => {
    const projectId: string | null = issue?.project;
    const issueType = this.rootStore.issue.getIssueType;
    if (!projectId || !issueType) return null;

    let issues: IIssueGroupedStructure | IIssueGroupWithSubGroupsStructure | IIssueUnGroupedStructure | null =
      this.rootStore.issue.getIssues;
    if (!issues) return null;

    if (group_id === "null") group_id = null;
    if (sub_group_id === "null") sub_group_id = null;

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

    const orderBy = this.rootStore?.issueFilter?.userDisplayFilters?.order_by || "";
    if (orderBy === "-created_at") {
      issues = sortArrayByDate(issues as any, "created_at");
    }
    if (orderBy === "-updated_at") {
      issues = sortArrayByDate(issues as any, "updated_at");
    }
    if (orderBy === "start_date") {
      issues = sortArrayByDate(issues as any, "updated_at");
    }
    if (orderBy === "priority") {
      issues = sortArrayByPriority(issues as any, "priority");
    }

    runInAction(() => {
      this.rootStore.issue.issues = {
        ...this.rootStore.issue.issues,
        [projectId]: { ...this.rootStore.issue.issues[projectId], [issueType]: issues },
      };
    });
  };

  //   same as above function but will use temp id instead of real id
  updateQuickAddIssueStructure = async (group_id: string | null, sub_group_id: string | null, issue: IIssue) => {
    const projectId: string | null = issue?.project;
    const issueType = this.rootStore.issue.getIssueType;
    if (!projectId || !issueType) return null;

    let issues: IIssueGroupedStructure | IIssueGroupWithSubGroupsStructure | IIssueUnGroupedStructure | null =
      this.rootStore.issue.getIssues;
    if (!issues) return null;

    if (issueType === "grouped" && group_id) {
      issues = issues as IIssueGroupedStructure;
      const _currentIssueId = issues?.[group_id]?.find((_i) => _i?.tempId === issue.tempId);
      issues = {
        ...issues,
        [group_id]: _currentIssueId
          ? issues[group_id]?.map((i: IIssue) =>
              i?.tempId === issue?.tempId ? { ...i, ...issue, tempId: undefined } : i
            )
          : [...(issues?.[group_id] ?? []), issue],
      };
    }
    if (issueType === "groupWithSubGroups" && group_id && sub_group_id) {
      issues = issues as IIssueGroupWithSubGroupsStructure;
      const _currentIssueId = issues?.[sub_group_id]?.[group_id]?.find((_i) => _i?.tempId === issue.tempId);
      issues = {
        ...issues,
        [sub_group_id]: {
          ...issues[sub_group_id],
          [group_id]: _currentIssueId
            ? issues?.[sub_group_id]?.[group_id]?.map((i: IIssue) =>
                i?.tempId === issue?.tempId ? { ...i, ...issue, tempId: undefined } : i
              )
            : [...(issues?.[sub_group_id]?.[group_id] ?? []), issue],
        },
      };
    }
    if (issueType === "ungrouped") {
      issues = issues as IIssueUnGroupedStructure;
      const _currentIssueId = issues?.find((_i) => _i?.tempId === issue.tempId);
      issues = _currentIssueId
        ? issues?.map((i: IIssue) => (i?.tempId === issue?.tempId ? { ...i, ...issue, tempId: undefined } : i))
        : [...(issues ?? []), issue];
    }

    const orderBy = this.rootStore?.issueFilter?.userDisplayFilters?.order_by || "";
    if (orderBy === "-created_at") {
      issues = sortArrayByDate(issues as any, "created_at");
    }
    if (orderBy === "-updated_at") {
      issues = sortArrayByDate(issues as any, "updated_at");
    }
    if (orderBy === "start_date") {
      issues = sortArrayByDate(issues as any, "updated_at");
    }
    if (orderBy === "priority") {
      issues = sortArrayByPriority(issues as any, "priority");
    }

    runInAction(() => {
      this.rootStore.issue.issues = {
        ...this.rootStore.issue.issues,
        [projectId]: { ...this.rootStore.issue.issues[projectId], [issueType]: issues },
      };
    });
  };
}
