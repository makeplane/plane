import { renderDateFormat } from "helpers/date-time.helper";
// types
import { TIssueLayouts, TIssueParams } from "./issue_filters";

export type TStateGroup = "backlog" | "unstarted" | "started" | "completed" | "cancelled";

export const priorities: { key: string; title: string }[] = [
  { key: "urgent", title: "Urgent" },
  { key: "high", title: "High" },
  { key: "medium", title: "Medium" },
  { key: "low", title: "Low" },
  { key: "none", title: "None" },
];

export const stateGroups: { key: TStateGroup; title: string }[] = [
  { key: "backlog", title: "Backlog" },
  { key: "unstarted", title: "Unstarted" },
  { key: "started", title: "Started" },
  { key: "completed", title: "Completed" },
  { key: "cancelled", title: "Cancelled" },
];

export const startDateOptions: { key: string; title: string }[] = [
  { key: "last_week", title: "Last Week" },
  { key: "2_weeks_from_now", title: "2 weeks from now" },
  { key: "1_month_from_now", title: "1 month from now" },
  { key: "2_months_from_now", title: "2 months from now" },
  { key: "custom", title: "Custom" },
];

export const dueDateOptions: { key: string; title: string }[] = [
  { key: "last_week", title: "Last Week" },
  { key: "2_weeks_from_now", title: "2 weeks from now" },
  { key: "1_month_from_now", title: "1 month from now" },
  { key: "2_months_from_now", title: "2 months from now" },
  { key: "custom", title: "Custom" },
];

export const groupByOptions: { key: string; title: string }[] = [
  { key: "state", title: "States" },
  { key: "state_detail.group", title: "State Groups" },
  { key: "priority", title: "Priority" },
  { key: "project", title: "Project" }, // required this on my issues
  { key: "labels", title: "Labels" },
  { key: "assignees", title: "Assignees" },
  { key: "created_by", title: "Created By" },
];

export const orderByOptions: { key: string; title: string }[] = [
  { key: "sort_order", title: "Manual" },
  { key: "created_at", title: "Last Created" },
  { key: "updated_at", title: "Last Updated" },
  { key: "start_date", title: "Start Date" },
  { key: "priority", title: "Priority" },
];

export const issueTypes: { key: string; title: string }[] = [
  { key: "all", title: "All" },
  { key: "active", title: "Active Issues" },
  { key: "backlog", title: "Backlog Issues" },
];

export const displayProperties: { key: string; title: string }[] = [
  { key: "assignee", title: "Assignee" },
  { key: "start_date", title: "Start Date" },
  { key: "due_date", title: "Due Date" },
  { key: "key", title: "ID" },
  { key: "labels", title: "Labels" },
  { key: "priority", title: "Priority" },
  { key: "state", title: "State" },
  { key: "sub_issue_count", title: "Sub Issue Count" },
  { key: "attachment_count", title: "Attachment Count" },
  { key: "link", title: "Link" },
  { key: "estimate", title: "Estimate" },
];

export const extraProperties: { key: string; title: string }[] = [
  { key: "sub_issue", title: "Show sub-issues" }, // in spreadsheet its always false
  { key: "show_empty_groups", title: "Show empty states" }, // filter on front-end
  { key: "calendar_date_range", title: "Calendar Date Range" }, // calendar date range yyyy-mm-dd;before range yyyy-mm-dd;after
  { key: "start_target_date", title: "Start target Date" }, // gantt always be true
];

export const issueFilterVisibilityData: any = {
  my_issues: {
    layout: ["list", "kanban"],
    filters: {
      list: ["priority", "state_group", "labels", "start_date", "due_date"],
      kanban: ["priority", "state_group", "labels", "start_date", "due_date"],
    },
    display_properties: {
      list: true,
      kanban: true,
    },
    display_filters: {
      list: ["group_by", "order_by", "issue_type"],
      kanban: ["group_by", "order_by", "issue_type"],
    },
    extra_options: {
      list: {
        access: true,
        values: ["show_empty_groups"],
      },
      kanban: {
        access: true,
        values: ["show_empty_groups"],
      },
    },
  },
  issues: {
    layout: ["list", "kanban", "calendar", "spreadsheet", "gantt_chart"],
    filters: {
      list: ["priority", "state", "assignees", "created_by", "labels", "start_date", "due_date"],
      kanban: ["priority", "state", "assignees", "created_by", "labels", "start_date", "due_date"],
      calendar: ["priority", "state", "assignees", "created_by", "labels"],
      spreadsheet: ["priority", "state", "assignees", "created_by", "labels", "start_date", "due_date"],
      gantt_chart: ["priority", "state", "assignees", "created_by", "labels", "start_date", "due_date"],
    },
    display_properties: {
      list: true,
      kanban: true,
      calendar: true,
      spreadsheet: true,
      gantt_chart: false,
    },
    display_filters: {
      list: ["group_by", "order_by", "issue_type", "sub_issue", "show_empty_groups"],
      kanban: ["group_by", "order_by", "issue_type", "sub_issue", "show_empty_groups"],
      calendar: ["issue_type"],
      spreadsheet: ["issue_type"],
      gantt_chart: ["order_by", "issue_type", "sub_issue"],
    },
    extra_options: {
      list: {
        access: true,
        values: ["show_empty_groups", "sub_issue"],
      },
      kanban: {
        access: true,
        values: ["show_empty_groups", "sub_issue"],
      },
      calendar: {
        access: false,
        values: [],
      },
      spreadsheet: {
        access: false,
        values: [],
      },
      gantt_chart: {
        access: true,
        values: ["sub_issue"],
      },
    },
  },
};

export const handleIssueQueryParamsByLayout = (_layout: TIssueLayouts | undefined): TIssueParams[] | null => {
  if (_layout === "list")
    return [
      "priority",
      "state_group",
      "state",
      "assignees",
      "created_by",
      "labels",
      "start_date",
      "target_date",
      "group_by",
      "order_by",
      "type",
      "sub_issue",
      "show_empty_groups",
    ];
  if (_layout === "kanban")
    return [
      "priority",
      "state_group",
      "state",
      "assignees",
      "created_by",
      "labels",
      "start_date",
      "target_date",
      "group_by",
      "order_by",
      "type",
      "sub_issue",
      "show_empty_groups",
    ];
  if (_layout === "calendar")
    return [
      "priority",
      "state_group",
      "state",
      "assignees",
      "created_by",
      "labels",
      "start_date",
      "target_date",
      "type",
      "calendar_date_range",
    ];
  if (_layout === "spreadsheet")
    return [
      "priority",
      "state_group",
      "state",
      "assignees",
      "created_by",
      "labels",
      "start_date",
      "target_date",
      "type",
      "sub_issue",
    ];
  if (_layout === "gantt_chart")
    return [
      "priority",
      "state",
      "assignees",
      "created_by",
      "labels",
      "start_date",
      "target_date",
      "order_by",
      "type",
      "sub_issue",
      "start_target_date",
    ];

  return null;
};

export const handleIssueParamsDateFormat = (key: string, start_date: any | null, target_date: any | null) => {
  if (key === "last_week")
    return `${renderDateFormat(new Date(new Date().getTime() - 7 * 24 * 60 * 60 * 1000))};after,${renderDateFormat(
      new Date()
    )};before`;

  if (key === "2_weeks_from_now")
    return `${renderDateFormat(new Date())};after,
      ${renderDateFormat(new Date(new Date().getTime() + 14 * 24 * 60 * 60 * 1000))};before`;

  if (key === "1_month_from_now")
    return `${renderDateFormat(new Date())};after,${renderDateFormat(
      new Date(new Date().getFullYear(), new Date().getMonth() + 1, new Date().getDate())
    )};before`;

  if (key === "2_months_from_now")
    return `${renderDateFormat(new Date())};after,${renderDateFormat(
      new Date(new Date().getFullYear(), new Date().getMonth() + 2, new Date().getDate())
    )};before`;

  if (key === "custom" && start_date && target_date)
    return `${renderDateFormat(start_date)};after,${renderDateFormat(target_date)};before`;
};
