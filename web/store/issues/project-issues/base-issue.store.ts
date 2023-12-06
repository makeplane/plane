import sortBy from "lodash/sortBy";
import get from "lodash/get";
import indexOf from "lodash/indexOf";
import reverse from "lodash/reverse";
import values from "lodash/values";
// types
import { IIssue, TIssueGroupByOptions, TIssueOrderByOptions } from "types";
import { RootStore } from "store/root";
import { IIssueResponse } from "../types";
// constants
import { ISSUE_PRIORITIES, ISSUE_STATE_GROUPS } from "constants/issue";
// helpers
import { renderDateFormat } from "helpers/date-time.helper";

export interface IIssueBaseStore {
  groupedIssues(
    groupBy: TIssueGroupByOptions,
    orderBy: TIssueOrderByOptions,
    issues: IIssueResponse,
    isCalendarIssues?: boolean
  ): { [group_id: string]: string[] };
  subGroupedIssues(
    subGroupBy: TIssueGroupByOptions,
    groupBy: TIssueGroupByOptions,
    orderBy: TIssueOrderByOptions,
    issues: IIssueResponse
  ): { [sub_group_id: string]: { [group_id: string]: string[] } };
  unGroupedIssues(orderBy: TIssueOrderByOptions, issues: IIssueResponse): string[];
  issueDisplayFiltersDefaultData(groupBy: string | null): string[];
  issuesSortWithOrderBy(issueObject: IIssueResponse, key: Partial<TIssueOrderByOptions>): IIssue[];
  getGroupArray(value: string[] | string | null, isDate?: boolean): string[];
}

export class IssueBaseStore implements IIssueBaseStore {
  // root store
  rootStore;

  constructor(_rootStore: RootStore) {
    this.rootStore = _rootStore;
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
      const groupArray = this.getGroupArray(get(_issue, groupBy as keyof IIssue), isCalendarIssues);

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
      const subGroupArray = this.getGroupArray(get(_issue, subGroupBy as keyof IIssue));
      const groupArray = this.getGroupArray(get(_issue, groupBy as keyof IIssue));

      for (const subGroup of subGroupArray) {
        for (const group of groupArray) {
          if (subGroup && group && _issues?.[subGroup]?.[group]) _issues[subGroup][group].push(_issue.id);
          else if (subGroup && group && _issues[subGroup]) _issues[subGroup][group] = [_issue.id];
          else if (subGroup && group) _issues[subGroup] = { [group]: [_issue.id] };
        }
      }
    }

    return _issues;
  };

  unGroupedIssues = (orderBy: TIssueOrderByOptions, issues: IIssueResponse) =>
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
        return this.rootStore?.projectLabel?.projectLabelIds(true);
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
    let array = values(issueObject);
    array = reverse(sortBy(array, "created_at"));
    switch (key) {
      case "sort_order":
        return reverse(sortBy(array, "sort_order"));
      case "state__name": {
        return reverse(sortBy(array, "state"));
      }
      case "-state__name": {
        return sortBy(array, "state");
      }
      //dates
      case "created_at":
        return sortBy(array, "created_at");
      case "-created_at":
        return reverse(sortBy(array, "created_at"));
      case "updated_at":
        return sortBy(array, "updated_at");
      case "-updated_at":
        return reverse(sortBy(array, "updated_at"));
      case "start_date":
        return sortBy(array, "start_date");
      case "-start_date":
        return reverse(sortBy(array, "start_date"));
      case "target_date":
        return sortBy(array, "target_date");
      case "-target_date":
        return reverse(sortBy(array, "target_date"));
      //custom
      case "priority": {
        const sortArray = ISSUE_PRIORITIES.map((i) => i.key);
        return reverse(sortBy(array, (_issue: IIssue) => indexOf(sortArray, _issue.priority)));
      }
      case "-priority": {
        const sortArray = ISSUE_PRIORITIES.map((i) => i.key);
        return sortBy(array, (_issue: IIssue) => indexOf(sortArray, _issue.priority));
      }
      //number
      case "attachment_count":
        return sortBy(array, "attachment_count");
      case "-attachment_count":
        return reverse(sortBy(array, "attachment_count"));
      case "estimate_point":
        return sortBy(array, "estimate_point");
      case "-estimate_point":
        return reverse(sortBy(array, "estimate_point"));
      case "link_count":
        return sortBy(array, "link_count");

      case "-link_count":
        return reverse(sortBy(array, "link_count"));
      case "sub_issues_count":
        return sortBy(array, "sub_issues_count");

      case "-sub_issues_count":
        return reverse(sortBy(array, "sub_issues_count"));
      //Array
      case "labels__name":
        return reverse(sortBy(array, "labels"));
      case "-labels__name":
        return sortBy(array, "labels");
      case "assignees__first_name":
        return reverse(sortBy(array, "assignees"));

      case "-assignees__first_name":
        return sortBy(array, "assignees");
      default:
        return array;
    }
  };

  getGroupArray(value: string[] | string | null, isDate: boolean = false) {
    if (Array.isArray(value)) {
      if (value.length) return value;
      else return ["None"];
    } else if (isDate) return [renderDateFormat(value) || "None"];
    else return [value || "None"];
  }
}
