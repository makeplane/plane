import orderBy from "lodash/orderBy";
import get from "lodash/get";
import indexOf from "lodash/indexOf";
import isEmpty from "lodash/isEmpty";
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
        return Object.keys(this.rootStore?.stateMap || {});
      case "state_detail.group":
        return Object.keys(STATE_GROUPS);
      case "priority":
        return ISSUE_PRIORITIES.map((i) => i.key);
      case "labels":
        return Object.keys(this.rootStore?.labelMap || {});
      case "created_by":
        return Object.keys(this.rootStore?.workSpaceMemberRolesMap || {});
      case "assignees":
        return Object.keys(this.rootStore?.workSpaceMemberRolesMap || {});
      case "project":
        return Object.keys(this.rootStore?.projectMap || {});
      default:
        return [];
    }
  };

  /**
   * This Method is used to get data of the issue based on the ids of the data for states, labels adn assignees
   * @param dataType what type of data is being sent
   * @param dataIds id/ids of the data that is to be populated
   * @param order ascending or descending for arrays of data
   * @returns string | string[] of sortable fields to be used for sorting
   */
  populateIssueDataForSorting(
    dataType: "state_id" | "label_ids" | "assignee_ids" | "module_ids" | "cycle_id",
    dataIds: string | string[] | null | undefined,
    order?: "asc" | "desc"
  ) {
    if (!dataIds) return;

    const dataValues: string[] = [];
    const isDataIdsArray = Array.isArray(dataIds);
    const dataIdsArray = isDataIdsArray ? dataIds : [dataIds];

    switch (dataType) {
      case "state_id":
        const stateMap = this.rootStore?.stateMap;
        if (!stateMap) break;
        for (const dataId of dataIdsArray) {
          const state = stateMap[dataId];
          if (state && state.name) dataValues.push(state.name.toLocaleLowerCase());
        }
        break;
      case "label_ids":
        const labelMap = this.rootStore?.labelMap;
        if (!labelMap) break;
        for (const dataId of dataIdsArray) {
          const label = labelMap[dataId];
          if (label && label.name) dataValues.push(label.name.toLocaleLowerCase());
        }
        break;
      case "assignee_ids":
        const memberMap = this.rootStore?.memberMap;
        if (!memberMap) break;
        for (const dataId of dataIdsArray) {
          const member = memberMap[dataId];
          if (member && member.first_name) dataValues.push(member.first_name.toLocaleLowerCase());
        }
        break;
      case "module_ids":
        const moduleMap = this.rootStore?.moduleMap;
        if (!moduleMap) break;
        for (const dataId of dataIdsArray) {
          const _module = moduleMap[dataId];
          if (_module && _module.name) dataValues.push(_module.name.toLocaleLowerCase());
        }
        break;
      case "cycle_id":
        const cycleMap = this.rootStore?.cycleMap;
        if (!cycleMap) break;
        for (const dataId of dataIdsArray) {
          const cycle = cycleMap[dataId];
          if (cycle && cycle.name) dataValues.push(cycle.name.toLocaleLowerCase());
        }
        break;
    }

    return isDataIdsArray ? (order ? orderBy(dataValues, undefined, [order]) : dataValues) : dataValues[0];
  }

  /**
   * This Method is mainly used to filter out empty values in the begining
   * @param key key of the value that is to be checked if empty
   * @param object any object in which the key's value is to be checked
   * @returns 1 if emoty, 0 if not empty
   */
  getSortOrderToFilterEmptyValues(key: string, object: any) {
    const value = object?.[key];

    if (typeof value !== "number" && isEmpty(value)) return 1;

    return 0;
  }

  issuesSortWithOrderBy = (issueObject: TIssueMap, key: Partial<TIssueOrderByOptions>): TIssue[] => {
    let array = values(issueObject);
    array = orderBy(array, "created_at");

    switch (key) {
      case "sort_order":
        return orderBy(array, "sort_order");
      case "state__name":
        return orderBy(array, (issue) => this.populateIssueDataForSorting("state_id", issue["state_id"]));
      case "-state__name":
        return orderBy(array, (issue) => this.populateIssueDataForSorting("state_id", issue["state_id"]), ["desc"]);
      // dates
      case "created_at":
        return orderBy(array, "created_at");
      case "-created_at":
        return orderBy(array, "created_at", ["desc"]);
      case "updated_at":
        return orderBy(array, "updated_at");
      case "-updated_at":
        return orderBy(array, "updated_at", ["desc"]);
      case "start_date":
        return orderBy(array, [this.getSortOrderToFilterEmptyValues.bind(null, "start_date"), "start_date"]); //preferring sorting based on empty values to always keep the empty values below
      case "-start_date":
        return orderBy(
          array,
          [this.getSortOrderToFilterEmptyValues.bind(null, "start_date"), "start_date"], //preferring sorting based on empty values to always keep the empty values below
          ["asc", "desc"]
        );

      case "target_date":
        return orderBy(array, [this.getSortOrderToFilterEmptyValues.bind(null, "target_date"), "target_date"]); //preferring sorting based on empty values to always keep the empty values below
      case "-target_date":
        return orderBy(
          array,
          [this.getSortOrderToFilterEmptyValues.bind(null, "target_date"), "target_date"], //preferring sorting based on empty values to always keep the empty values below
          ["asc", "desc"]
        );

      // custom
      case "priority": {
        const sortArray = ISSUE_PRIORITIES.map((i) => i.key);
        return orderBy(array, (_issue: TIssue) => indexOf(sortArray, _issue.priority), ["desc"]);
      }
      case "-priority": {
        const sortArray = ISSUE_PRIORITIES.map((i) => i.key);
        return orderBy(array, (_issue: TIssue) => indexOf(sortArray, _issue.priority));
      }

      // number
      case "attachment_count":
        return orderBy(array, "attachment_count");
      case "-attachment_count":
        return orderBy(array, "attachment_count", ["desc"]);

      case "estimate_point":
        return orderBy(array, [this.getSortOrderToFilterEmptyValues.bind(null, "estimate_point"), "estimate_point"]); //preferring sorting based on empty values to always keep the empty values below
      case "-estimate_point":
        return orderBy(
          array,
          [this.getSortOrderToFilterEmptyValues.bind(null, "estimate_point"), "estimate_point"], //preferring sorting based on empty values to always keep the empty values below
          ["asc", "desc"]
        );

      case "link_count":
        return orderBy(array, "link_count");
      case "-link_count":
        return orderBy(array, "link_count", ["desc"]);

      case "sub_issues_count":
        return orderBy(array, "sub_issues_count");
      case "-sub_issues_count":
        return orderBy(array, "sub_issues_count", ["desc"]);

      // Array
      case "labels__name":
        return orderBy(array, [
          this.getSortOrderToFilterEmptyValues.bind(null, "label_ids"), //preferring sorting based on empty values to always keep the empty values below
          (issue) => this.populateIssueDataForSorting("label_ids", issue["label_ids"], "asc"),
        ]);
      case "-labels__name":
        return orderBy(
          array,
          [
            this.getSortOrderToFilterEmptyValues.bind(null, "label_ids"), //preferring sorting based on empty values to always keep the empty values below
            (issue) => this.populateIssueDataForSorting("label_ids", issue["label_ids"], "desc"),
          ],
          ["asc", "desc"]
        );

      case "modules__name":
        return orderBy(array, [
          this.getSortOrderToFilterEmptyValues.bind(null, "module_ids"), //preferring sorting based on empty values to always keep the empty values below
          (issue) => this.populateIssueDataForSorting("module_ids", issue["module_ids"], "asc"),
        ]);
      case "-modules__name":
        return orderBy(
          array,
          [
            this.getSortOrderToFilterEmptyValues.bind(null, "module_ids"), //preferring sorting based on empty values to always keep the empty values below
            (issue) => this.populateIssueDataForSorting("module_ids", issue["module_ids"], "desc"),
          ],
          ["asc", "desc"]
        );

      case "cycle__name":
        return orderBy(array, [
          this.getSortOrderToFilterEmptyValues.bind(null, "cycle_id"), //preferring sorting based on empty values to always keep the empty values below
          (issue) => this.populateIssueDataForSorting("cycle_id", issue["cycle_id"], "asc"),
        ]);
      case "-cycle__name":
        return orderBy(
          array,
          [
            this.getSortOrderToFilterEmptyValues.bind(null, "cycle_id"), //preferring sorting based on empty values to always keep the empty values below
            (issue) => this.populateIssueDataForSorting("cycle_id", issue["cycle_id"], "desc"),
          ],
          ["asc", "desc"]
        );

      case "assignees__first_name":
        return orderBy(array, [
          this.getSortOrderToFilterEmptyValues.bind(null, "assignee_ids"), //preferring sorting based on empty values to always keep the empty values below
          (issue) => this.populateIssueDataForSorting("assignee_ids", issue["assignee_ids"], "asc"),
        ]);
      case "-assignees__first_name":
        return orderBy(
          array,
          [
            this.getSortOrderToFilterEmptyValues.bind(null, "assignee_ids"), //preferring sorting based on empty values to always keep the empty values below
            (issue) => this.populateIssueDataForSorting("assignee_ids", issue["assignee_ids"], "desc"),
          ],
          ["asc", "desc"]
        );

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
