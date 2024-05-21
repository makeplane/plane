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

export const DRAG_ALLOWED_GROUPS: TIssueGroupByOptions[] = [
  "state",
  "priority",
  "assignees",
  "labels",
  "module",
  "cycle",
];

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

export enum EIssueCommentAccessSpecifier {
  EXTERNAL = "EXTERNAL",
  INTERNAL = "INTERNAL",
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

export const ISSUE_GROUP_BY_OPTIONS: {
  key: TIssueGroupByOptions;
  title: string;
}[] = [
  { key: "state", title: "States" },
  { key: "state_detail.group", title: "State Groups" },
  { key: "priority", title: "Priority" },
  { key: "project", title: "Project" }, // required this on my issues
  { key: "cycle", title: "Cycle" }, // required this on my issues
  { key: "module", title: "Module" }, // required this on my issues
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
  { key: "-priority", title: "Priority" },
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
  { key: "start_date", title: "Start date" },
  { key: "due_date", title: "Due date" },
  { key: "key", title: "ID" },
  { key: "labels", title: "Labels" },
  { key: "priority", title: "Priority" },
  { key: "state", title: "State" },
  { key: "sub_issue_count", title: "Sub issue count" },
  { key: "attachment_count", title: "Attachment count" },
  { key: "link", title: "Link" },
  { key: "estimate", title: "Estimate" },
  { key: "modules", title: "Modules" },
  { key: "cycle", title: "Cycle" },
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
        order_by: ["sort_order", "-created_at", "-updated_at", "start_date", "-priority"],
        type: [null, "active", "backlog"],
      },
      extra_options: {
        access: true,
        values: ["show_empty_groups", "sub_issue"],
      },
    },
    kanban: {
      filters: ["priority", "state_group", "labels", "start_date", "target_date"],
      display_properties: true,
      display_filters: {
        group_by: ["state_detail.group", "priority", "project", "labels"],
        order_by: ["sort_order", "-created_at", "-updated_at", "start_date", "-priority"],
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
      filters: [
        "priority",
        "state",
        "cycle",
        "module",
        "assignees",
        "created_by",
        "labels",
        "start_date",
        "target_date",
      ],
      display_properties: true,
      display_filters: {
        group_by: [
          "state",
          "cycle",
          "module",
          "state_detail.group",
          "priority",
          "labels",
          "assignees",
          "created_by",
          null,
        ],
        order_by: ["sort_order", "-created_at", "-updated_at", "start_date", "-priority"],
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
      filters: ["priority", "state_group", "cycle", "module", "labels", "start_date", "target_date"],
      display_properties: true,
      display_filters: {
        group_by: ["state_detail.group", "cycle", "module", "priority", "project", "labels", null],
        order_by: ["sort_order", "-created_at", "-updated_at", "start_date", "-priority"],
        type: [null, "active", "backlog"],
      },
      extra_options: {
        access: true,
        values: ["show_empty_groups"],
      },
    },
    kanban: {
      filters: ["priority", "state_group", "cycle", "module", "labels", "start_date", "target_date"],
      display_properties: true,
      display_filters: {
        group_by: ["state_detail.group", "cycle", "module", "priority", "project", "labels"],
        order_by: ["sort_order", "-created_at", "-updated_at", "start_date", "-priority"],
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
        access: true,
        values: ["sub_issue"],
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
      filters: [
        "priority",
        "state",
        "cycle",
        "module",
        "assignees",
        "mentions",
        "created_by",
        "labels",
        "start_date",
        "target_date",
      ],
      display_properties: true,
      display_filters: {
        group_by: ["state", "priority", "cycle", "module", "labels", "assignees", "created_by", null],
        order_by: ["sort_order", "-created_at", "-updated_at", "start_date", "-priority"],
        type: [null, "active", "backlog"],
      },
      extra_options: {
        access: true,
        values: ["show_empty_groups", "sub_issue"],
      },
    },
    kanban: {
      filters: [
        "priority",
        "state",
        "cycle",
        "module",
        "assignees",
        "mentions",
        "created_by",
        "labels",
        "start_date",
        "target_date",
      ],
      display_properties: true,
      display_filters: {
        group_by: ["state", "priority", "cycle", "module", "labels", "assignees", "created_by"],
        sub_group_by: ["state", "priority", "cycle", "module", "labels", "assignees", "created_by", null],
        order_by: ["sort_order", "-created_at", "-updated_at", "start_date", "-priority", "target_date"],
        type: [null, "active", "backlog"],
      },
      extra_options: {
        access: true,
        values: ["show_empty_groups", "sub_issue"],
      },
    },
    calendar: {
      filters: ["priority", "state", "cycle", "module", "assignees", "mentions", "created_by", "labels", "start_date"],
      display_properties: false,
      display_filters: {
        type: [null, "active", "backlog"],
      },
      extra_options: {
        access: true,
        values: ["sub_issue"],
      },
    },
    spreadsheet: {
      filters: [
        "priority",
        "state",
        "cycle",
        "module",
        "assignees",
        "mentions",
        "created_by",
        "labels",
        "start_date",
        "target_date",
      ],
      display_properties: true,
      display_filters: {
        order_by: ["sort_order", "-created_at", "-updated_at", "start_date", "-priority"],
        type: [null, "active", "backlog"],
      },
      extra_options: {
        access: true,
        values: ["sub_issue"],
      },
    },
    gantt_chart: {
      filters: [
        "priority",
        "state",
        "cycle",
        "module",
        "assignees",
        "mentions",
        "created_by",
        "labels",
        "start_date",
        "target_date",
      ],
      display_properties: false,
      display_filters: {
        order_by: ["sort_order", "-created_at", "-updated_at", "start_date", "-priority"],
        type: [null, "active", "backlog"],
      },
      extra_options: {
        access: true,
        values: ["sub_issue"],
      },
    },
  },
};

export enum EIssueListRow {
  HEADER = "HEADER",
  ISSUE = "ISSUE",
  NO_ISSUES = "NO_ISSUES",
  QUICK_ADD = "QUICK_ADD",
}

// issue reactions
export const issueReactionEmojis = ["128077", "128078", "128516", "128165", "128533", "129505", "9992", "128064"];

export const groupReactionEmojis = (reactions: any) => {
  let groupedEmojis: any = {};

  issueReactionEmojis.map((_r) => {
    groupedEmojis = { ...groupedEmojis, [_r]: [] };
  });

  if (reactions && reactions.length > 0) {
    reactions.map((_reaction: any) => {
      groupedEmojis = {
        ...groupedEmojis,
        [_reaction.reaction]: [...groupedEmojis[_reaction.reaction], _reaction],
      };
    });
  }

  return groupedEmojis;
};

