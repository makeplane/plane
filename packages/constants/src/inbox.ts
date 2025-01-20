export const INBOX_STATUS: {
  key: string;
  title: string;
  description: () => string;
  textColor: (snoozeDatePassed: boolean) => string;
  bgColor: (snoozeDatePassed: boolean) => string;
}[] = [
  {
    key: "pending",
    title: "inbox_issue.status.pending.title",
    description: () => `inbox_issue.status.pending.description`,
    textColor: (snoozeDatePassed: boolean = false) =>
      snoozeDatePassed ? "" : "text-[#AB6400]",
    bgColor: (snoozeDatePassed: boolean = false) =>
      snoozeDatePassed ? "" : "bg-[#FFF7C2]",
  },
  {
    key: "declined",
    title: "inbox_issue.status.declined.title",
    description: () => `inbox_issue.status.declined.description`,
    textColor: (snoozeDatePassed: boolean = false) =>
      snoozeDatePassed ? "" : "text-[#CE2C31]",
    bgColor: (snoozeDatePassed: boolean = false) =>
      snoozeDatePassed ? "" : "bg-[#FEEBEC]",
  },
  {
    key: "snoozed",
    title: "inbox_issue.status.snoozed.title",
    description: () => `inbox_issue.status.snoozed.description`,
    textColor: (snoozeDatePassed: boolean = false) =>
      snoozeDatePassed ? "text-red-500" : "text-custom-text-400",
    bgColor: (snoozeDatePassed: boolean = false) =>
      snoozeDatePassed ? "bg-red-500/10" : "bg-[#E0E1E6]",
  },
  {
    key: "accepted",
    title: "inbox_issue.status.accepted.title",
    description: () => `inbox_issue.status.accepted.description`,
    textColor: (snoozeDatePassed: boolean = false) =>
      snoozeDatePassed ? "" : "text-[#3E9B4F]",
    bgColor: (snoozeDatePassed: boolean = false) =>
      snoozeDatePassed ? "" : "bg-[#E9F6E9]",
  },
  {
    key: "duplicate",
    title: "inbox_issue.status.duplicate.title",
    description: () => `inbox_issue.status.duplicate.description`,
    textColor: (snoozeDatePassed: boolean = false) =>
      snoozeDatePassed ? "" : "text-custom-text-200",
    bgColor: (snoozeDatePassed: boolean = false) =>
      snoozeDatePassed ? "" : "bg-gray-500/10",
  },
];

export const INBOX_ISSUE_SOURCE = "inbox_issue.source.in-app";

export const INBOX_ISSUE_ORDER_BY_OPTIONS = [
  {
    key: "issue__created_at",
    label: "inbox_issue.order_by.created_at",
  },
  {
    key: "issue__updated_at",
    label: "inbox_issue.order_by.updated_at",
  },
  {
    key: "issue__sequence_id",
    label: "inbox_issue.order_by.id",
  },
];

export const INBOX_ISSUE_SORT_BY_OPTIONS = [
  {
    key: "asc",
    label: "common.sort.asc",
  },
  {
    key: "desc",
    label: "common.sort.desc",
  },
];
