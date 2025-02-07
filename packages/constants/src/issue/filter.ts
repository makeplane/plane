import {
  ILayoutDisplayFiltersOptions,
  TIssueActivityComment,
} from "@plane/types";
import {
  TIssueFilterPriorityObject,
  ISSUE_DISPLAY_PROPERTIES_KEYS,
  EIssuesStoreType,
} from "./common";

import { TIssueLayout } from "./layout";

export type TIssueFilterKeys = "priority" | "state" | "labels";

export enum EServerGroupByToFilterOptions {
  "state_id" = "state",
  "priority" = "priority",
  "labels__id" = "labels",
  "state__group" = "state_group",
  "assignees__id" = "assignees",
  "cycle_id" = "cycle",
  "issue_module__module_id" = "module",
  "target_date" = "target_date",
  "project_id" = "project",
  "created_by" = "created_by",
}

export enum EIssueFilterType {
  FILTERS = "filters",
  DISPLAY_FILTERS = "display_filters",
  DISPLAY_PROPERTIES = "display_properties",
  KANBAN_FILTERS = "kanban_filters",
}

export const ISSUE_DISPLAY_FILTERS_BY_LAYOUT: {
  [key in TIssueLayout]: Record<"filters", TIssueFilterKeys[]>;
} = {
  list: {
    filters: ["priority", "state", "labels"],
  },
  kanban: {
    filters: ["priority", "state", "labels"],
  },
  calendar: {
    filters: ["priority", "state", "labels"],
  },
  spreadsheet: {
    filters: ["priority", "state", "labels"],
  },
  gantt: {
    filters: ["priority", "state", "labels"],
  },
};

export const ISSUE_PRIORITY_FILTERS: TIssueFilterPriorityObject[] = [
  {
    key: "urgent",
    titleTranslationKey: "issue.priority.urgent",
    className: "bg-red-500 border-red-500 text-white",
    icon: "error",
  },
  {
    key: "high",
    titleTranslationKey: "issue.priority.high",
    className: "text-orange-500 border-custom-border-300",
    icon: "signal_cellular_alt",
  },
  {
    key: "medium",
    titleTranslationKey: "issue.priority.medium",
    className: "text-yellow-500 border-custom-border-300",
    icon: "signal_cellular_alt_2_bar",
  },
  {
    key: "low",
    titleTranslationKey: "issue.priority.low",
    className: "text-green-500 border-custom-border-300",
    icon: "signal_cellular_alt_1_bar",
  },
  {
    key: "none",
    titleTranslationKey: "common.none",
    className: "text-gray-500 border-custom-border-300",
    icon: "block",
  },
];

export type TFiltersByLayout = {
  [layoutType: string]: ILayoutDisplayFiltersOptions;
};

export type TIssueFiltersToDisplayByPageType = {
  [pageType: string]: TFiltersByLayout;
};

export const ISSUE_DISPLAY_FILTERS_BY_PAGE: TIssueFiltersToDisplayByPageType = {
  profile_issues: {
    list: {
      filters: [
        "priority",
        "state_group",
        "labels",
        "start_date",
        "target_date",
      ],
      display_properties: ISSUE_DISPLAY_PROPERTIES_KEYS,
      display_filters: {
        group_by: ["state_detail.group", "priority", "project", "labels", null],
        order_by: [
          "sort_order",
          "-created_at",
          "-updated_at",
          "start_date",
          "-priority",
        ],
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
        "state_group",
        "labels",
        "start_date",
        "target_date",
      ],
      display_properties: ISSUE_DISPLAY_PROPERTIES_KEYS,
      display_filters: {
        group_by: ["state_detail.group", "priority", "project", "labels"],
        order_by: [
          "sort_order",
          "-created_at",
          "-updated_at",
          "start_date",
          "-priority",
        ],
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
        order_by: [
          "sort_order",
          "-created_at",
          "-updated_at",
          "start_date",
          "-priority",
        ],
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
      filters: [
        "priority",
        "state_group",
        "cycle",
        "module",
        "labels",
        "start_date",
        "target_date",
        "issue_type",
      ],
      display_properties: ISSUE_DISPLAY_PROPERTIES_KEYS,
      display_filters: {
        group_by: [
          "state_detail.group",
          "cycle",
          "module",
          "priority",
          "project",
          "labels",
          null,
        ],
        order_by: [
          "sort_order",
          "-created_at",
          "-updated_at",
          "start_date",
          "-priority",
        ],
        type: [null, "active", "backlog"],
      },
      extra_options: {
        access: true,
        values: ["show_empty_groups"],
      },
    },
    kanban: {
      filters: [
        "priority",
        "state_group",
        "cycle",
        "module",
        "labels",
        "start_date",
        "target_date",
        "issue_type",
      ],
      display_properties: ISSUE_DISPLAY_PROPERTIES_KEYS,
      display_filters: {
        group_by: [
          "state_detail.group",
          "cycle",
          "module",
          "priority",
          "project",
          "labels",
        ],
        order_by: [
          "sort_order",
          "-created_at",
          "-updated_at",
          "start_date",
          "-priority",
        ],
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
        group_by: [
          "state",
          "priority",
          "cycle",
          "module",
          "labels",
          "assignees",
          "created_by",
          null,
        ],
        order_by: [
          "sort_order",
          "-created_at",
          "-updated_at",
          "start_date",
          "-priority",
        ],
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
        group_by: [
          "state",
          "priority",
          "cycle",
          "module",
          "labels",
          "assignees",
          "created_by",
        ],
        sub_group_by: [
          "state",
          "priority",
          "cycle",
          "module",
          "labels",
          "assignees",
          "created_by",
          null,
        ],
        order_by: [
          "sort_order",
          "-created_at",
          "-updated_at",
          "start_date",
          "-priority",
          "target_date",
        ],
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
        order_by: [
          "sort_order",
          "-created_at",
          "-updated_at",
          "start_date",
          "-priority",
        ],
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
        order_by: [
          "sort_order",
          "-created_at",
          "-updated_at",
          "start_date",
          "-priority",
        ],
        type: [null, "active", "backlog"],
      },
      extra_options: {
        access: true,
        values: ["sub_issue"],
      },
    },
  },
};

export const ISSUE_STORE_TO_FILTERS_MAP: Partial<
  Record<EIssuesStoreType, TFiltersByLayout>
> = {
  [EIssuesStoreType.PROJECT]: ISSUE_DISPLAY_FILTERS_BY_PAGE.issues,
};

export enum EActivityFilterType {
  ACTIVITY = "ACTIVITY",
  COMMENT = "COMMENT",
}

export type TActivityFilters = EActivityFilterType;

export const ACTIVITY_FILTER_TYPE_OPTIONS: Record<
  TActivityFilters,
  { labelTranslationKey: string }
> = {
  [EActivityFilterType.ACTIVITY]: {
    labelTranslationKey: "common.updates",
  },
  [EActivityFilterType.COMMENT]: {
    labelTranslationKey: "common.comments",
  },
};

export type TActivityFilterOption = {
  key: TActivityFilters;
  labelTranslationKey: string;
  isSelected: boolean;
  onClick: () => void;
};

export const defaultActivityFilters: TActivityFilters[] = [
  EActivityFilterType.ACTIVITY,
  EActivityFilterType.COMMENT,
];

export const filterActivityOnSelectedFilters = (
  activity: TIssueActivityComment[],
  filters: TActivityFilters[]
): TIssueActivityComment[] =>
  activity.filter((activity) =>
    filters.includes(activity.activity_type as TActivityFilters)
  );

export const ENABLE_ISSUE_DEPENDENCIES = false;
