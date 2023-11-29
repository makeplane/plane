import _ from "lodash";
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
          if (subGroup && group && _issues[subGroup][group]) _issues[subGroup][group].push(_issue.id);
          else if (subGroup && group) _issues[subGroup][group] = [_issue.id];
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
    let array = _.values(issueObject);
    array = _.reverse(_.sortBy(array, "created_at"));
    switch (key) {
      case "sort_order":
        return _.reverse(_.sortBy(array, "sort_order"));
      case "state__name": {
        return _.reverse(_.sortBy(array, "state"));
      }
      case "-state__name": {
        return _.sortBy(array, "state");
      }
      //dates
      case "created_at":
        return _.sortBy(array, "created_at");
      case "-created_at":
        return _.reverse(_.sortBy(array, "created_at"));
      case "updated_at":
        return _.sortBy(array, "updated_at");
      case "-updated_at":
        return _.reverse(_.sortBy(array, "updated_at"));
      case "start_date":
        return _.sortBy(array, "start_date");
      case "-start_date":
        return _.reverse(_.sortBy(array, "start_date"));
      case "target_date":
        return _.sortBy(array, "target_date");
      case "-target_date":
        return _.reverse(_.sortBy(array, "target_date"));
      //custom
      case "priority": {
        const sortArray = ISSUE_PRIORITIES.map((i) => i.key);
        return _.reverse(_.sortBy(array, (_issue: IIssue) => _.indexOf(sortArray, _issue.priority)));
      }
      case "-priority": {
        const sortArray = ISSUE_PRIORITIES.map((i) => i.key);
        return _.sortBy(array, (_issue: IIssue) => _.indexOf(sortArray, _issue.priority));
      }
      //number
      case "attachment_count":
        return _.sortBy(array, "attachment_count");
      case "-attachment_count":
        return _.reverse(_.sortBy(array, "attachment_count"));
      case "estimate_point":
        return _.sortBy(array, "estimate_point");
      case "-estimate_point":
        return _.reverse(_.sortBy(array, "estimate_point"));
      case "link_count":
        return _.sortBy(array, "link_count");

      case "-link_count":
        return _.reverse(_.sortBy(array, "link_count"));
      case "sub_issues_count":
        return _.sortBy(array, "sub_issues_count");

      case "-sub_issues_count":
        return _.reverse(_.sortBy(array, "sub_issues_count"));
      //Array
      case "labels__name":
        return _.reverse(_.sortBy(array, "labels"));
      case "-labels__name":
        return _.sortBy(array, "labels");
      case "assignees__first_name":
        return _.reverse(_.sortBy(array, "assignees"));

      case "-assignees__first_name":
        return _.sortBy(array, "assignees");
      default:
        return array;
    }
  };

  getGroupArray(value: string[] | string | null, isDate: boolean = false) {
    if (Array.isArray(value)) return value;
    else if (isDate) return [renderDateFormat(value) || "None"];
    else return [value || "None"];
  }
}
