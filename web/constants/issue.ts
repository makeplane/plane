export const ISSUE_PRIORITIES = [
  { key: "urgent", title: "Urgent" },
  { key: "high", title: "High" },
  { key: "medium", title: "Medium" },
  { key: "low", title: "Low" },
  { key: "none", title: "None" },
];

export const ISSUE_STATE_GROUPS = [
  { key: "backlog", title: "Backlog" },
  { key: "unstarted", title: "Unstarted" },
  { key: "started", title: "Started" },
  { key: "completed", title: "Completed" },
  { key: "cancelled", title: "Cancelled" },
];

export const ISSUE_START_DATE_OPTIONS = [
  { key: "last_week", title: "Last Week" },
  { key: "2_weeks_from_now", title: "2 weeks from now" },
  { key: "1_month_from_now", title: "1 month from now" },
  { key: "2_months_from_now", title: "2 months from now" },
  { key: "custom", title: "Custom" },
];

export const ISSUE_DUE_DATE_OPTIONS = [
  { key: "last_week", title: "Last Week" },
  { key: "2_weeks_from_now", title: "2 weeks from now" },
  { key: "1_month_from_now", title: "1 month from now" },
  { key: "2_months_from_now", title: "2 months from now" },
  { key: "custom", title: "Custom" },
];

export const ISSUE_GROUP_BY_OPTIONS = [
  { key: "state", title: "States" },
  { key: "state_detail.group", title: "State Groups" },
  { key: "priority", title: "Priority" },
  { key: "project", title: "Project" }, // required this on my issues
  { key: "labels", title: "Labels" },
  { key: "assignees", title: "Assignees" },
  { key: "created_by", title: "Created By" },
];

export const ISSUE_ORDER_BY_OPTIONS = [
  { key: "sort_order", title: "Manual" },
  { key: "created_at", title: "Last Created" },
  { key: "updated_at", title: "Last Updated" },
  { key: "start_date", title: "Start Date" },
  { key: "priority", title: "Priority" },
];

export const ISSUE_FILTER_OPTIONS = [
  { key: "all", title: "All" },
  { key: "active", title: "Active Issues" },
  { key: "backlog", title: "Backlog Issues" },
  // { key: "draft", title: "Draft Issues" },
];

export const ISSUE_DISPLAY_PROPERTIES = [
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

export const ISSUE_EXTRA_PROPERTIES = [
  { key: "sub_issue", title: "Show sub-issues" }, // in spreadsheet its always false
  { key: "show_empty_groups", title: "Show empty states" }, // filter on front-end
  { key: "calendar_date_range", title: "Calendar Date Range" }, // calendar date range yyyy-mm-dd;before range yyyy-mm-dd;after
  { key: "start_target_date", title: "Start target Date" }, // gantt always be true
];

export const ISSUE_LAYOUTS = [
  { key: "list", title: "List View" },
  { key: "kanban", title: "Kanban View" },
  { key: "calendar", title: "Calendar View" },
  { key: "spreadsheet", title: "Spreadsheet View" },
  { key: "gantt_chart", title: "Gantt Chart View" },
];

export const ISSUE_LIST_FILTERS = [
  { key: "priority", title: "Priority" },
  { key: "state", title: "State" },
  { key: "assignees", title: "Assignees" },
  { key: "created_by", title: "Created By" },
  { key: "labels", title: "Labels" },
  { key: "start_date", title: "Start Date" },
  { key: "due_date", title: "Due Date" },
];

export const ISSUE_KANBAN_FILTERS = [
  { key: "priority", title: "Priority" },
  { key: "state", title: "State" },
  { key: "assignees", title: "Assignees" },
  { key: "created_by", title: "Created By" },
  { key: "labels", title: "Labels" },
  { key: "start_date", title: "Start Date" },
  { key: "due_date", title: "Due Date" },
];

export const ISSUE_CALENDER_FILTERS = [
  { key: "priority", title: "Priority" },
  { key: "state", title: "State" },
  { key: "assignees", title: "Assignees" },
  { key: "created_by", title: "Created By" },
  { key: "labels", title: "Labels" },
];

export const ISSUE_SPREADSHEET_FILTERS = [
  { key: "priority", title: "Priority" },
  { key: "state", title: "State" },
  { key: "assignees", title: "Assignees" },
  { key: "created_by", title: "Created By" },
  { key: "labels", title: "Labels" },
  { key: "start_date", title: "Start Date" },
  { key: "due_date", title: "Due Date" },
];

export const ISSUE_GANTT_FILTERS = [
  { key: "priority", title: "Priority" },
  { key: "state", title: "State" },
  { key: "assignees", title: "Assignees" },
  { key: "created_by", title: "Created By" },
  { key: "labels", title: "Labels" },
  { key: "start_date", title: "Start Date" },
  { key: "due_date", title: "Due Date" },
];

export const ISSUE_LIST_DISPLAY_FILTERS = [
  { key: "group_by", title: "Group By" },
  { key: "order_by", title: "Order By" },
  { key: "issue_type", title: "Issue Type" },
  { key: "sub_issue", title: "Sub Issue" },
  { key: "show_empty_groups", title: "Show Empty Groups" },
];

export const ISSUE_KANBAN_DISPLAY_FILTERS = [
  { key: "group_by", title: "Group By" },
  { key: "order_by", title: "Order By" },
  { key: "issue_type", title: "Issue Type" },
  { key: "sub_issue", title: "Sub Issue" },
  { key: "show_empty_groups", title: "Show Empty Groups" },
];

export const ISSUE_CALENDER_DISPLAY_FILTERS = [{ key: "issue_type", title: "Issue Type" }];

export const ISSUE_SPREADSHEET_DISPLAY_FILTERS = [{ key: "issue_type", title: "Issue Type" }];

export const ISSUE_GANTT_DISPLAY_FILTERS = [
  { key: "order_by", title: "Order By" },
  { key: "issue_type", title: "Issue Type" },
  { key: "sub_issue", title: "Sub Issue" },
];

export const ISSUE_EXTRA_DISPLAY_PROPERTIES = {
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
};
