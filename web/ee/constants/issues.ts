// types
import { IIssueDisplayProperties, TIssueActivityComment } from "@plane/types";
// ce constants
import {
  TActivityFilters as TActivityFiltersCe,
  EActivityFilterType,
  ACTIVITY_FILTER_TYPE_OPTIONS as ACTIVITY_FILTER_TYPE_OPTIONS_CE,
} from "@/ce/constants/issues";
// constants
import { ILayoutDisplayFiltersOptions } from "@/constants/issue";

export enum EActivityFilterTypeEE {
  WORKLOG = "WORKLOG",
  ISSUE_ADDITIONAL_PROPERTIES_ACTIVITY = "ISSUE_ADDITIONAL_PROPERTIES_ACTIVITY",
}

export type TActivityFilters = TActivityFiltersCe | EActivityFilterTypeEE.WORKLOG;

export const ACTIVITY_FILTER_TYPE_OPTIONS: Record<TActivityFilters, { label: string }> = {
  ...ACTIVITY_FILTER_TYPE_OPTIONS_CE,
  [EActivityFilterTypeEE.WORKLOG]: {
    label: "Worklogs",
  },
};

export const defaultActivityFilters: TActivityFilters[] = [
  EActivityFilterType.ACTIVITY,
  EActivityFilterType.COMMENT,
  EActivityFilterTypeEE.WORKLOG,
];

export type TActivityFilterOption = {
  key: TActivityFilters;
  label: string;
  isSelected: boolean;
  onClick: () => void;
};

const shouldRenderActivity = (activity: TIssueActivityComment, filter: TActivityFilters): boolean =>
  activity.activity_type === filter ||
  (filter === EActivityFilterType.ACTIVITY &&
    activity.activity_type === EActivityFilterTypeEE.ISSUE_ADDITIONAL_PROPERTIES_ACTIVITY);

export const filterActivityOnSelectedFilters = (
  activity: TIssueActivityComment[],
  filters: TActivityFilters[]
): TIssueActivityComment[] =>
  activity.filter((activity) => filters.some((filter) => shouldRenderActivity(activity, filter)));

export { EActivityFilterType };

export const ENABLE_ISSUE_DEPENDENCIES = true;

const ISSUE_DISPLAY_PROPERTIES_KEYS: (keyof IIssueDisplayProperties)[] = [
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

export const ADDITIONAL_ISSUE_DISPLAY_FILTERS_BY_LAYOUT: {
  [pageType: string]: { [layoutType: string]: ILayoutDisplayFiltersOptions };
} = {
  team_issues: {
    list: {
      filters: [
        "priority",
        "state_group",
        "assignees",
        "mentions",
        "created_by",
        "start_date",
        "target_date",
        "team_project",
      ],
      display_properties: ISSUE_DISPLAY_PROPERTIES_KEYS,
      display_filters: {
        group_by: ["state_detail.group", "priority", "team_project", null],
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
        "state_group",
        "assignees",
        "mentions",
        "created_by",
        "start_date",
        "target_date",
        "team_project",
      ],
      display_properties: ISSUE_DISPLAY_PROPERTIES_KEYS,
      display_filters: {
        group_by: ["state_detail.group", "priority", "team_project", null],
        sub_group_by: ["state_detail.group", "priority", "team_project", null],
        order_by: ["sort_order", "-created_at", "-updated_at", "start_date", "-priority", "target_date"],
        type: [null, "active", "backlog"],
      },
      extra_options: {
        access: true,
        values: ["show_empty_groups", "sub_issue"],
      },
    },
    calendar: {
      filters: ["priority", "state_group", "assignees", "mentions", "created_by", "start_date", "team_project"],
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
        "state_group",
        "assignees",
        "mentions",
        "created_by",
        "start_date",
        "target_date",
        "team_project",
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
        "state_group",
        "assignees",
        "mentions",
        "created_by",
        "start_date",
        "target_date",
        "team_project",
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
};
