export const filtersPriority: { key: string; title: string }[] = [
  { key: "", title: "Urgent" },
  { key: "", title: "High" },
  { key: "", title: "Medium" },
  { key: "", title: "Low" },
  { key: "", title: "None" },
];

export const filtersStartDate = [
  { key: "", title: "Last Week" },
  { key: "", title: "2 weeks from now" },
  { key: "", title: "1 month from now" },
  { key: "", title: "2 months from now" },
  { key: "", title: "Custom" },
];

export const filtersDueDate = [
  { key: "", title: "Last Week" },
  { key: "", title: "2 weeks from now" },
  { key: "", title: "1 month from now" },
  { key: "", title: "2 months from now" },
  { key: "", title: "Custom" },
];

export const displayPropertyGroupBy = [
  { key: "state", title: "States" },
  { key: "state_detail.group", title: "State Groups" },
  { key: "priority", title: "Priority" },
  { key: "labels", title: "Labels" },
  { key: "assignees", title: "Assignees" },
  { key: "created_by", title: "Created By" },
];

export const displayPropertyOrderBy = [
  { key: "sort_order", title: "Manual" },
  { key: "created_at", title: "Last Created" },
  { key: "updated_at", title: "Last Updated" },
  { key: "start_date", title: "Start Date" },
  { key: "priority", title: "Priority" },
];

export const displayPropertyIssueType = [
  { key: "all", title: "All" },
  { key: "active", title: "Active Issues" },
  { key: "backlog", title: "Backlog Issues" },
];

export const displayProperties = [
  { key: "assignee", title: "Assignee" },
  { key: "start_date", title: "Start Date" },
  { key: "due_date", title: "Due Date" },
  { key: "key", title: "Id" },
  { key: "labels", title: "Labels" },
  { key: "priority", title: "Priority" },
  { key: "state", title: "State" },
  { key: "sub_issue_count", title: "Sub Issue Count" },
  { key: "attachment_count", title: "Attachment Count" },
  { key: "link", title: "Link" },
  { key: "estimate", title: "Estimate" },
];
