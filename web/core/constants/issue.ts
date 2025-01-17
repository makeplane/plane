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
  titleTranslationKey: string;
}[] = [
  { key: "urgent", title: "Urgent", titleTranslationKey: "urgent" },
  { key: "high", title: "High", titleTranslationKey: "high" },
  { key: "medium", title: "Medium", titleTranslationKey: "medium" },
  { key: "low", title: "Low", titleTranslationKey: "low" },
  { key: "none", title: "None", titleTranslationKey: "none" },
];

export const ISSUE_GROUP_BY_OPTIONS: {
  key: TIssueGroupByOptions;
  title: string;
  titleTranslationKey: string;
}[] = [
  { key: "state", title: "States", titleTranslationKey: "states" },
  { key: "state_detail.group", title: "State Groups", titleTranslationKey: "state_groups" },
  { key: "priority", title: "Priority", titleTranslationKey: "priority" },
  { key: "team_project", title: "Team Project", titleTranslationKey: "team_project" }, // required this on team issues
  { key: "project", title: "Project", titleTranslationKey: "project" }, // required this on my issues
  { key: "cycle", title: "Cycle", titleTranslationKey: "cycle" }, // required this on my issues
  { key: "module", title: "Module", titleTranslationKey: "module" }, // required this on my issues
  { key: "labels", title: "Labels", titleTranslationKey: "labels" },
  { key: "assignees", title: "Assignees", titleTranslationKey: "assignees" },
  { key: "created_by", title: "Created By", titleTranslationKey: "created_by" },
  { key: null, title: "None", titleTranslationKey: "none" },
];

export const ISSUE_ORDER_BY_OPTIONS: {
  key: TIssueOrderByOptions;
  title: string;
  titleTranslationKey: string;
}[] = [
  { key: "sort_order", title: "Manual", titleTranslationKey: "manual" },
  { key: "-created_at", title: "Last Created", titleTranslationKey: "last_created" },
  { key: "-updated_at", title: "Last Updated", titleTranslationKey: "last_updated" },
  { key: "start_date", title: "Start Date", titleTranslationKey: "start_date" },
  { key: "target_date", title: "Due Date", titleTranslationKey: "due_date" },
  { key: "-priority", title: "Priority", titleTranslationKey: "priority" },
];

export const ISSUE_FILTER_OPTIONS: {
  key: TIssueGroupingFilters;
  title: string;
  titleTranslationKey: string;
}[] = [
  { key: null, title: "All", titleTranslationKey: "all" },
  { key: "active", title: "Active", titleTranslationKey: "active" },
  { key: "backlog", title: "Backlog", titleTranslationKey: "backlog" },
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
  titleTranslationKey: string;
}[] = [
  { key: "key", title: "ID", titleTranslationKey: "id" },
  { key: "issue_type", title: "Issue Type", titleTranslationKey: "issue_type" },
  { key: "assignee", title: "Assignee", titleTranslationKey: "assignee" },
  { key: "start_date", title: "Start date", titleTranslationKey: "start_date" },
  { key: "due_date", title: "Due date", titleTranslationKey: "due_date" },
  { key: "labels", title: "Labels", titleTranslationKey: "labels" },
  { key: "priority", title: "Priority", titleTranslationKey: "priority" },
  { key: "state", title: "State", titleTranslationKey: "state" },
  { key: "sub_issue_count", title: "Sub issue count", titleTranslationKey: "sub_issue_count" },
  { key: "attachment_count", title: "Attachment count", titleTranslationKey: "attachment_count" },
  { key: "link", title: "Link", titleTranslationKey: "link" },
  { key: "estimate", title: "Estimate", titleTranslationKey: "estimate" },
  { key: "modules", title: "Modules", titleTranslationKey: "modules" },
  { key: "cycle", title: "Cycle", titleTranslationKey: "cycle" },
];

export const ISSUE_EXTRA_OPTIONS: {
  key: TIssueExtraOptions;
  title: string;
  titleTranslationKey: string;
}[] = [
  { key: "sub_issue", title: "Show sub-issues", titleTranslationKey: "show_sub_issues" }, // in spreadsheet its always false
  { key: "show_empty_groups", title: "Show empty groups", titleTranslationKey: "show_empty_groups" }, // filter on front-end
];

export const ISSUE_LAYOUT_MAP = {
  [EIssueLayoutTypes.LIST]: {
    key: EIssueLayoutTypes.LIST,
    title: "List layout",
    titleTranslationKey: "list_layout",
    label: "List",
    labelTranslationKey: "list",
    icon: List,
  },
  [EIssueLayoutTypes.KANBAN]: {
    key: EIssueLayoutTypes.KANBAN,
    title: "Board layout",
    titleTranslationKey: "board_layout",
    label: "Board",
    labelTranslationKey: "board",
    icon: Kanban,
  },
  [EIssueLayoutTypes.CALENDAR]: {
    key: EIssueLayoutTypes.CALENDAR,
    title: "Calendar layout",
    titleTranslationKey: "calendar_layout",
    label: "Calendar",
    labelTranslationKey: "calendar",
    icon: Calendar,
  },
  [EIssueLayoutTypes.SPREADSHEET]: {
    key: EIssueLayoutTypes.SPREADSHEET,
    title: "Table layout",
    titleTranslationKey: "table_layout",
    label: "Table",
    labelTranslationKey: "table",
    icon: Sheet,
  },
  [EIssueLayoutTypes.GANTT]: {
    key: EIssueLayoutTypes.GANTT,
    title: "Timeline layout",
    titleTranslationKey: "timeline_layout",
    label: "Timeline",
    labelTranslationKey: "timeline",
    icon: GanttChartSquare,
  },
};

export const ISSUE_LAYOUTS: {
  key: EIssueLayoutTypes;
  title: string;
  titleTranslationKey: string;
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
