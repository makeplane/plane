/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import type {
  IIssueFilterOptions,
  ILayoutDisplayFiltersOptions,
  TIssueActivityComment,
  TWorkItemFilterProperty,
} from "@plane/types";
import { EIssuesStoreType } from "@plane/types";
import type { TIssueFilterPriorityObject } from "./common";
import {
  EPICS_DISPLAY_PROPERTIES_KEYS,
  ISSUE_DISPLAY_PROPERTIES_KEYS,
  SUB_ISSUES_DISPLAY_PROPERTIES_KEYS,
} from "./common";
import type { TIssueLayout } from "./layout";

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
  "milestone_id" = "milestone",
  "parent_id" = "epic",
  "type_id" = "issue_type",
}

export enum EIssueFilterType {
  RICH_FILTERS = "rich_filters",
  PQL_FILTERS = "pql_filters",
  DISPLAY_FILTERS = "display_filters",
  DISPLAY_PROPERTIES = "display_properties",
  KANBAN_FILTERS = "kanban_filters",
}

export type TSupportedFilterTypeForUpdate =
  | EIssueFilterType.DISPLAY_FILTERS
  | EIssueFilterType.DISPLAY_PROPERTIES
  | EIssueFilterType.KANBAN_FILTERS;

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
    className: "bg-layer-2 text-priority-urgent border-strong",
    icon: "error",
  },
  {
    key: "high",
    titleTranslationKey: "issue.priority.high",
    className: "bg-layer-2 text-priority-high border-strong",
    icon: "signal_cellular_alt",
  },
  {
    key: "medium",
    titleTranslationKey: "issue.priority.medium",
    className: "bg-layer-2 text-priority-medium border-strong",
    icon: "signal_cellular_alt_2_bar",
  },
  {
    key: "low",
    titleTranslationKey: "issue.priority.low",
    className: "bg-layer-2 text-priority-low border-strong",
    icon: "signal_cellular_alt_1_bar",
  },
  {
    key: "none",
    titleTranslationKey: "common.none",
    className: "bg-layer-2 text-priority-none border-strong",
    icon: "block",
  },
];

export type TFiltersLayoutOptions = {
  [layoutType: string]: ILayoutDisplayFiltersOptions;
};

export type TFilterPropertiesByPageType = {
  filters: TWorkItemFilterProperty[];
  layoutOptions: TFiltersLayoutOptions;
};

export type TIssueFiltersToDisplayByPageType = {
  [pageType: string]: TFilterPropertiesByPageType;
};

export const ISSUE_DISPLAY_FILTERS_BY_PAGE: TIssueFiltersToDisplayByPageType = {
  profile_issues: {
    filters: ["priority", "state_group", "label_id", "start_date", "target_date", "name", "milestone_id"],
    layoutOptions: {
      list: {
        display_properties: ISSUE_DISPLAY_PROPERTIES_KEYS,
        display_filters: {
          group_by: ["state_detail.group", "priority", "project", "labels", "type", null],
          order_by: ["sort_order", "-created_at", "-updated_at", "start_date", "-priority"],
          type: ["active", "backlog"],
        },
        extra_options: {
          access: true,
          values: ["show_empty_groups", "sub_issue"],
        },
      },
      kanban: {
        display_properties: ISSUE_DISPLAY_PROPERTIES_KEYS,
        display_filters: {
          group_by: ["state_detail.group", "priority", "project", "labels", "type"],
          order_by: ["sort_order", "-created_at", "-updated_at", "start_date", "-priority"],
          type: ["active", "backlog"],
        },
        extra_options: {
          access: true,
          values: ["show_empty_groups"],
        },
      },
    },
  },
  archived_issues: {
    filters: [
      "priority",
      "state_group",
      "state_id",
      "cycle_id",
      "module_id",
      "assignee_id",
      "created_by_id",
      "label_id",
      "start_date",
      "target_date",
      "type_id",
      "name",
      "milestone_id",
    ],
    layoutOptions: {
      list: {
        display_properties: ISSUE_DISPLAY_PROPERTIES_KEYS,
        display_filters: {
          group_by: ["state", "cycle", "module", "priority", "labels", "assignees", "created_by", "type", null],
          order_by: ["sort_order", "-created_at", "-updated_at", "start_date", "-priority"],
          type: ["active", "backlog"],
        },
        extra_options: {
          access: true,
          values: ["show_empty_groups"],
        },
      },
    },
  },
  my_issues: {
    filters: [
      "priority",
      "state_group",
      "label_id",
      "assignee_id",
      "created_by_id",
      "subscriber_id",
      "project_id",
      "start_date",
      "target_date",
      "name",
      "milestone_id",
    ],
    layoutOptions: {
      spreadsheet: {
        display_properties: ISSUE_DISPLAY_PROPERTIES_KEYS,
        display_filters: {
          order_by: [],
          type: ["active", "backlog"],
        },
        extra_options: {
          access: true,
          values: ["sub_issue"],
        },
      },
      list: {
        display_properties: ISSUE_DISPLAY_PROPERTIES_KEYS,
        display_filters: {
          type: ["active", "backlog"],
        },
        extra_options: {
          access: false,
          values: [],
        },
      },
      gantt_chart: {
        display_properties: ["key", "issue_type"],
        display_filters: {
          order_by: ["sort_order", "-created_at", "-updated_at", "start_date", "-priority"],
          type: ["active", "backlog"],
        },
        extra_options: {
          access: true,
          values: ["sub_issue"],
        },
      },
      kanban: {
        display_properties: ["key", "issue_type"],
        display_filters: {
          group_by: ["state_detail.group", "priority", "assignees", "labels", "created_by", "project", "type"],
          sub_group_by: [
            "state_detail.group",
            "priority",
            "assignees",
            "labels",
            "created_by",
            "project",
            "type",
            null,
          ],
        },
        extra_options: {
          access: true,
          values: ["sub_issue", "show_empty_groups"],
        },
      },
      calendar: {
        display_properties: ["key", "issue_type"],
        display_filters: {
          type: ["active", "backlog"],
        },
        extra_options: {
          access: true,
          values: [],
        },
      },
    },
  },
  issues: {
    filters: [
      "priority",
      "state_group",
      "state_id",
      "cycle_id",
      "module_id",
      "assignee_id",
      "mention_id",
      "created_by_id",
      "label_id",
      "start_date",
      "target_date",
      "type_id",
      "name",
      "milestone_id",
      "id",
      "epic_id",
      "parent_id",
    ],
    layoutOptions: {
      list: {
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
            "milestone",
            "epic",
            "type",
            null,
          ],
          order_by: ["sort_order", "-created_at", "-updated_at", "start_date", "-priority", "target_date"],
          type: ["active", "backlog"],
        },
        extra_options: {
          access: true,
          values: ["show_empty_groups", "sub_issue"],
        },
      },
      kanban: {
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
            "milestone",
            "epic",
            "type",
          ],
          sub_group_by: [
            "state",
            "priority",
            "cycle",
            "module",
            "labels",
            "assignees",
            "created_by",
            "epic",
            "type",
            null,
          ],
          order_by: ["sort_order", "-created_at", "-updated_at", "start_date", "-priority", "target_date"],
          type: ["active", "backlog"],
        },
        extra_options: {
          access: true,
          values: ["show_empty_groups", "sub_issue"],
        },
      },
      calendar: {
        display_properties: ["key", "issue_type"],
        display_filters: {
          type: ["active", "backlog"],
        },
        extra_options: {
          access: true,
          values: ["sub_issue"],
        },
      },
      spreadsheet: {
        display_properties: ISSUE_DISPLAY_PROPERTIES_KEYS,
        display_filters: {
          order_by: ["sort_order", "-created_at", "-updated_at", "start_date", "-priority"],
          type: ["active", "backlog"],
        },
        extra_options: {
          access: true,
          values: ["sub_issue"],
        },
      },
      gantt_chart: {
        display_properties: ["key", "issue_type"],
        display_filters: {
          order_by: ["sort_order", "-created_at", "-updated_at", "start_date", "-priority"],
          type: ["active", "backlog"],
        },
        extra_options: {
          access: true,
          values: ["sub_issue"],
        },
      },
    },
  },
  team_issues: {
    filters: [
      "priority",
      "state_group",
      "assignee_id",
      "mention_id",
      "created_by_id",
      "start_date",
      "target_date",
      "team_project_id",
      "name",
      "milestone_id",
    ],
    layoutOptions: {
      list: {
        display_properties: ISSUE_DISPLAY_PROPERTIES_KEYS,
        display_filters: {
          group_by: ["state_detail.group", "priority", "team_project", "assignees", "type", null],
          order_by: ["sort_order", "-created_at", "-updated_at", "start_date", "-priority"],
          type: ["active", "backlog"],
        },
        extra_options: {
          access: true,
          values: ["show_empty_groups", "sub_issue"],
        },
      },
      kanban: {
        display_properties: ISSUE_DISPLAY_PROPERTIES_KEYS,
        display_filters: {
          group_by: ["state_detail.group", "priority", "team_project", "assignees", "type", null],
          sub_group_by: ["state_detail.group", "priority", "team_project", "assignees", "type", null],
          order_by: ["sort_order", "-created_at", "-updated_at", "start_date", "-priority", "target_date"],
          type: ["active", "backlog"],
        },
        extra_options: {
          access: true,
          values: ["show_empty_groups", "sub_issue"],
        },
      },
      calendar: {
        display_properties: ["key", "issue_type"],
        display_filters: {
          type: ["active", "backlog"],
        },
        extra_options: {
          access: true,
          values: ["sub_issue"],
        },
      },
      spreadsheet: {
        display_properties: ISSUE_DISPLAY_PROPERTIES_KEYS,
        display_filters: {
          order_by: ["sort_order", "-created_at", "-updated_at", "start_date", "-priority"],
          type: ["active", "backlog"],
        },
        extra_options: {
          access: true,
          values: ["sub_issue"],
        },
      },
      gantt_chart: {
        display_properties: ["key", "issue_type"],
        display_filters: {
          order_by: ["sort_order", "-created_at", "-updated_at", "start_date", "-priority"],
          type: ["active", "backlog"],
        },
        extra_options: {
          access: true,
          values: ["sub_issue"],
        },
      },
    },
  },
  // TODO: Check if this is even required now? Because we can uses project issues properties for this case.
  team_project_work_items: {
    filters: [
      "priority",
      "state_group",
      "assignee_id",
      "mention_id",
      "created_by_id",
      "start_date",
      "target_date",
      "name",
      "milestone_id",
    ],
    layoutOptions: {
      list: {
        display_properties: ISSUE_DISPLAY_PROPERTIES_KEYS,
        display_filters: {
          group_by: ["state_detail.group", "priority", "assignees", "type", null],
          order_by: ["sort_order", "-created_at", "-updated_at", "start_date", "-priority"],
          type: ["active", "backlog"],
        },
        extra_options: {
          access: true,
          values: ["show_empty_groups", "sub_issue"],
        },
      },
      kanban: {
        display_properties: ISSUE_DISPLAY_PROPERTIES_KEYS,
        display_filters: {
          group_by: ["state_detail.group", "priority", "assignees", "type", null],
          sub_group_by: ["state_detail.group", "priority", "assignees", "type", null],
          order_by: ["sort_order", "-created_at", "-updated_at", "start_date", "-priority", "target_date"],
          type: ["active", "backlog"],
        },
        extra_options: {
          access: true,
          values: ["show_empty_groups", "sub_issue"],
        },
      },
      calendar: {
        display_properties: ["key", "issue_type"],
        display_filters: {
          type: ["active", "backlog"],
        },
        extra_options: {
          access: true,
          values: ["sub_issue"],
        },
      },
      spreadsheet: {
        display_properties: ISSUE_DISPLAY_PROPERTIES_KEYS,
        display_filters: {
          order_by: ["sort_order", "-created_at", "-updated_at", "start_date", "-priority"],
          type: ["active", "backlog"],
        },
        extra_options: {
          access: true,
          values: ["sub_issue"],
        },
      },
      gantt_chart: {
        display_properties: ["key", "issue_type"],
        display_filters: {
          order_by: ["sort_order", "-created_at", "-updated_at", "start_date", "-priority"],
          type: ["active", "backlog"],
        },
        extra_options: {
          access: true,
          values: ["sub_issue"],
        },
      },
    },
  },
  epics: {
    filters: [
      "priority",
      "state_group",
      "state_id",
      "assignee_id",
      "mention_id",
      "created_by_id",
      "label_id",
      "start_date",
      "target_date",
      "name",
      "milestone_id",
    ],
    layoutOptions: {
      list: {
        display_properties: EPICS_DISPLAY_PROPERTIES_KEYS,
        display_filters: {
          group_by: ["state", "priority", "labels", "assignees", "created_by", "milestone", null],
          order_by: ["sort_order", "-created_at", "-updated_at", "start_date", "-priority"],
          type: ["active", "backlog"],
        },
        extra_options: {
          access: true,
          values: ["show_empty_groups"],
        },
      },
      kanban: {
        display_properties: EPICS_DISPLAY_PROPERTIES_KEYS,
        display_filters: {
          group_by: ["state", "priority", "labels", "assignees", "created_by", "milestone"],
          sub_group_by: ["state", "priority", "labels", "assignees", "created_by", null],
          order_by: ["sort_order", "-created_at", "-updated_at", "start_date", "-priority", "target_date"],
          type: ["active", "backlog"],
        },
        extra_options: {
          access: true,
          values: ["show_empty_groups"],
        },
      },
      calendar: {
        display_properties: ["key", "issue_type"],
        display_filters: {
          type: ["active", "backlog"],
        },
        extra_options: {
          access: true,
          values: [],
        },
      },
      spreadsheet: {
        display_properties: EPICS_DISPLAY_PROPERTIES_KEYS,
        display_filters: {
          order_by: ["sort_order", "-created_at", "-updated_at", "start_date", "-priority"],
          type: ["active", "backlog"],
        },
        extra_options: {
          access: true,
          values: [],
        },
      },
      gantt_chart: {
        display_properties: ["key", "issue_type"],
        display_filters: {
          order_by: ["sort_order", "-created_at", "-updated_at", "start_date", "-priority"],
          type: ["active", "backlog"],
        },
        extra_options: {
          access: true,
          values: [],
        },
      },
    },
  },
  archived_epics: {
    filters: [
      "priority",
      "state_group",
      "state_id",
      "assignee_id",
      "created_by_id",
      "label_id",
      "start_date",
      "target_date",
      "name",
      "milestone_id",
    ],
    layoutOptions: {
      list: {
        display_properties: EPICS_DISPLAY_PROPERTIES_KEYS,
        display_filters: {
          group_by: ["state", "priority", "labels", "assignees", "created_by", null],
          order_by: ["sort_order", "-created_at", "-updated_at", "start_date", "-priority"],
          type: ["active", "backlog"],
        },
        extra_options: {
          access: true,
          values: ["show_empty_groups"],
        },
      },
    },
  },
  sub_work_items: {
    filters: ["priority", "state_id", "assignee_id", "start_date", "target_date", "type_id"],
    layoutOptions: {
      list: {
        display_properties: SUB_ISSUES_DISPLAY_PROPERTIES_KEYS,
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
  },
  initiatives: {
    filters: ["priority", "state_group", "project_id", "type_id", "assignee_id", "start_date", "target_date"],
    layoutOptions: {
      list: {
        display_properties: SUB_ISSUES_DISPLAY_PROPERTIES_KEYS,
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
  },
};

export const ISSUE_STORE_TO_FILTERS_MAP: Partial<Record<EIssuesStoreType, TFilterPropertiesByPageType>> = {
  [EIssuesStoreType.PROJECT]: ISSUE_DISPLAY_FILTERS_BY_PAGE.issues,
  [EIssuesStoreType.EPIC]: ISSUE_DISPLAY_FILTERS_BY_PAGE.epics,
  [EIssuesStoreType.ARCHIVED_EPIC]: ISSUE_DISPLAY_FILTERS_BY_PAGE.archived_epics,
};

export const SUB_WORK_ITEM_AVAILABLE_FILTERS_FOR_WORK_ITEM_PAGE: (keyof IIssueFilterOptions)[] = [
  "priority",
  "state_group",
  "issue_type",
  "assignees",
  "start_date",
  "target_date",
];

export enum EActivityFilterType {
  ACTIVITY = "ACTIVITY",
  COMMENT = "COMMENT",
  STATE = "STATE",
  ASSIGNEE = "ASSIGNEE",
  DEFAULT = "DEFAULT",
  WORKLOG = "WORKLOG",
  ISSUE_ADDITIONAL_PROPERTIES_ACTIVITY = "ISSUE_ADDITIONAL_PROPERTIES_ACTIVITY",
}

export type TActivityFilters = EActivityFilterType;

export type TActivityFilterOptionsKey = Exclude<TActivityFilters, EActivityFilterType.DEFAULT>;

export const ACTIVITY_FILTER_TYPE_OPTIONS: Record<TActivityFilterOptionsKey, { labelTranslationKey: string }> = {
  [EActivityFilterType.ACTIVITY]: {
    labelTranslationKey: "common.updates",
  },
  [EActivityFilterType.COMMENT]: {
    labelTranslationKey: "common.comments",
  },
  [EActivityFilterType.STATE]: {
    labelTranslationKey: "common.state",
  },
  [EActivityFilterType.ASSIGNEE]: {
    labelTranslationKey: "common.assignee",
  },
  [EActivityFilterType.WORKLOG]: {
    labelTranslationKey: "common.worklogs",
  },
  [EActivityFilterType.ISSUE_ADDITIONAL_PROPERTIES_ACTIVITY]: {
    labelTranslationKey: "common.additional_updates",
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
  EActivityFilterType.STATE,
  EActivityFilterType.ASSIGNEE,
  EActivityFilterType.WORKLOG,
  EActivityFilterType.ISSUE_ADDITIONAL_PROPERTIES_ACTIVITY,
];

export const shouldRenderActivity = (activity: TIssueActivityComment, filter: TActivityFilters): boolean =>
  activity.activity_type === filter;

export const filterActivityOnSelectedFilters = (
  activity: TIssueActivityComment[],
  filters: TActivityFilters[]
): TIssueActivityComment[] =>
  activity.filter((activity) => {
    if (activity.activity_type === EActivityFilterType.DEFAULT) return filters.includes(EActivityFilterType.ACTIVITY);
    return filters.some((filter) => shouldRenderActivity(activity, filter));
  });

export const ENABLE_ISSUE_DEPENDENCIES = true; // EE: enabled only in EE

export const BASE_ACTIVITY_FILTER_TYPES = [
  EActivityFilterType.ACTIVITY,
  EActivityFilterType.STATE,
  EActivityFilterType.ASSIGNEE,
  EActivityFilterType.DEFAULT,
];

export const SUB_WORK_ITEM_AVAILABLE_FILTERS_FOR_INITIATIVES_PAGE: (keyof IIssueFilterOptions)[] = [
  "priority",
  "state_group",
  "project",
  "issue_type",
  "assignees",
  "start_date",
  "target_date",
];

export const WORK_ITEM_FILTERS_ENTITY = {
  GLOBAL: "GLOBAL",
  PROFILE: "PROFILE",
  TEAM: "TEAM",
  PROJECT: "PROJECT",
  CYCLE: "CYCLE",
  MODULE: "MODULE",
  TEAM_VIEW: "TEAM_VIEW",
  PROJECT_VIEW: "PROJECT_VIEW",
  ARCHIVED: "ARCHIVED",
  ARCHIVED_EPIC: "ARCHIVED_EPIC",
  DEFAULT: "DEFAULT",
  WORKSPACE_DRAFT: "WORKSPACE_DRAFT",
  EPIC: "EPIC",
  TEAM_PROJECT_WORK_ITEMS: "TEAM_PROJECT_WORK_ITEMS",
  WORKSPACE_DASHBOARD_SOURCE: "WORKSPACE_DASHBOARD_SOURCE",
  WORKSPACE_DASHBOARD: "WORKSPACE_DASHBOARD",
} as const;

export type WorkItemFiltersEntity = keyof typeof WORK_ITEM_FILTERS_ENTITY;
