import { observable, action, computed, makeObservable, runInAction } from "mobx";
// store
import { RootStore } from "./root";
// types
import { IIssue } from "types";
// services
import CycleService from "services/cycle.service";
// constants
import { sortArrayByDate, sortArrayByPriority } from "constants/kanban-helpers";

export type IIssueType = "grouped" | "groupWithSubGroups" | "ungrouped";
export type IIssueGroupedStructure = { [group_id: string]: IIssue[] };
export type IIssueGroupWithSubGroupsStructure = {
  [group_id: string]: {
    [sub_group_id: string]: IIssue[];
  };
};
export type IIssueUnGroupedStructure = IIssue[];

export interface ICycleIssueStore {
  loader: boolean;
  error: any | null;
  // issues
  issues: {
    [cycleId: string]: {
      grouped: IIssueGroupedStructure;
      groupWithSubGroups: IIssueGroupWithSubGroupsStructure;
      ungrouped: IIssueUnGroupedStructure;
    };
  };
  // computed
  getIssueType: IIssueType | null;
  getIssues: IIssueGroupedStructure | IIssueGroupWithSubGroupsStructure | IIssueUnGroupedStructure | null;
  // action
  fetchIssues: (workspaceSlug: string, projectId: string, cycleId: string) => Promise<any>;
  updateIssueStructure: (group_id: string | null, sub_group_id: string | null, issue: IIssue) => void;
}

class CycleIssueStore implements ICycleIssueStore {
  loader: boolean = false;
  error: any | null = null;
  issues: {
    [cycle_id: string]: {
      grouped: {
        [group_id: string]: IIssue[];
      };
      groupWithSubGroups: {
        [group_id: string]: {
          [sub_group_id: string]: IIssue[];
        };
      };
      ungrouped: IIssue[];
    };
  } = {};
  // service
  cycleService;
  rootStore;

  constructor(_rootStore: RootStore) {
    makeObservable(this, {
      // observable
      loader: observable.ref,
      error: observable.ref,
      issues: observable.ref,
      // computed
      getIssueType: computed,
      getIssues: computed,
      // actions
      fetchIssues: action,
      updateIssueStructure: action,
    });
    this.rootStore = _rootStore;
    this.cycleService = new CycleService();
  }

  get getIssueType() {
    const groupedLayouts = ["kanban", "list", "calendar"];
    const ungroupedLayouts = ["spreadsheet", "gantt_chart"];

    const issueLayout = this.rootStore?.issueFilter?.userDisplayFilters?.layout || null;
    const issueSubGroup = this.rootStore?.issueFilter?.userDisplayFilters?.sub_group_by || null;

    if (!issueLayout) return null;

    const _issueState = groupedLayouts.includes(issueLayout)
      ? issueSubGroup
        ? "groupWithSubGroups"
        : "grouped"
      : ungroupedLayouts.includes(issueLayout)
      ? "ungrouped"
      : null;

    return _issueState || null;
  }

  get getIssues() {
    const cycleId: string | null = this.rootStore?.cycle?.cycleId;
    const issueType = this.getIssueType;
    if (!cycleId || !issueType) return null;

    return this.issues?.[cycleId]?.[issueType] || null;
  }

  updateIssueStructure = async (group_id: string | null, sub_group_id: string | null, issue: IIssue) => {
    const cycleId: string | null = this.rootStore?.cycle?.cycleId || null;
    const issueType = this.getIssueType;
    if (!cycleId || !issueType) return null;

    let issues: IIssueGroupedStructure | IIssueGroupWithSubGroupsStructure | IIssueUnGroupedStructure | null =
      this.getIssues;
    if (!issues) return null;

    if (issueType === "grouped" && group_id) {
      issues = issues as IIssueGroupedStructure;
      issues = {
        ...issues,
        [group_id]: issues[group_id].map((i: IIssue) => (i?.id === issue?.id ? { ...i, ...issue } : i)),
      };
    }
    if (issueType === "groupWithSubGroups" && group_id && sub_group_id) {
      issues = issues as IIssueGroupWithSubGroupsStructure;
      issues = {
        ...issues,
        [sub_group_id]: {
          ...issues[sub_group_id],
          [group_id]: issues[sub_group_id][group_id].map((i: IIssue) => (i?.id === issue?.id ? { ...i, ...issue } : i)),
        },
      };
    }
    if (issueType === "ungrouped") {
      issues = issues as IIssueUnGroupedStructure;
      issues = issues.map((i: IIssue) => (i?.id === issue?.id ? { ...i, ...issue } : i));
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
      this.issues = { ...this.issues, [cycleId]: { ...this.issues[cycleId], [issueType]: issues } };
    });
  };

  fetchIssues = async (workspaceSlug: string, projectId: string, cycleId: string) => {
    try {
      this.loader = true;
      this.error = null;

      this.rootStore.workspace.setWorkspaceSlug(workspaceSlug);
      this.rootStore.project.setProjectId(projectId);
      this.rootStore.cycle.setCycleId(cycleId);

      const params = this.rootStore?.cycleIssueFilter?.appliedFilters;
      const issueResponse = await this.cycleService.getCycleIssuesWithParams(workspaceSlug, projectId, cycleId, params);

      const issueType = this.getIssueType;
      if (issueType != null) {
        const _issues = {
          ...this.issues,
          [cycleId]: {
            ...this.issues[cycleId],
            [issueType]: issueResponse,
          },
        };
        runInAction(() => {
          this.issues = _issues;
          this.loader = false;
          this.error = null;
        });
      }

      return issueResponse;
    } catch (error) {
      console.error("Error: Fetching error in issues", error);
      this.loader = false;
      this.error = error;
      return error;
    }
  };
}

export default CycleIssueStore;
