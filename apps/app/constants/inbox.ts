export const INBOX_STATUS = [
  {
    key: "pending",
    label: "Pending",
    value: -2,
    textColor: "text-yellow-500",
    bgColor: "bg-yellow-500/10",
    borderColor: "border-yellow-500",
  },
  {
    key: "declined",
    label: "Declined",
    value: -1,
    textColor: "text-red-500",
    bgColor: "bg-red-500/10",
    borderColor: "border-red-500",
  },
  {
    key: "snoozed",
    label: "Snoozed",
    value: 0,
    textColor: "text-brand-secondary",
    bgColor: "bg-gray-500/10",
    borderColor: "border-gray-500",
  },
  {
    key: "accepted",
    label: "Accepted",
    value: 1,
    textColor: "text-green-500",
    bgColor: "bg-green-500/10",
    borderColor: "border-green-500",
  },
  {
    key: "duplicate",
    label: "Duplicate",
    value: 2,
    textColor: "text-brand-secondary",
    bgColor: "bg-gray-500/10",
    borderColor: "border-gray-500",
  },
];

export const INBOX_ISSUE_SOURCE = "in-app";
