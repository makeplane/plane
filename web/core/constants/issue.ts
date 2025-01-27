// icons
import { Calendar, GanttChartSquare, Kanban, List, Sheet } from "lucide-react";
// plane constants
import { EIssueLayoutTypes, EIssuesStoreType } from "@plane/constants";
// types
import {
  IIssueDisplayProperties,
  TIssueExtraOptions,
  TIssueGroupByOptions,
  TIssueOrderByOptions,
  TIssuePriorities,
  TIssueGroupingFilters,
  ILayoutDisplayFiltersOptions,
} from "@plane/types";
import { ADDITIONAL_ISSUE_DISPLAY_FILTERS_BY_LAYOUT } from "@/plane-web/constants";

export const DRAG_ALLOWED_GROUPS: TIssueGroupByOptions[] = [
  "state",
  "priority",
  "assignees",
  "labels",
  "module",
  "cycle",
];

export type TCreateModalStoreTypes =
  | EIssuesStoreType.TEAM
  | EIssuesStoreType.PROJECT
  | EIssuesStoreType.TEAM_VIEW
  | EIssuesStoreType.PROJECT_VIEW
  | EIssuesStoreType.PROFILE
  | EIssuesStoreType.CYCLE
  | EIssuesStoreType.MODULE
  | EIssuesStoreType.EPIC;

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
  { key: "team_project", title: "Team Project" }, // required this on team issues
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
  key: TIssueGroupingFilters;
  title: string;
}[] = [
  { key: null, title: "All" },
  { key: "active", title: "Active" },
  { key: "backlog", title: "Backlog" },
  // { key: "draft", title: "Draft Issues" },
];

export const ISSUE_DISPLAY_PROPERTIES_KEYS: (keyof IIssueDisplayProperties)[] = [
  "assignee",
  "start_date",
  "due_date",
  "labels",
  "key",
  "priority",
  "state",
  "sub_issue_count",
  "link",
  "attachment_count",
  "estimate",
  "created_on",
  "updated_on",
  "modules",
  "cycle",
  "issue_type",
];

export const EPICS_DISPLAY_PROPERTIES_KEYS: (keyof IIssueDisplayProperties)[] = ISSUE_DISPLAY_PROPERTIES_KEYS.filter(
  (key) => !["cycle", "modules"].includes(key)
);

export const ISSUE_DISPLAY_PROPERTIES: {
  key: keyof IIssueDisplayProperties;
  title: string;
}[] = [
  { key: "key", title: "ID" },
  { key: "issue_type", title: "Issue Type" },
  { key: "assignee", title: "Assignee" },
  { key: "start_date", title: "Start date" },
  { key: "due_date", title: "Due date" },
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

export const ISSUE_LAYOUT_MAP = {
  [EIssueLayoutTypes.LIST]: { key: EIssueLayoutTypes.LIST, title: "List layout", label: "List", icon: List },
  [EIssueLayoutTypes.KANBAN]: { key: EIssueLayoutTypes.KANBAN, title: "Board layout", label: "Board", icon: Kanban },
  [EIssueLayoutTypes.CALENDAR]: {
    key: EIssueLayoutTypes.CALENDAR,
    title: "Calendar layout",
    label: "Calendar",
    icon: Calendar,
  },
  [EIssueLayoutTypes.SPREADSHEET]: {
    key: EIssueLayoutTypes.SPREADSHEET,
    title: "Table layout",
    label: "Table",
    icon: Sheet,
  },
  [EIssueLayoutTypes.GANTT]: {
    key: EIssueLayoutTypes.GANTT,
    title: "Timeline layout",
    label: "Timeline",
    icon: GanttChartSquare,
  },
};

export const ISSUE_LAYOUTS: {
  key: EIssueLayoutTypes;
  title: string;
  icon: any;
}[] = Object.values(ISSUE_LAYOUT_MAP);

export type TFiltersByLayout = {
  [layoutType: string]: ILayoutDisplayFiltersOptions;
};

export type TIssueFiltersToDisplayByPageType = {
  [pageType: string]: TFiltersByLayout;
};

export const ISSUE_DISPLAY_FILTERS_BY_LAYOUT: TIssueFiltersToDisplayByPageType = {
  profile_issues: {
    list: {
      filters: ["priority", "state_group", "labels", "start_date", "target_date"],
      display_properties: ISSUE_DISPLAY_PROPERTIES_KEYS,
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
      display_properties: ISSUE_DISPLAY_PROPERTIES_KEYS,
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
        "issue_type",
      ],
      display_properties: ISSUE_DISPLAY_PROPERTIES_KEYS,
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
      filters: ["priority", "state_group", "cycle", "module", "labels", "start_date", "target_date", "issue_type"],
      display_properties: ISSUE_DISPLAY_PROPERTIES_KEYS,
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
      filters: ["priority", "state_group", "cycle", "module", "labels", "start_date", "target_date", "issue_type"],
      display_properties: ISSUE_DISPLAY_PROPERTIES_KEYS,
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
      display_properties: ISSUE_DISPLAY_PROPERTIES_KEYS,
      display_filters: {
        order_by: [],
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
      display_properties: ISSUE_DISPLAY_PROPERTIES_KEYS,
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
        "issue_type",
      ],
      display_properties: ISSUE_DISPLAY_PROPERTIES_KEYS,
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
        "issue_type",
      ],
      display_properties: ISSUE_DISPLAY_PROPERTIES_KEYS,
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
        "issue_type",
      ],
      display_properties: ["key", "issue_type"],
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
        "issue_type",
      ],
      display_properties: ISSUE_DISPLAY_PROPERTIES_KEYS,
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
        "issue_type",
      ],
      display_properties: ["key", "issue_type"],
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
  epics: {
    list: {
      filters: ["priority", "state", "assignees", "mentions", "created_by", "labels", "start_date", "target_date"],
      display_properties: EPICS_DISPLAY_PROPERTIES_KEYS,
      display_filters: {
        group_by: ["state", "priority", "labels", "assignees", "created_by", null],
        order_by: ["sort_order", "-created_at", "-updated_at", "start_date", "-priority"],
        type: [null, "active", "backlog"],
      },
      extra_options: {
        access: true,
        values: ["show_empty_groups", "sub_issue"],
      },
    },
    kanban: {
      filters: ["priority", "state", "assignees", "mentions", "created_by", "labels", "start_date", "target_date"],
      display_properties: EPICS_DISPLAY_PROPERTIES_KEYS,
      display_filters: {
        group_by: ["state", "priority", "labels", "assignees", "created_by"],
        sub_group_by: ["state", "priority", "labels", "assignees", "created_by", null],
        order_by: ["sort_order", "-created_at", "-updated_at", "start_date", "-priority", "target_date"],
        type: [null, "active", "backlog"],
      },
      extra_options: {
        access: true,
        values: ["show_empty_groups", "sub_issue"],
      },
    },
    calendar: {
      filters: ["priority", "state", "assignees", "mentions", "created_by", "labels", "start_date"],
      display_properties: ["key", "issue_type"],
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
      display_properties: EPICS_DISPLAY_PROPERTIES_KEYS,
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
      filters: ["priority", "state", "assignees", "mentions", "created_by", "labels", "start_date", "target_date"],
      display_properties: ["key", "issue_type"],
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
  ...ADDITIONAL_ISSUE_DISPLAY_FILTERS_BY_LAYOUT,
};

export const ISSUE_STORE_TO_FILTERS_MAP: Partial<Record<EIssuesStoreType, TFiltersByLayout>> = {
  [EIssuesStoreType.PROJECT]: ISSUE_DISPLAY_FILTERS_BY_LAYOUT.issues,
  [EIssuesStoreType.EPIC]: ISSUE_DISPLAY_FILTERS_BY_LAYOUT.epics,
};

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
