import { action, makeObservable, runInAction } from "mobx";
// types
import { RootStore } from "../root";
import { IIssue } from "types";
// uuid
import { sortArrayByDate, sortArrayByPriority } from "constants/kanban-helpers";
import { IIssueGroupWithSubGroupsStructure, IIssueGroupedStructure, IIssueUnGroupedStructure } from "./issue.store";
// services
import { IssueService } from "services/issue";

export interface IIssueQuickAddStore {
  updateQuickAddIssueStructure: (
    workspaceSlug: string,
    group_id: string | null,
    sub_group_id: string | null,
    issue: IIssue
  ) => void;
}

export class IssueQuickAddStore implements IIssueQuickAddStore {
  rootStore;
  issueService;

  constructor(_rootStore: RootStore) {
    makeObservable(this, {
      updateQuickAddIssueStructure: action,
    });

    this.rootStore = _rootStore;
    this.issueService = new IssueService();
  }
  createIssue = async (workspaceSlug: string, projectId: string, data: Partial<IIssue>) => {
    try {
      const user = this.rootStore.user.currentUser ?? undefined;
      const response = await this.issueService.createIssue(workspaceSlug, projectId, data);
      return response;
    } catch (error) {
      throw error;
    }
  };

  // same as above function but will use temp id instead of real id
  updateQuickAddIssueStructure = async (
    workspaceSlug: string,
    group_id: string | null,
    sub_group_id: string | null,
    issue: IIssue
  ) => {
    try {
      const response: any = await this.createIssue(workspaceSlug, issue?.project, issue);
      issue = { ...response, tempId: issue?.tempId };

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

      return response;
    } catch (error) {
      console.log("error", error);
      throw error;
    }
  };
}
