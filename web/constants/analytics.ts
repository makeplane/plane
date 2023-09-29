// types
import { localized } from "helpers/localization.helper";
import { TXAxisValues, TYAxisValues } from "types";

export const ANALYTICS_X_AXIS_VALUES: { value: TXAxisValues; label: string }[] = [
  {
    value: "state__name",
    label: localized("State name"),
  },
  {
    value: "state__group",
    label: localized("State group"),
  },
  {
    value: "priority",
    label: localized("Priority"),
  },
  {
    value: "labels__name",
    label: localized("Label"),
  },
  {
    value: "assignees__id",
    label: localized("Assignee"),
  },
  {
    value: "estimate_point",
    label: localized("Estimate point"),
  },
  {
    value: "issue_cycle__cycle__name",
    label: localized("Cycle"),
  },
  {
    value: "issue_module__module__name",
    label: localized("Module"),
  },
  {
    value: "completed_at",
    label: localized("Completed date"),
  },
  {
    value: "target_date",
    label: localized("Due date"),
  },
  {
    value: "start_date",
    label: localized("Start date"),
  },
  {
    value: "created_at",
    label: localized("Created date"),
  },
];

export const ANALYTICS_Y_AXIS_VALUES: { value: TYAxisValues; label: string }[] = [
  {
    value: "issue_count",
    label: localized("Issue count"),
  },
  {
    value: "estimate",
    label: localized("Estimate"),
  },
];

export const DATE_KEYS = ["completed_at", "target_date", "start_date", "created_at"];
