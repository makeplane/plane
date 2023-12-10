import { observable, action, computed, makeObservable, runInAction } from "mobx";
// store
import { RootStore } from "../root";
// types
import { IIssue } from "types";
// services
import { UserService } from "services/user.service";
import { sortArrayByDate, sortArrayByPriority } from "constants/kanban-helpers";

export type IIssueType = "grouped" | "groupWithSubGroups" | "ungrouped";
export type IIssueGroupedStructure = { [group_id: string]: IIssue[] };
export type IIssueGroupWithSubGroupsStructure = {
  [group_id: string]: {
    [sub_group_id: string]: IIssue[];
  };
};
export type IIssueUnGroupedStructure = IIssue[];

export interface IProfileIssueStore {
  loader: boolean;
  error: any | null;
  userId: string | null;
  currentProfileTab: "assigned" | "created" | "subscribed" | null;
  issues: {
    [workspace_slug: string]: {
      [user_id: string]: {
        grouped: IIssueGroupedStructure;
        groupWithSubGroups: IIssueGroupWithSubGroupsStructure;
        ungrouped: IIssueUnGroupedStructure;
      };
    };
  };
  // computed
  getIssueType: IIssueType | null;
  getIssues: IIssueGroupedStructure | IIssueGroupWithSubGroupsStructure | IIssueUnGroupedStructure | null;
  // action
  fetchIssues: (workspaceSlug: string, userId: string, type: "assigned" | "created" | "subscribed") => Promise<any>;
  updateIssueStructure: (group_id: string | null, sub_group_id: string | null, issue: IIssue) => void;
  deleteIssue: (group_id: string | null, sub_group_id: string | null, issue: IIssue) => void;
}

export class ProfileIssueStore implements IProfileIssueStore {
  loader: boolean = true;
  error: any | null = null;
  userId: string | null = null;
  currentProfileTab: "assigned" | "created" | "subscribed" | null = null;
  issues: {
    [workspace_slug: string]: {
      [user_id: string]: {
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
    };
  } = {};
  // service
  userService;
  rootStore;

  constructor(_rootStore: RootStore) {
    makeObservable(this, {
      // observable
      loader: observable.ref,
      error: observable.ref,
      currentProfileTab: observable.ref,
      userId: observable.ref,
      issues: observable.ref,
      // computed
      getIssueType: computed,
      getIssues: computed,
      // actions
      fetchIssues: action,
      updateIssueStructure: action,
      deleteIssue: action,
    });
    this.rootStore = _rootStore;
    this.userService = new UserService();
  }

  get getIssueType() {
    const groupedLayouts = ["kanban", "list", "calendar"];
    const ungroupedLayouts = ["spreadsheet", "gantt_chart"];

    const issueLayout = this.rootStore?.profileIssueFilters?.userDisplayFilters?.layout || null;
    const issueGroup = this.rootStore?.profileIssueFilters?.userDisplayFilters?.group_by || null;
    const issueSubGroup = this.rootStore?.profileIssueFilters?.userDisplayFilters?.sub_group_by || null;
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
    const workspaceSlug: string | null = this.rootStore?.workspace?.workspaceSlug;
    const userId: string | null = this.userId;
    const issueType = this.getIssueType;
    if (!workspaceSlug || !userId || !issueType) return null;

    return this.issues?.[workspaceSlug]?.[userId]?.[issueType] || null;
  }

  updateIssueStructure = async (group_id: string | null, sub_group_id: string | null, issue: IIssue) => {
    const workspaceSlug: string | null = this.rootStore?.workspace?.workspaceSlug;
    const userId: string | null = this.userId;

    const issueType = this.getIssueType;
    if (!workspaceSlug || !userId || !issueType) return null;

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

    const orderBy = this.rootStore?.profileIssueFilters?.userDisplayFilters?.order_by || "";
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
      this.issues = {
        ...this.issues,
        [workspaceSlug]: {
          ...this.issues?.[workspaceSlug],
          [userId]: {
            ...this.issues?.[workspaceSlug]?.[userId],
            [issueType]: issues,
          },
        },
      };
    });
  };

  deleteIssue = async (group_id: string | null, sub_group_id: string | null, issue: IIssue) => {
    const workspaceSlug: string | null = this.rootStore?.workspace?.workspaceSlug;
    const userId: string | null = this.userId;

    const issueType = this.getIssueType;

    if (!workspaceSlug || !userId || !issueType) return null;

    let issues: IIssueGroupedStructure | IIssueGroupWithSubGroupsStructure | IIssueUnGroupedStructure | null =
      this.getIssues;

    if (!issues) return null;

    if (issueType === "grouped" && group_id) {
      issues = issues as IIssueGroupedStructure;
      issues = {
        ...issues,
        [group_id]: issues[group_id].filter((i: IIssue) => i?.id !== issue?.id),
      };
    }
    if (issueType === "groupWithSubGroups" && group_id && sub_group_id) {
      issues = issues as IIssueGroupWithSubGroupsStructure;
      issues = {
        ...issues,
        [sub_group_id]: {
          ...issues[sub_group_id],
          [group_id]: issues[sub_group_id][group_id].filter((i: IIssue) => i?.id !== issue?.id),
        },
      };
    }
    if (issueType === "ungrouped") {
      issues = issues as IIssueUnGroupedStructure;
      issues = issues.filter((i: IIssue) => i?.id !== issue?.id);
    }

    runInAction(() => {
      this.issues = {
        ...this.issues,
        [workspaceSlug]: {
          ...this.issues?.[workspaceSlug],
          [userId]: {
            ...this.issues?.[workspaceSlug]?.[userId],
            [issueType]: issues,
          },
        },
      };
    });
  };

  fetchIssues = async (
    workspaceSlug: string,
    userId: string,
    type: "assigned" | "created" | "subscribed" = "assigned"
  ) => {
    try {
      this.loader = true;
      this.error = null;

      this.currentProfileTab = type;
      this.userId = userId;

      const issueType = this.getIssueType;

      let params: any = this.rootStore?.profileIssueFilters?.appliedFilters;
      params = {
        ...params,
        assignees: undefined,
        created_by: undefined,
        subscriber: undefined,
      };
      if (type === "assigned") params = params ? { ...params, assignees: userId } : { assignees: userId };
      else if (type === "created") params = params ? { ...params, created_by: userId } : { created_by: userId };
      else if (type === "subscribed") params = params ? { ...params, subscriber: userId } : { subscriber: userId };

      const issueResponse = await this.userService.getUserProfileIssues(workspaceSlug, userId, params);

      if (issueType != null) {
        const _issues = {
          ...this.issues,
          [workspaceSlug]: {
            ...this.issues?.[workspaceSlug],
            [userId]: {
              ...this.issues?.[workspaceSlug]?.[userId],
              [issueType]: issueResponse,
            },
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
