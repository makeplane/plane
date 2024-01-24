import sortBy from "lodash/sortBy";
import get from "lodash/get";
import indexOf from "lodash/indexOf";
import reverse from "lodash/reverse";
import values from "lodash/values";
// types
import { TIssue, TIssueMap, TIssueGroupByOptions, TIssueOrderByOptions } from "@plane/types";
import { IIssueRootStore } from "../root.store";
// constants
import { ISSUE_PRIORITIES } from "constants/issue";
import { STATE_GROUPS } from "constants/state";
// helpers
import { renderFormattedPayloadDate } from "helpers/date-time.helper";

export type TIssueDisplayFilterOptions = Exclude<TIssueGroupByOptions, null> | "target_date";

export type TIssueHelperStore = {
  // helper methods
  groupedIssues(
    groupBy: TIssueDisplayFilterOptions,
    orderBy: TIssueOrderByOptions,
    issues: TIssueMap,
    isCalendarIssues?: boolean
  ): { [group_id: string]: string[] };
  subGroupedIssues(
    subGroupBy: TIssueDisplayFilterOptions,
    groupBy: TIssueDisplayFilterOptions,
    orderBy: TIssueOrderByOptions,
    issues: TIssueMap
  ): { [sub_group_id: string]: { [group_id: string]: string[] } };
  unGroupedIssues(orderBy: TIssueOrderByOptions, issues: TIssueMap): string[];
  issueDisplayFiltersDefaultData(groupBy: string | null): string[];
  issuesSortWithOrderBy(issueObject: TIssueMap, key: Partial<TIssueOrderByOptions>): TIssue[];
  getGroupArray(value: boolean | number | string | string[] | null, isDate?: boolean): string[];
};

const ISSUE_FILTER_DEFAULT_DATA: Record<TIssueDisplayFilterOptions, keyof TIssue> = {
  project: "project_id",
  state: "state_id",
  "state_detail.group": "state_group" as keyof TIssue, // state_detail.group is only being used for state_group display,
  priority: "priority",
  labels: "label_ids",
  created_by: "created_by",
  assignees: "assignee_ids",
  mentions: "assignee_ids",
  target_date: "target_date",
};

export class IssueHelperStore implements TIssueHelperStore {
  // root store
  rootStore;

  constructor(_rootStore: IIssueRootStore) {
    this.rootStore = _rootStore;
  }

  groupedIssues = (
    groupBy: TIssueDisplayFilterOptions,
    orderBy: TIssueOrderByOptions,
    issues: TIssueMap,
    isCalendarIssues: boolean = false
  ) => {
    const _issues: { [group_id: string]: string[] } = {};
    if (!groupBy) return _issues;

    this.issueDisplayFiltersDefaultData(groupBy).forEach((group) => {
      _issues[group] = [];
    });

    const projectIssues = this.issuesSortWithOrderBy(issues, orderBy);

    for (const issue in projectIssues) {
      const _issue = projectIssues[issue];
      let groupArray = [];

      if (groupBy === "state_detail.group") {
        const state_group =
          this.rootStore?.stateDetails?.find((_state) => _state.id === _issue?.state_id)?.group || "None";
        groupArray = [state_group];
      } else {
        const groupValue = get(_issue, ISSUE_FILTER_DEFAULT_DATA[groupBy]);
        groupArray = groupValue !== undefined ? this.getGroupArray(groupValue, isCalendarIssues) : [];
      }

      for (const group of groupArray) {
        if (group && _issues[group]) _issues[group].push(_issue.id);
        else if (group) _issues[group] = [_issue.id];
      }
    }

    return _issues;
  };

  subGroupedIssues = (
    subGroupBy: TIssueDisplayFilterOptions,
    groupBy: TIssueDisplayFilterOptions,
    orderBy: TIssueOrderByOptions,
    issues: TIssueMap
  ) => {
    const _issues: { [sub_group_id: string]: { [group_id: string]: string[] } } = {};
    if (!subGroupBy || !groupBy) return _issues;

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
      let subGroupArray = [];
      let groupArray = [];
      if (subGroupBy === "state_detail.group" || groupBy === "state_detail.group") {
        const state_group =
          this.rootStore?.stateDetails?.find((_state) => _state.id === _issue?.state_id)?.group || "None";
        subGroupArray = [state_group];
        groupArray = [state_group];
      } else {
        const subGroupValue = get(_issue, ISSUE_FILTER_DEFAULT_DATA[subGroupBy]);
        const groupValue = get(_issue, ISSUE_FILTER_DEFAULT_DATA[groupBy]);
        subGroupArray = subGroupValue != undefined ? this.getGroupArray(subGroupValue) : [];
        groupArray = groupValue != undefined ? this.getGroupArray(groupValue) : [];
      }

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

  unGroupedIssues = (orderBy: TIssueOrderByOptions, issues: TIssueMap) =>
    this.issuesSortWithOrderBy(issues, orderBy).map((issue) => issue.id);

  issueDisplayFiltersDefaultData = (groupBy: string | null): string[] => {
    switch (groupBy) {
      case "state":
        return this.rootStore?.states || [];
      case "state_detail.group":
        return Object.keys(STATE_GROUPS);
      case "priority":
        return ISSUE_PRIORITIES.map((i) => i.key);
      case "labels":
        return this.rootStore?.labels || [];
      case "created_by":
        return this.rootStore?.members || [];
      case "assignees":
        return this.rootStore?.members || [];
      case "project":
        return this.rootStore?.projects || [];
      default:
        return [];
    }
  };

  issuesSortWithOrderBy = (issueObject: TIssueMap, key: Partial<TIssueOrderByOptions>): TIssue[] => {
    let array = values(issueObject);
    array = reverse(sortBy(array, "created_at"));
    switch (key) {
      case "sort_order":
        return sortBy(array, "sort_order");

      case "state__name":
        return reverse(sortBy(array, "state"));
      case "-state__name":
        return sortBy(array, "state");

      // dates
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

      // custom
      case "priority": {
        const sortArray = ISSUE_PRIORITIES.map((i) => i.key);
        return reverse(sortBy(array, (_issue: TIssue) => indexOf(sortArray, _issue.priority)));
      }
      case "-priority": {
        const sortArray = ISSUE_PRIORITIES.map((i) => i.key);
        return sortBy(array, (_issue: TIssue) => indexOf(sortArray, _issue.priority));
      }

      // number
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

      // Array
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

  getGroupArray(value: boolean | number | string | string[] | null, isDate: boolean = false): string[] {
    if (!value || value === null || value === undefined) return ["None"];
    if (Array.isArray(value))
      if (value.length) return value;
      else return ["None"];
    else if (typeof value === "boolean") return [value ? "True" : "False"];
    else if (typeof value === "number") return [value.toString()];
    else if (isDate) return [renderFormattedPayloadDate(value) || "None"];
    else return [value || "None"];
  }
}
