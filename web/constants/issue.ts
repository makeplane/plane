// icons
import { Calendar, GanttChartSquare, Kanban, List, Sheet } from "lucide-react";
// types
import {
  IIssueFilterOptions,
  IIssueDisplayProperties,
  TIssueExtraOptions,
  TIssueGroupByOptions,
  TIssueLayouts,
  TIssueOrderByOptions,
  TIssuePriorities,
  TIssueTypeFilters,
} from "@plane/types";

export enum EIssuesStoreType {
  GLOBAL = "GLOBAL",
  PROFILE = "PROFILE",
  PROJECT = "PROJECT",
  CYCLE = "CYCLE",
  MODULE = "MODULE",
  PROJECT_VIEW = "PROJECT_VIEW",
  ARCHIVED = "ARCHIVED",
  DRAFT = "DRAFT",
  DEFAULT = "DEFAULT",
}

export type TCreateModalStoreTypes =
  | EIssuesStoreType.PROJECT
  | EIssuesStoreType.PROJECT_VIEW
  | EIssuesStoreType.PROFILE
  | EIssuesStoreType.CYCLE
  | EIssuesStoreType.MODULE;

export enum EIssueFilterType {
  FILTERS = "filters",
  DISPLAY_FILTERS = "display_filters",
  DISPLAY_PROPERTIES = "display_properties",
  KANBAN_FILTERS = "kanban_filters",
}

export const ISSUE_PRIORITIES: {
  key: TIssuePriorities;
  title: string;
}[] = [
  { key: "urgent", title: "Urgent" },
  { key: "high", title: "High" },
  { key: "medium", title: "Medium" },
  { key: "low", title: "Low" },
  { key: "none", title: "None" },
];

export const ISSUE_START_DATE_OPTIONS = [
  { key: "last_week", title: "Last Week" },
  { key: "2_weeks_from_now", title: "2 weeks from now" },
  { key: "1_month_from_now", title: "1 month from now" },
  { key: "2_months_from_now", title: "2 months from now" },
  { key: "custom", title: "Custom" },
];

export const ISSUE_DUE_DATE_OPTIONS = [
  { key: "last_week", title: "Last Week" },
  { key: "2_weeks_from_now", title: "2 weeks from now" },
  { key: "1_month_from_now", title: "1 month from now" },
  { key: "2_months_from_now", title: "2 months from now" },
  { key: "custom", title: "Custom" },
];

export const ISSUE_GROUP_BY_OPTIONS: {
  key: TIssueGroupByOptions;
  title: string;
}[] = [
  { key: "state", title: "States" },
  { key: "state_detail.group", title: "State Groups" },
  { key: "priority", title: "Priority" },
  { key: "project", title: "Project" }, // required this on my issues
  { key: "labels", title: "Labels" },
  { key: "assignees", title: "Assignees" },
  { key: "created_by", title: "Created By" },
  { key: null, title: "None" },
];

export const ISSUE_ORDER_BY_OPTIONS: {
  key: TIssueOrderByOptions;
  title: string;
}[] = [
  { key: "sort_order", title: "Manual" },
  { key: "-created_at", title: "Last Created" },
  { key: "-updated_at", title: "Last Updated" },
  { key: "start_date", title: "Start Date" },
  { key: "target_date", title: "Due Date" },
  { key: "priority", title: "Priority" },
];

export const ISSUE_FILTER_OPTIONS: {
  key: TIssueTypeFilters;
  title: string;
}[] = [
  { key: null, title: "All" },
  { key: "active", title: "Active Issues" },
  { key: "backlog", title: "Backlog Issues" },
  // { key: "draft", title: "Draft Issues" },
];

export const ISSUE_DISPLAY_PROPERTIES: {
  key: keyof IIssueDisplayProperties;
  title: string;
}[] = [
  { key: "assignee", title: "Assignee" },
  { key: "start_date", title: "Start Date" },
  { key: "due_date", title: "Due Date" },
  { key: "key", title: "ID" },
  { key: "labels", title: "Labels" },
  { key: "priority", title: "Priority" },
  { key: "state", title: "State" },
  { key: "sub_issue_count", title: "Sub Issue Count" },
  { key: "attachment_count", title: "Attachment Count" },
  { key: "link", title: "Link" },
  { key: "estimate", title: "Estimate" },
];

export const ISSUE_EXTRA_OPTIONS: {
  key: TIssueExtraOptions;
  title: string;
}[] = [
  { key: "sub_issue", title: "Show sub-issues" }, // in spreadsheet its always false
  { key: "show_empty_groups", title: "Show empty groups" }, // filter on front-end
];

export const ISSUE_LAYOUTS: {
  key: TIssueLayouts;
  title: string;
  icon: any;
}[] = [
  { key: "list", title: "List Layout", icon: List },
  { key: "kanban", title: "Kanban Layout", icon: Kanban },
  { key: "calendar", title: "Calendar Layout", icon: Calendar },
  { key: "spreadsheet", title: "Spreadsheet Layout", icon: Sheet },
  { key: "gantt_chart", title: "Gantt Chart Layout", icon: GanttChartSquare },
];

export const ISSUE_LIST_FILTERS = [
  { key: "mentions", title: "Mentions" },
  { key: "priority", title: "Priority" },
  { key: "state", title: "State" },
  { key: "assignees", title: "Assignees" },
  { key: "created_by", title: "Created By" },
  { key: "labels", title: "Labels" },
  { key: "start_date", title: "Start Date" },
  { key: "due_date", title: "Due Date" },
];

export const ISSUE_KANBAN_FILTERS = [
  { key: "priority", title: "Priority" },
  { key: "state", title: "State" },
  { key: "assignees", title: "Assignees" },
  { key: "created_by", title: "Created By" },
  { key: "labels", title: "Labels" },
  { key: "start_date", title: "Start Date" },
  { key: "due_date", title: "Due Date" },
];

export const ISSUE_CALENDER_FILTERS = [
  { key: "priority", title: "Priority" },
  { key: "state", title: "State" },
  { key: "assignees", title: "Assignees" },
  { key: "created_by", title: "Created By" },
  { key: "labels", title: "Labels" },
];

export const ISSUE_SPREADSHEET_FILTERS = [
  { key: "priority", title: "Priority" },
  { key: "state", title: "State" },
  { key: "assignees", title: "Assignees" },
  { key: "created_by", title: "Created By" },
  { key: "labels", title: "Labels" },
  { key: "start_date", title: "Start Date" },
  { key: "due_date", title: "Due Date" },
];

export const ISSUE_GANTT_FILTERS = [
  { key: "priority", title: "Priority" },
  { key: "state", title: "State" },
  { key: "assignees", title: "Assignees" },
  { key: "created_by", title: "Created By" },
  { key: "labels", title: "Labels" },
  { key: "start_date", title: "Start Date" },
  { key: "due_date", title: "Due Date" },
];

export const ISSUE_LIST_DISPLAY_FILTERS = [
  { key: "group_by", title: "Group By" },
  { key: "order_by", title: "Order By" },
  { key: "issue_type", title: "Issue Type" },
  { key: "sub_issue", title: "Sub Issue" },
  { key: "show_empty_groups", title: "Show Empty Groups" },
];

export const ISSUE_KANBAN_DISPLAY_FILTERS = [
  { key: "group_by", title: "Group By" },
  { key: "order_by", title: "Order By" },
  { key: "issue_type", title: "Issue Type" },
  { key: "sub_issue", title: "Sub Issue" },
  { key: "show_empty_groups", title: "Show Empty Groups" },
];

export const ISSUE_CALENDER_DISPLAY_FILTERS = [{ key: "issue_type", title: "Issue Type" }];

export const ISSUE_SPREADSHEET_DISPLAY_FILTERS = [{ key: "issue_type", title: "Issue Type" }];

export const ISSUE_GANTT_DISPLAY_FILTERS = [
  { key: "order_by", title: "Order By" },
  { key: "issue_type", title: "Issue Type" },
  { key: "sub_issue", title: "Sub Issue" },
];

export interface ILayoutDisplayFiltersOptions {
  filters: (keyof IIssueFilterOptions)[];
  display_properties: boolean;
  display_filters: {
    group_by?: TIssueGroupByOptions[];
    sub_group_by?: TIssueGroupByOptions[];
    order_by?: TIssueOrderByOptions[];
    type?: TIssueTypeFilters[];
  };
  extra_options: {
    access: boolean;
    values: TIssueExtraOptions[];
  };
}

export const ISSUE_DISPLAY_FILTERS_BY_LAYOUT: {
  [pageType: string]: { [layoutType: string]: ILayoutDisplayFiltersOptions };
} = {
  profile_issues: {
    list: {
      filters: ["priority", "state_group", "labels", "start_date", "target_date"],
      display_properties: true,
      display_filters: {
        group_by: ["state_detail.group", "priority", "project", "labels", null],
        order_by: ["sort_order", "-created_at", "-updated_at", "start_date", "priority"],
        type: [null, "active", "backlog"],
      },
      extra_options: {
        access: true,
        values: ["show_empty_groups"],
      },
    },
    kanban: {
      filters: ["priority", "state_group", "labels", "start_date", "target_date"],
      display_properties: true,
      display_filters: {
        group_by: ["state_detail.group", "priority", "project", "labels"],
        order_by: ["sort_order", "-created_at", "-updated_at", "start_date", "priority"],
        type: [null, "active", "backlog"],
      },
      extra_options: {
        access: true,
        values: ["show_empty_groups"],
      },
    },
  },
  archived_issues: {
    list: {
      filters: ["priority", "state", "assignees", "created_by", "labels", "start_date", "target_date"],
      display_properties: true,
      display_filters: {
        group_by: ["state", "state_detail.group", "priority", "labels", "assignees", "created_by", null],
        order_by: ["sort_order", "-created_at", "-updated_at", "start_date", "priority"],
        type: [null, "active", "backlog"],
      },
      extra_options: {
        access: true,
        values: ["show_empty_groups"],
      },
    },
  },
  draft_issues: {
    list: {
      filters: ["priority", "state_group", "labels", "start_date", "target_date"],
      display_properties: true,
      display_filters: {
        group_by: ["state_detail.group", "priority", "project", "labels", null],
        order_by: ["sort_order", "-created_at", "-updated_at", "start_date", "priority"],
        type: [null, "active", "backlog"],
      },
      extra_options: {
        access: true,
        values: ["show_empty_groups"],
      },
    },
    kanban: {
      filters: ["priority", "state_group", "labels", "start_date", "target_date"],
      display_properties: true,
      display_filters: {
        group_by: ["state_detail.group", "priority", "project", "labels"],
        order_by: ["sort_order", "-created_at", "-updated_at", "start_date", "priority"],
        type: [null, "active", "backlog"],
      },
      extra_options: {
        access: true,
        values: ["show_empty_groups"],
      },
    },
  },
  my_issues: {
    spreadsheet: {
      filters: [
        "priority",
        "state_group",
        "labels",
        "assignees",
        "created_by",
        "subscriber",
        "project",
        "start_date",
        "target_date",
      ],
      display_properties: true,
      display_filters: {
        type: [null, "active", "backlog"],
      },
      extra_options: {
        access: false,
        values: [],
      },
    },
    list: {
      filters: [
        "priority",
        "state_group",
        "labels",
        "assignees",
        "created_by",
        "subscriber",
        "project",
        "start_date",
        "target_date",
      ],
      display_properties: true,
      display_filters: {
        type: [null, "active", "backlog"],
      },
      extra_options: {
        access: false,
        values: [],
      },
    },
  },
  issues: {
    list: {
      filters: ["priority", "state", "assignees", "mentions", "created_by", "labels", "start_date", "target_date"],
      display_properties: true,
      display_filters: {
        group_by: ["state", "priority", "labels", "assignees", "created_by", null],
        order_by: ["sort_order", "-created_at", "-updated_at", "start_date", "priority"],
        type: [null, "active", "backlog"],
      },
      extra_options: {
        access: true,
        values: ["show_empty_groups", "sub_issue"],
      },
    },
    kanban: {
      filters: ["priority", "state", "assignees", "mentions", "created_by", "labels", "start_date", "target_date"],
      display_properties: true,
      display_filters: {
        group_by: ["state", "priority", "labels", "assignees", "created_by"],
        sub_group_by: ["state", "priority", "labels", "assignees", "created_by", null],
        order_by: ["sort_order", "-created_at", "-updated_at", "start_date", "priority", "target_date"],
        type: [null, "active", "backlog"],
      },
      extra_options: {
        access: true,
        values: ["show_empty_groups", "sub_issue"],
      },
    },
    calendar: {
      filters: ["priority", "state", "assignees", "mentions", "created_by", "labels", "start_date"],
      display_properties: true,
      display_filters: {
        type: [null, "active", "backlog"],
      },
      extra_options: {
        access: true,
        values: ["sub_issue"],
      },
    },
    spreadsheet: {
      filters: ["priority", "state", "assignees", "mentions", "created_by", "labels", "start_date", "target_date"],
      display_properties: true,
      display_filters: {
        order_by: ["sort_order", "-created_at", "-updated_at", "start_date", "priority"],
        type: [null, "active", "backlog"],
      },
      extra_options: {
        access: false,
        values: [],
      },
    },
    gantt_chart: {
      filters: ["priority", "state", "assignees", "mentions", "created_by", "labels", "start_date", "target_date"],
      display_properties: false,
      display_filters: {
        order_by: ["sort_order", "-created_at", "-updated_at", "start_date", "priority"],
        type: [null, "active", "backlog"],
      },
      extra_options: {
        access: true,
        values: ["sub_issue"],
      },
    },
  },
};

export const getValueFromObject = (object: Object, key: string): string | number | boolean | null => {
  const keys = key ? key.split(".") : [];

  let value: any = object;
  if (!value || keys.length === 0) return null;

  for (const _key of keys) value = value?.[_key];
  return value;
};

// issue reactions
export const issueReactionEmojis = ["128077", "128078", "128516", "128165", "128533", "129505", "9992", "128064"];

export const groupReactionEmojis = (reactions: any) => {
  let _groupedEmojis: any = {};

  issueReactionEmojis.map((_r) => {
    _groupedEmojis = { ..._groupedEmojis, [_r]: [] };
  });

  if (reactions && reactions.length > 0) {
    reactions.map((_reaction: any) => {
      _groupedEmojis = {
        ..._groupedEmojis,
        [_reaction.reaction]: [..._groupedEmojis[_reaction.reaction], _reaction],
      };
    });
  }

  return _groupedEmojis;
};
