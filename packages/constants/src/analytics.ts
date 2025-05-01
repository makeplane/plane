// types
import { TXAxisValues, TYAxisValues } from "@plane/types";
import { ChartXAxisProperty, ChartYAxisMetric } from "./chart";

export const ANALYTICS_TABS = [
  {
    key: "scope_and_demand",
    i18n_title: "workspace_analytics.tabs.scope_and_demand",
  },
  { key: "custom", i18n_title: "workspace_analytics.tabs.custom" },
];

export const ANALYTICS_X_AXIS_VALUES: { value: ChartXAxisProperty; label: string }[] =
  [
    {
      value: ChartXAxisProperty.STATES,
      label: "State name",
    },
    {
      value: ChartXAxisProperty.STATE_GROUPS,
      label: "State group",
    },
    {
      value: ChartXAxisProperty.PRIORITY,
      label: "Priority",
    },
    {
      value: ChartXAxisProperty.LABELS,
      label: "Label",
    },
    {
      value: ChartXAxisProperty.ASSIGNEES,
      label: "Assignee",
    },
    {
      value: ChartXAxisProperty.ESTIMATE_POINTS,
      label: "Estimate point",
    },
    {
      value: ChartXAxisProperty.CYCLES,
      label: "Cycle",
    },
    {
      value: ChartXAxisProperty.MODULES,
      label: "Module",
    },
    {
      value: ChartXAxisProperty.COMPLETED_AT,
      label: "Completed date",
    },
    {
      value: ChartXAxisProperty.TARGET_DATE,
      label: "Due date",
    },
    {
      value: ChartXAxisProperty.START_DATE,
      label: "Start date",
    },
    {
      value: ChartXAxisProperty.CREATED_AT,
      label: "Created date",
    },
  ];

export const ANALYTICS_Y_AXIS_VALUES: { value: ChartYAxisMetric; label: string }[] =
  [
    {
      value: ChartYAxisMetric.WORK_ITEM_COUNT,
      label: "Work item Count",
    },
    {
      value: ChartYAxisMetric.ESTIMATE_POINT_COUNT,
      label: "Estimate",
    },
  ];

export const ANALYTICS_DATE_KEYS = [
  "completed_at",
  "target_date",
  "start_date",
  "created_at",
];
