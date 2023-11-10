import { action, observable, makeObservable, computed, runInAction } from "mobx";
import _, { orderBy } from "lodash";
// services
import { IssueService } from "services/issue/issue.service";
// constants
import { ISSUE_PRIORITIES, ISSUE_STATE_GROUPS } from "constants/issue";
// types
import { IIssue, TIssueGroupByOptions, TIssueOrderByOptions } from "types";
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
  assignees = "assignees",
  project = "project",
  mentions = "assignees",
}

export interface IProjectIssueStore {
  // observable
  loader: "init-loader" | "mutation" | null;
  issues:
    | {
        [project_id: string]: IIssueResponse;
      }
    | undefined;
  // computed
  getIssues: IIssueResponse | undefined;
  groupedIssues: IGroupedIssues | undefined;
  subGroupedIssues: ISubGroupedIssues | undefined;
  unGroupedIssues: TUnGroupedIssues | undefined;
  // actions
  fetchProjectIssues: (workspaceSlug: string, projectId: string) => Promise<IIssueResponse> | undefined;
}

export class ProjectIssueStore implements IProjectIssueStore {
  loader: "init-loader" | "mutation" | null = null;
  issues:
    | {
        [project_id: string]: IIssueResponse;
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
      issues: observable.ref,
      // computed
      getIssues: computed,
      groupedIssues: computed,
      subGroupedIssues: computed,
      unGroupedIssues: computed,
      // action
      fetchProjectIssues: action,
    });

    this.rootStore = _rootStore;
    this.issueService = new IssueService();
  }

  get getIssues() {
    const projectId = this.rootStore?.project.projectId;

    if (!projectId || !this.issues || !this.issues[projectId]) return undefined;
    return this.issues[projectId];
  }

  get groupedIssues() {
    const projectId: string | undefined | null = this.rootStore?.project.projectId;
    const groupBy: TIssueGroupByOptions | undefined = this.rootStore?.issueFilter.userDisplayFilters.group_by;
    const orderBy: TIssueOrderByOptions | undefined = this.rootStore?.issueFilter.userDisplayFilters.order_by;

    if (!projectId || !groupBy || !orderBy || !this.issues || !this.issues[projectId]) return undefined;

    const displayFiltersDefaultData: { [filter_key: string]: string[] } = {
      state: this.issueDisplayFiltersDefaultData("state"),
      "state_detail.group": this.issueDisplayFiltersDefaultData("state_detail.group"),
      priority: this.issueDisplayFiltersDefaultData("priority"),
      labels: this.issueDisplayFiltersDefaultData("labels"),
      created_by: this.issueDisplayFiltersDefaultData("created_by"),
      project: this.issueDisplayFiltersDefaultData("project"),
      assignees: this.issueDisplayFiltersDefaultData("assignees"),
    };

    const issues: { [group_id: string]: string[] } = {};
    displayFiltersDefaultData[groupBy].forEach((group) => {
      issues[group] = [];
    });

    const projectIssues = this.issuesSortWithOrderBy(this.issues[projectId], orderBy);

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
    const projectId: string | undefined | null = this.rootStore?.project.projectId;
    const subGroupBy: TIssueGroupByOptions | undefined = this.rootStore?.issueFilter.userDisplayFilters.sub_group_by;
    const groupBy: TIssueGroupByOptions | undefined = this.rootStore?.issueFilter.userDisplayFilters.group_by;
    const orderBy: TIssueOrderByOptions | undefined = this.rootStore?.issueFilter.userDisplayFilters.order_by;

    if (!projectId || !subGroupBy || !groupBy || !orderBy || !this.issues || !this.issues[projectId]) return undefined;

    const displayFiltersDefaultData: { [filter_key: string]: string[] } = {
      state: this.issueDisplayFiltersDefaultData("state"),
      "state_detail.group": this.issueDisplayFiltersDefaultData("state_detail.group"),
      priority: this.issueDisplayFiltersDefaultData("priority"),
      labels: this.issueDisplayFiltersDefaultData("labels"),
      created_by: this.issueDisplayFiltersDefaultData("created_by"),
      project: this.issueDisplayFiltersDefaultData("project"),
      assignees: this.issueDisplayFiltersDefaultData("assignees"),
    };

    const issues: { [sub_group_id: string]: { [group_id: string]: string[] } } = {};
    displayFiltersDefaultData[subGroupBy].forEach((sub_group: any) => {
      const groupByIssues: { [group_id: string]: string[] } = {};
      displayFiltersDefaultData[groupBy].forEach((group) => {
        groupByIssues[group] = [];
      });
      issues[sub_group] = groupByIssues;
    });

    const projectIssues = this.issuesSortWithOrderBy(this.issues[projectId], orderBy);

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
    const projectId = this.rootStore?.project.projectId;
    const groupBy: TIssueGroupByOptions | undefined = this.rootStore?.issueFilter.userDisplayFilters.group_by;
    const orderBy: TIssueOrderByOptions | undefined = this.rootStore?.issueFilter.userDisplayFilters.order_by;

    if (!projectId || !orderBy || groupBy || !this.issues || !this.issues[projectId]) return undefined;

    return this.issuesSortWithOrderBy(this.issues[projectId], orderBy).map((issue) => issue.id);
  }

  fetchProjectIssues = async (workspaceSlug: string, projectId: string) => {
    try {
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

  // issue helpers
  issueDisplayFiltersDefaultData = (groupBy: string): string[] => {
    switch (groupBy) {
      case "state":
        return this.rootStore?.projectState.projectStateIds() ?? [];
      case "state_detail.group":
        return ISSUE_STATE_GROUPS.map((i) => i.key);
      case "priority":
        return ISSUE_PRIORITIES.map((i) => i.key);
      case "labels":
        return [...(this.rootStore?.project?.projectLabelIds() || []), "None"];
      case "created_by":
        return [...(this.rootStore?.project?.projectMemberIds() || []), "None"];
      case "assignees":
        return [...(this.rootStore?.project?.projectMemberIds() || []), "None"];
      case "project":
        return this.rootStore?.project?.workspaceProjectIds() ?? [];
      default:
        return [];
    }
  };

  issuesSortWithOrderBy = (issueObject: IIssueResponse, key: Partial<TIssueOrderByOptions>): IIssue[] => {
    const array = _.values(issueObject);
    switch (key) {
      case "sort_order":
        return _.sortBy(array, "sort_order");
      case "-created_at":
        return _.sortBy(array, "created_at");
      case "-updated_at":
        return _.sortBy(array, "created_at");
      case "start_date":
        return _.sortBy(array, "start_date");
      case "target_date":
        return _.sortBy(array, "target_date");
      case "priority": {
        const sortArray = ISSUE_PRIORITIES.map((i) => i.key);
        return _.sortBy(array, (_issue: IIssue) => _.indexOf(sortArray, _issue.priority));
      }
      default:
        return array;
    }
  };

  getGroupArray(value: string[] | string | null) {
    if (Array.isArray(value)) {
      return value;
    } else {
      return [value || "None"];
    }
  }
}
