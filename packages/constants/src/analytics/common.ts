/**
 * Copyright (c) 2023-present Gizmo Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { TAnalyticsTabsBase } from "@plane/types";
import { ChartXAxisProperty, ChartYAxisMetric } from "@plane/types";

export interface IInsightField {
  key: string;
  i18nKey: string;
  i18nProps?: {
    entity?: string;
    entityPlural?: string;
    prefix?: string;
    suffix?: string;
    [key: string]: unknown;
  };
}

export const ANALYTICS_INSIGHTS_FIELDS: Record<TAnalyticsTabsBase, IInsightField[]> = {
  overview: [
    {
      key: "total_users",
      i18nKey: "workspace_analytics.total",
      i18nProps: {
        entity: "common.users",
      },
    },
    {
      key: "total_admins",
      i18nKey: "workspace_analytics.total",
      i18nProps: {
        entity: "common.admins",
      },
    },
    {
      key: "total_members",
      i18nKey: "workspace_analytics.total",
      i18nProps: {
        entity: "common.members",
      },
    },
    {
      key: "total_guests",
      i18nKey: "workspace_analytics.total",
      i18nProps: {
        entity: "common.guests",
      },
    },
    {
      key: "total_projects",
      i18nKey: "workspace_analytics.total",
      i18nProps: {
        entity: "common.projects",
      },
    },
    {
      key: "total_work_items",
      i18nKey: "workspace_analytics.total",
      i18nProps: {
        entity: "common.work_items",
      },
    },
    {
      key: "total_cycles",
      i18nKey: "workspace_analytics.total",
      i18nProps: {
        entity: "common.cycles",
      },
    },
    {
      key: "total_intake",
      i18nKey: "workspace_analytics.total",
      i18nProps: {
        entity: "sidebar.intake",
      },
    },
  ],
  "work-items": [
    {
      key: "total_work_items",
      i18nKey: "workspace_analytics.total",
    },
    {
      key: "started_work_items",
      i18nKey: "workspace_analytics.started_work_items",
    },
    {
      key: "backlog_work_items",
      i18nKey: "workspace_analytics.backlog_work_items",
    },
    {
      key: "un_started_work_items",
      i18nKey: "workspace_analytics.un_started_work_items",
    },
    {
      key: "completed_work_items",
      i18nKey: "workspace_analytics.completed_work_items",
    },
  ],
};

export const ANALYTICS_DURATION_FILTER_OPTIONS = [
  {
    i18nKey: "workspace_analytics.duration.yesterday",
    value: "yesterday",
  },
  {
    i18nKey: "workspace_analytics.duration.last_7_days",
    value: "last_7_days",
  },
  {
    i18nKey: "workspace_analytics.duration.last_30_days",
    value: "last_30_days",
  },
  {
    i18nKey: "workspace_analytics.duration.last_3_months",
    value: "last_3_months",
  },
];

export const ANALYTICS_X_AXIS_VALUES: { value: ChartXAxisProperty; i18nKey: string }[] = [
  {
    value: ChartXAxisProperty.STATES,
    i18nKey: "workspace_analytics.axis.state_name",
  },
  {
    value: ChartXAxisProperty.STATE_GROUPS,
    i18nKey: "workspace_analytics.axis.state_group",
  },
  {
    value: ChartXAxisProperty.PRIORITY,
    i18nKey: "workspace_analytics.axis.priority",
  },
  {
    value: ChartXAxisProperty.LABELS,
    i18nKey: "workspace_analytics.axis.label",
  },
  {
    value: ChartXAxisProperty.ASSIGNEES,
    i18nKey: "workspace_analytics.axis.assignee",
  },
  {
    value: ChartXAxisProperty.ESTIMATE_POINTS,
    i18nKey: "workspace_analytics.axis.estimate_point",
  },
  {
    value: ChartXAxisProperty.CYCLES,
    i18nKey: "workspace_analytics.axis.cycle",
  },
  {
    value: ChartXAxisProperty.MODULES,
    i18nKey: "workspace_analytics.axis.module",
  },
  {
    value: ChartXAxisProperty.COMPLETED_AT,
    i18nKey: "workspace_analytics.axis.completed_date",
  },
  {
    value: ChartXAxisProperty.TARGET_DATE,
    i18nKey: "workspace_analytics.axis.due_date",
  },
  {
    value: ChartXAxisProperty.START_DATE,
    i18nKey: "workspace_analytics.axis.start_date",
  },
  {
    value: ChartXAxisProperty.CREATED_AT,
    i18nKey: "workspace_analytics.axis.created_date",
  },
];

export const ANALYTICS_Y_AXIS_VALUES: { value: ChartYAxisMetric; i18nKey: string }[] = [
  {
    value: ChartYAxisMetric.WORK_ITEM_COUNT,
    i18nKey: "workspace_analytics.metric.work_item",
  },
  {
    value: ChartYAxisMetric.ESTIMATE_POINT_COUNT,
    i18nKey: "workspace_analytics.metric.estimate",
  },
  {
    value: ChartYAxisMetric.EPIC_WORK_ITEM_COUNT,
    i18nKey: "workspace_analytics.metric.epic",
  },
];

export const ANALYTICS_V2_DATE_KEYS = ["completed_at", "target_date", "start_date", "created_at"];
