import { action, observable, makeObservable, computed, runInAction, autorun } from "mobx";
import _ from "lodash";
// services
import { IssueService } from "services/issue/issue.service";
// constants
import { ISSUE_PRIORITIES, ISSUE_STATE_GROUPS } from "constants/issue";
// types
import { IIssue, TIssueGroupByOptions, TIssueOrderByOptions } from "types";
import { RootStore } from "store/root";
import { renderDateFormat } from "helpers/date-time.helper";

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

export interface IProjectIssueStore {
  // observable
  loader: "init-loader" | "mutation" | null;
  issues:
    | {
        [project_id: string]: IIssueResponse;
      }
    | undefined;
  // computed
  getIssues: IIssueResponse | IGroupedIssues | ISubGroupedIssues | TUnGroupedIssues | undefined;
  // actions
  fetchIssues: (workspaceSlug: string, projectId: string) => Promise<IIssueResponse>;
  createIssue: (workspaceSlug: string, projectId: string, data: Partial<IIssue>) => Promise<IIssue>;
  updateIssue: (workspaceSlug: string, projectId: string, issueId: string, data: Partial<IIssue>) => Promise<IIssue>;
  removeIssue: (workspaceSlug: string, projectId: string, issueId: string) => Promise<IIssue>;
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

  constructor(_rootStore: RootStore) {
    makeObservable(this, {
      // observable
      loader: observable.ref,
      issues: observable.ref,
      // computed
      getIssues: computed,
      // action
      fetchIssues: action,
      createIssue: action,
      updateIssue: action,
      removeIssue: action,
    });

    this.rootStore = _rootStore;
    this.issueService = new IssueService();

    autorun(() => {
      const workspaceSlug = this.rootStore.workspace.workspaceSlug;
      const projectId = this.rootStore.project.projectId;
      const userFilters = this.rootStore.issueFilter.userFilters;
      if (workspaceSlug && projectId && userFilters) this.fetchIssues(workspaceSlug, projectId);
    });
  }

  get getIssues() {
    const projectId = this.rootStore?.project.projectId;
    const projectDisplayFilters = this.rootStore?.projectIssueFilters.projectFilters?.displayFilters;

    const subGroupBy = projectDisplayFilters?.sub_group_by;
    const groupBy = projectDisplayFilters?.group_by;
    const orderBy = projectDisplayFilters?.order_by || undefined;
    const layout = projectDisplayFilters?.layout || undefined;

    if (!projectId || !this.issues || !this.issues[projectId]) return undefined;

    let issues: IIssueResponse | IGroupedIssues | ISubGroupedIssues | TUnGroupedIssues | undefined = undefined;

    if (layout === "gantt_chart")
      issues = this.unGroupedIssues(projectId, orderBy ?? "sort_order", this.issues[projectId]);
    else if (layout === "spreadsheet")
      issues = this.unGroupedIssues(projectId, orderBy ?? "-created_at", this.issues[projectId]);
    else if (layout === "calendar")
      issues = this.groupedIssues("target_date" as TIssueGroupByOptions, "target_date", this.issues[projectId], true);
    else {
      if (subGroupBy && groupBy && orderBy)
        issues = this.subGroupedIssues(subGroupBy, groupBy, orderBy, this.issues[projectId]);
      else if (groupBy && orderBy) issues = this.groupedIssues(groupBy, orderBy, this.issues[projectId]);
      else if (orderBy) issues = this.unGroupedIssues(projectId, orderBy, this.issues[projectId]);
    }

    return issues;
  }

  groupedIssues = (
    groupBy: TIssueGroupByOptions,
    orderBy: TIssueOrderByOptions,
    issues: IIssueResponse,
    isCalendarIssues: boolean = false
  ) => {
    const _issues: { [group_id: string]: string[] } = {};

    this.issueDisplayFiltersDefaultData(groupBy).forEach((group) => {
      _issues[group] = [];
    });

    const projectIssues = this.issuesSortWithOrderBy(issues, orderBy);

    for (const issue in projectIssues) {
      const _issue = projectIssues[issue];
      const groupArray = this.getGroupArray(_.get(_issue, groupBy as keyof IIssue), isCalendarIssues);

      for (const group of groupArray) {
        if (group && _issues[group]) _issues[group].push(_issue.id);
        else if (group) _issues[group] = [_issue.id];
      }
    }

    return _issues;
  };

  subGroupedIssues = (
    subGroupBy: TIssueGroupByOptions,
    groupBy: TIssueGroupByOptions,
    orderBy: TIssueOrderByOptions,
    issues: IIssueResponse
  ) => {
    const _issues: { [sub_group_id: string]: { [group_id: string]: string[] } } = {};

    this.issueDisplayFiltersDefaultData(subGroupBy).forEach((sub_group: any) => {
      const groupByIssues: { [group_id: string]: string[] } = {};
      this.issueDisplayFiltersDefaultData(groupBy).forEach((group) => {
        groupByIssues[group] = [];
      });
      _issues[sub_group] = groupByIssues;
    });

    const projectIssues = this.issuesSortWithOrderBy(issues, orderBy);

    for (const issue in projectIssues) {
      const _issue = projectIssues[issue];
      const subGroupArray = this.getGroupArray(_.get(_issue, subGroupBy as keyof IIssue));
      const groupArray = this.getGroupArray(_.get(_issue, groupBy as keyof IIssue));

      for (const subGroup of subGroupArray) {
        for (const group of groupArray) {
          if (subGroup && group && issues[subGroup]) {
            _issues[subGroup][group].push(_issue.id);
          }
        }
      }
    }

    return _issues;
  };

  unGroupedIssues = (projectId: string, orderBy: TIssueOrderByOptions, issues: IIssueResponse) =>
    this.issuesSortWithOrderBy(issues, orderBy).map((issue) => issue.id);

  issueDisplayFiltersDefaultData = (groupBy: string | null): string[] => {
    switch (groupBy) {
      case "state":
        return this.rootStore?.projectState.projectStateIds();
      case "state_detail.group":
        return ISSUE_STATE_GROUPS.map((i) => i.key);
      case "priority":
        return ISSUE_PRIORITIES.map((i) => i.key);
      case "labels":
        return this.rootStore?.project?.projectLabelIds(true);
      case "created_by":
        return this.rootStore?.projectMember?.projectMemberIds(true);
      case "assignees":
        return this.rootStore?.projectMember?.projectMemberIds(true);
      case "project":
        return this.rootStore?.project?.workspaceProjectIds();
      default:
        return [];
    }
  };

  issuesSortWithOrderBy = (issueObject: IIssueResponse, key: Partial<TIssueOrderByOptions>): IIssue[] => {
    let array = _.values(issueObject);
    array = _.sortBy(array, "created_at");
    switch (key) {
      case "sort_order":
        return _.sortBy(array, "sort_order");
      case "-created_at":
        return _.reverse(_.sortBy(array, "created_at"));
      case "-updated_at":
        return _.reverse(_.sortBy(array, "updated_at"));
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

  getGroupArray(value: string[] | string | null, isDate: boolean = false) {
    if (Array.isArray(value)) return value;
    else if (isDate) return [renderDateFormat(value) || "None"];
    else return [value || "None"];
  }

  fetchIssues = async (workspaceSlug: string, projectId: string) => {
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

  createIssue = async (workspaceSlug: string, projectId: string, data: Partial<IIssue>) => {
    try {
      const user = this.rootStore.user.currentUser || undefined;
      const response = await this.issueService.createIssue(workspaceSlug, projectId, data, user);

      let _issues = this.issues;
      if (!_issues) _issues = {};
      if (!_issues[projectId]) _issues[projectId] = {};

      runInAction(() => {
        this.issues = _issues;
      });

      return response;
    } catch (error) {
      this.fetchIssues(workspaceSlug, projectId);
      throw error;
    }
  };

  updateIssue = async (workspaceSlug: string, projectId: string, issueId: string, data: Partial<IIssue>) => {
    try {
      if (this.issues?.[projectId]?.[issueId])
        this.issues[projectId][issueId] = { ...this.issues[projectId][issueId], ...data };

      const user = this.rootStore.user.currentUser || undefined;
      const response = await this.issueService.patchIssue(workspaceSlug, projectId, issueId, data, user);

      return response;
    } catch (error) {
      this.fetchIssues(workspaceSlug, projectId);
      throw error;
    }
  };

  removeIssue = async (workspaceSlug: string, projectId: string, issueId: string) => {
    try {
      delete this.issues?.[projectId]?.[issueId];

      const user = this.rootStore.user.currentUser || undefined;
      const response = await this.issueService.deleteIssue(workspaceSlug, projectId, issueId, user);

      return response;
    } catch (error) {
      this.fetchIssues(workspaceSlug, projectId);
      throw error;
    }
  };
}
