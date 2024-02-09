// types
import { TStateGroups, TIssuePriorities, TViewFilters, TViewDisplayFilters, TViewLayouts } from "@plane/types";

// filters constants
export const STATE_GROUP_PROPERTY: {
  [key in TStateGroups]: {
    label: string;
    color: string;
  };
} = {
  backlog: {
    label: "Backlog",
    color: "#d9d9d9",
  },
  unstarted: {
    label: "Unstarted",
    color: "#3f76ff",
  },
  started: {
    label: "Started",
    color: "#f59e0b",
  },
  completed: {
    label: "Completed",
    color: "#16a34a",
  },
  cancelled: {
    label: "Canceled",
    color: "#dc2626",
  },
};

export const PRIORITIES_PROPERTY: {
  [key in TIssuePriorities]: {
    label: string;
  };
} = {
  urgent: { label: "Urgent" },
  high: { label: "High" },
  medium: { label: "Medium" },
  low: { label: "Low" },
  none: { label: "None" },
};

export const DATE_PROPERTY: {
  [key in string]: {
    label: string;
  };
} = {
  "1_weeks;after;fromnow": { label: "1 week from now" },
  "2_weeks;after;fromnow": { label: "2 weeks from now" },
  "1_months;after;fromnow": { label: "1 month from now" },
  "2_months;after;fromnow": { label: "2 months from now" },
  custom: { label: "Custom" },
};

// display filter constants

// layout, filter, display filter and display properties permissions for views
type TViewLayoutFilterProperties = {
  filters: Partial<keyof TViewFilters>[];
  readonlyFilters?: Partial<keyof TViewFilters>[];
  display_filters: Partial<keyof TViewDisplayFilters>[];
  extra_options: ("sub_issue" | "show_empty_groups")[];
  display_properties: boolean;
};

type TViewLayoutFilters = {
  list: TViewLayoutFilterProperties;
  kanban: TViewLayoutFilterProperties;
  calendar: TViewLayoutFilterProperties;
  spreadsheet: TViewLayoutFilterProperties;
  gantt: TViewLayoutFilterProperties;
};

type TFilterPermissions = {
  all: Omit<TViewLayoutFilters, "list" | "kanban" | "calendar" | "gantt"> & {
    layouts: Omit<TViewLayouts, "list" | "kanban" | "calendar" | "gantt">[];
  };
  profile: Omit<TViewLayoutFilters, "spreadsheet" | "calendar" | "gantt"> & {
    layouts: Omit<TViewLayouts, "spreadsheet" | "calendar" | "gantt">[];
  };
  project: TViewLayoutFilters & {
    layouts: TViewLayouts[];
  };
  archived: Omit<TViewLayoutFilters, "kanban" | "spreadsheet" | "calendar" | "gantt"> & {
    layouts: Omit<TViewLayouts, "kanban" | "spreadsheet" | "calendar" | "gantt">[];
  };
  draft: Omit<TViewLayoutFilters, "spreadsheet" | "calendar" | "gantt"> & {
    layouts: Omit<TViewLayouts, "kanban" | "spreadsheet" | "calendar" | "gantt">[];
  };
};

const ALL_FILTER_PERMISSIONS: TFilterPermissions["all"] = {
  layouts: ["spreadsheet"],
  spreadsheet: {
    // filters: ["project", "priority", "state_group", "assignees", "created_by", "labels", "start_date", "target_date"],
    filters: [
      "project",
      "module",
      "cycle",
      "priority",
      "state",
      "state_group",
      "assignees",
      "mentions",
      "subscriber",
      "created_by",
      "labels",
      "start_date",
      "target_date",
    ],
    // display_filters: ["type"],
    display_filters: ["group_by", "sub_group_by", "order_by", "type"],
    extra_options: [],
    display_properties: true,
  },
};

const PROFILE_FILTER_PERMISSIONS: TFilterPermissions["profile"] = {
  layouts: ["list", "kanban"],
  list: {
    filters: ["priority", "state_group", "labels", "start_date", "target_date"],
    display_filters: ["group_by", "order_by", "type"],
    extra_options: [],
    display_properties: true,
  },
  kanban: {
    filters: ["priority", "state_group", "labels", "start_date", "target_date"],
    display_filters: ["group_by", "order_by", "type"],
    extra_options: [],
    display_properties: true,
  },
};

const PROJECT_FILTER_PERMISSIONS: TFilterPermissions["project"] = {
  layouts: ["list", "kanban", "spreadsheet", "calendar", "gantt"],
  list: {
    filters: [
      "priority",
      "state",
      "assignees",
      "mentions",
      "created_by",
      "labels",
      "start_date",
      "target_date",
      "module",
      "cycle",
    ],
    display_filters: ["group_by", "order_by", "type"],
    extra_options: ["sub_issue", "show_empty_groups"],
    display_properties: true,
  },
  kanban: {
    filters: [
      "priority",
      "state",
      "assignees",
      "mentions",
      "created_by",
      "labels",
      "start_date",
      "target_date",
      "module",
      "cycle",
    ],
    display_filters: ["group_by", "sub_group_by", "order_by", "type"],
    extra_options: ["sub_issue", "show_empty_groups"],
    display_properties: true,
  },
  calendar: {
    filters: [
      "priority",
      "state",
      "assignees",
      "mentions",
      "created_by",
      "labels",
      "start_date",
      "target_date",
      "module",
      "cycle",
    ],
    display_filters: ["type"],
    extra_options: ["sub_issue"],
    display_properties: true,
  },
  spreadsheet: {
    filters: [
      "priority",
      "state",
      "assignees",
      "mentions",
      "created_by",
      "labels",
      "start_date",
      "target_date",
      "module",
      "cycle",
    ],
    display_filters: ["order_by", "type"],
    extra_options: [],
    display_properties: true,
  },

  gantt: {
    filters: [
      "priority",
      "state",
      "assignees",
      "mentions",
      "created_by",
      "labels",
      "start_date",
      "target_date",
      "module",
      "cycle",
    ],
    display_filters: ["order_by", "type"],
    extra_options: ["sub_issue"],
    display_properties: false,
  },
};

const ARCHIVED_FILTER_PERMISSIONS: TFilterPermissions["archived"] = {
  layouts: ["list"],
  list: {
    filters: [
      "priority",
      "state",
      "assignees",
      "mentions",
      "created_by",
      "labels",
      "start_date",
      "target_date",
      "module",
      "cycle",
    ],
    display_filters: ["group_by", "order_by"],
    extra_options: [],
    display_properties: true,
  },
};

const DRAFT_FILTER_PERMISSIONS: TFilterPermissions["draft"] = {
  layouts: ["list", "kanban"],
  list: {
    filters: [
      "priority",
      "state",
      "assignees",
      "mentions",
      "created_by",
      "labels",
      "start_date",
      "target_date",
      "module",
      "cycle",
    ],
    display_filters: ["group_by", "order_by", "type"],
    extra_options: ["sub_issue", "show_empty_groups"],
    display_properties: true,
  },
  kanban: {
    filters: [
      "priority",
      "state",
      "assignees",
      "mentions",
      "created_by",
      "labels",
      "start_date",
      "target_date",
      "module",
      "cycle",
    ],
    display_filters: ["group_by", "sub_group_by", "order_by", "type"],
    extra_options: ["sub_issue", "show_empty_groups"],
    display_properties: true,
  },
};

export const VIEW_DEFAULT_FILTER_PARAMETERS: TFilterPermissions = {
  all: ALL_FILTER_PERMISSIONS,
  profile: PROFILE_FILTER_PERMISSIONS,
  project: PROJECT_FILTER_PERMISSIONS,
  archived: ARCHIVED_FILTER_PERMISSIONS,
  draft: DRAFT_FILTER_PERMISSIONS,
};
