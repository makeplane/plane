import { ILayoutDisplayFiltersOptions, TIssueActivityComment } from "@plane/types";
import {
  ISSUE_DISPLAY_PROPERTIES_KEYS,
  EPICS_DISPLAY_PROPERTIES_KEYS,
  SUB_ISSUES_DISPLAY_PROPERTIES_KEYS,
} from "./common";
import { TActivityFilters } from "./filter";
import { EActivityFilterType } from "./filter";

export const ADDITIONAL_ISSUE_DISPLAY_FILTERS_BY_PAGE: {
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
        values: ["show_empty_groups"],
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
        values: ["show_empty_groups"],
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
        values: [],
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
        values: [],
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
        values: [],
      },
    },
  },
  initiatives: {
    list: {
      display_properties: SUB_ISSUES_DISPLAY_PROPERTIES_KEYS,
      filters: ["priority", "state_group", "project", "issue_type", "assignees", "start_date", "target_date"],
      display_filters: {
        order_by: ["-created_at", "-updated_at", "start_date", "-priority"],
        group_by: ["state_detail.group", "priority", "assignees", null],
      },
      extra_options: {
        access: true,
        values: ["sub_issue"],
      },
    },
  },
};

export enum EActivityFilterTypeEE {
  WORKLOG = "WORKLOG",
  ISSUE_ADDITIONAL_PROPERTIES_ACTIVITY = "ISSUE_ADDITIONAL_PROPERTIES_ACTIVITY",
}

export const shouldRenderActivity = (activity: TIssueActivityComment, filter: TActivityFilters): boolean =>
  activity.activity_type === filter ||
  (filter === EActivityFilterType.ACTIVITY &&
    activity.activity_type === EActivityFilterTypeEE.ISSUE_ADDITIONAL_PROPERTIES_ACTIVITY);
