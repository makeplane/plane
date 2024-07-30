import { IIssueDisplayProperties, IIssueFilterOptions } from "@plane/types";

export enum EIssueLayoutTypes {
  LIST = "list",
  KANBAN = "kanban",
  CALENDAR = "calendar",
  GANTT = "gantt_chart",
  SPREADSHEET = "spreadsheet",
}

export const ISSUE_FILTERS_BY_LAYOUT: {
  [key in EIssueLayoutTypes]: { filters: (keyof IIssueFilterOptions)[]; canGroup: boolean; canSubGroup: boolean };
} = {
  list: {
    filters: ["priority", "state", "cycle", "module", "assignees", "created_by", "labels", "start_date", "target_date"],
    canGroup: true,
    canSubGroup: false,
  },
  kanban: {
    filters: ["priority", "state", "cycle", "module", "assignees", "created_by", "labels", "start_date", "target_date"],
    canGroup: true,
    canSubGroup: true,
  },
  calendar: {
    filters: ["priority", "state", "cycle", "module", "assignees", "created_by", "labels", "start_date"],
    canGroup: false,
    canSubGroup: false,
  },
  spreadsheet: {
    filters: ["priority", "state", "cycle", "module", "assignees", "created_by", "labels", "start_date", "target_date"],
    canGroup: false,
    canSubGroup: false,
  },
  gantt_chart: {
    filters: ["priority", "state", "cycle", "module", "assignees", "created_by", "labels", "start_date", "target_date"],
    canGroup: false,
    canSubGroup: false,
  },
};

export const REQUIRED_ISSUE_DATA: (keyof IIssueFilterOptions)[] = [
  "priority",
  "state",
  "cycle",
  "module",
  "labels",
  "assignees",
];

export const FILTERS_TO_PROPERTIES_MAP: { [key in keyof IIssueFilterOptions]: keyof IIssueDisplayProperties } = {
  priority: "priority",
  state: "state",
  cycle: "cycle",
  module: "modules",
  assignees: "assignee",
  labels: "labels",
  start_date: "start_date",
  target_date: "due_date",
};

export const ISSUE_MULTIPLE_DATA: { [key in keyof IIssueFilterOptions]: boolean } = {
  priority: false,
  state: false,
  cycle: false,
  module: true,
  assignees: true,
  labels: true,
  start_date: false,
  target_date: false,
};


export const SPREADSHEET_PROPERTY_LIST: (keyof IIssueDisplayProperties)[] = [
  "state",
  "priority",
  "assignee",
  "labels",
  "modules",
  "cycle",
  "start_date",
  "due_date",
  //"estimate",
  "created_on",
  "updated_on",
  "link",
  "attachment_count",
  "sub_issue_count",
];

export const DATE_AFTER_FILTER_OPTIONS = [
  {
    name: "1 week from now",
    value: "1_weeks;after;fromnow",
  },
  {
    name: "2 weeks from now",
    value: "2_weeks;after;fromnow",
  },
  {
    name: "1 month from now",
    value: "1_months;after;fromnow",
  },
  {
    name: "2 months from now",
    value: "2_months;after;fromnow",
  },
];

export const DATE_BEFORE_FILTER_OPTIONS = [
  {
    name: "1 week ago",
    value: "1_weeks;before;fromnow",
  },
  {
    name: "2 weeks ago",
    value: "2_weeks;before;fromnow",
  },
  {
    name: "1 month ago",
    value: "1_months;before;fromnow",
  },
];