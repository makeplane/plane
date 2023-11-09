import { action, observable, makeObservable, computed, runInAction } from "mobx";
// services
import { IssueService } from "services/issue/issue.service";
// constants
import { ISSUE_PRIORITIES, ISSUE_STATE_GROUPS } from "constants/issue";
// types
import { IIssue, IState, TIssueGroupByOptions } from "types";
import { RootStore } from "store/root";

export interface IGroupedIssues {
  [group_id: string]: string[];
}

export interface ISubGroupedIssues {
  [sub_grouped_id: string]: {
    [group_id: string]: string[];
  };
}

export type TUnGroupedIssues = string[];

export interface IIssueResponse {
  [issue_id: string]: IIssue;
}

enum issueGroupByKeys {
  state = "state",
  "state_detail.group" = "state_detail.group",
  priority = "priority",
  labels = "labels",
  created_by = "created_by",
  project = "project",
  assignees = "assignees",
  mentions = "assignees",
}

export interface IProjectIssueStore {
  loader: "init-loader" | "mutation" | null;
  projectId: string | undefined;
  issues:
    | {
        [project_id: string]: {
          [issue_id: string]: IIssue;
        };
      }
    | undefined;

  // computed
  groupedIssues: IGroupedIssues | undefined;
  subGroupedIssues: ISubGroupedIssues | undefined;
  unGroupedIssues: TUnGroupedIssues | undefined;

  // actions
  fetchProjectIssues: (workspaceSlug: string, projectId: string) => Promise<IIssueResponse> | undefined;
}

export class ProjectIssueStore implements IProjectIssueStore {
  loader: "init-loader" | "mutation" | null = null;
  projectId: string | undefined = undefined;
  issues:
    | {
        [project_id: string]: {
          [issue_id: string]: IIssue;
        };
      }
    | undefined = undefined;
  // root store
  rootStore;
  // service
  issueService;

  constructor(_rootStore: RootStore | null = null) {
    makeObservable(this, {
      // observable
      loader: observable.ref,
      projectId: observable.ref,
      issues: observable.ref,
      // computed
      groupedIssues: computed,
      subGroupedIssues: computed,
      unGroupedIssues: computed,
      // action
      fetchProjectIssues: action,
    });

    this.rootStore = _rootStore;
    this.issueService = new IssueService();
  }

  issueDisplayFiltersDefaultData = (): { [filter_key: string]: string[] } => {
    const data: { [filter_key: string]: string[] } = {
      state: (this.rootStore?.projectState?.projectStates ?? []).map((i: IState) => i.id),
      "state_detail.group": ISSUE_STATE_GROUPS.map((i) => i.key),
      priority: ISSUE_PRIORITIES.map((i) => i.key),
      labels: [...(this.rootStore?.project?.projectLabels ?? []).map((i) => i.id), "None"],
      created_by: (this.rootStore?.project?.projectMembers ?? []).map((i) => i.member.id),
      project: (this.rootStore?.project.workspaceProjects ?? []).map((i) => i.id),
      assignees: [...(this.rootStore?.project?.projectMembers ?? []).map((i) => i.member.id), "None"],
    };

    return data;
  };

  get groupedIssues() {
    const groupBy: TIssueGroupByOptions | undefined = this.rootStore?.issueFilter.userDisplayFilters.group_by;
    const projectId: string | undefined | null = this.rootStore?.project.projectId;

    if (!groupBy || !projectId || !this.issues || !this.issues[projectId]) return undefined;

    const displayFiltersDefaultData: { [filter_key: string]: string[] } = this.issueDisplayFiltersDefaultData();

    const issues: { [group_id: string]: string[] } = {};
    displayFiltersDefaultData[groupBy].forEach((group) => {
      issues[group] = [];
    });

    const projectIssues = this.issues[projectId];

    for (const issue in projectIssues) {
      const _issue = projectIssues[issue];
      const groupArray = this.getGroupArray(_issue[issueGroupByKeys[groupBy] as keyof IIssue]);

      for (const group of groupArray) {
        if (group && issues[group]) {
          issues[group].push(_issue.id);
        }
      }
    }

    return issues;
  }

  get subGroupedIssues() {
    const subGroupBy: TIssueGroupByOptions | undefined = this.rootStore?.issueFilter.userDisplayFilters.sub_group_by;
    const groupBy: TIssueGroupByOptions | undefined = this.rootStore?.issueFilter.userDisplayFilters.group_by;
    const projectId: string | undefined | null = this.rootStore?.project.projectId;

    if (!subGroupBy || !groupBy || !projectId || !this.issues || !this.issues[projectId]) return undefined;

    const displayFiltersDefaultData: { [filter_key: string]: string[] } = this.issueDisplayFiltersDefaultData();

    const issues: { [sub_group_id: string]: { [group_id: string]: string[] } } = {};
    displayFiltersDefaultData[subGroupBy].forEach((sub_group: any) => {
      const groupByIssues: { [group_id: string]: string[] } = {};
      displayFiltersDefaultData[groupBy].forEach((group) => {
        groupByIssues[group] = [];
      });
      issues[sub_group] = groupByIssues;
    });

    const projectIssues = this.issues[projectId];

    for (const issue in projectIssues) {
      const _issue = projectIssues[issue];
      const subGroupArray = this.getGroupArray(_issue[issueGroupByKeys[subGroupBy] as keyof IIssue]);
      const groupArray = this.getGroupArray(_issue[issueGroupByKeys[groupBy] as keyof IIssue]);

      for (const subGroup of subGroupArray) {
        for (const group of groupArray) {
          if (subGroup && group && issues[subGroup]) {
            issues[subGroup][group].push(_issue.id);
          }
        }
      }
    }

    return issues;
  }

  get unGroupedIssues() {
    if (!this.projectId || !this.issues || !this.issues[this.projectId]) return undefined;
    return Object.keys(this.issues[this.projectId]);
  }

  fetchProjectIssues = async (workspaceSlug: string, projectId: string) => {
    try {
      this.projectId = projectId;
      this.rootStore?.project.setProjectId(projectId);

      const response = await this.issueService.getV3Issues(workspaceSlug, projectId);
      const _issues = {
        ...this.issues,
        [projectId]: { ...response },
      };

      runInAction(() => {
        this.issues = _issues;
      });

      return response;
    } catch (error) {
      throw error;
    }
  };

  /**
   *
   * @description this function helps to convert the typeof value (array | string | null) to array and returns an array
   */
  getGroupArray(value: string[] | string | null) {
    if (Array.isArray(value)) {
      return value;
    } else {
      return [value || "None"];
    }
  }
}
