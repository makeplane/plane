import { TIssuePriorities } from "types";

export const NETWORK_CHOICES: { key: 0 | 2; label: string; icon: string }[] = [
  {
    key: 0,
    label: "Private",
    icon: "lock",
  },
  {
    key: 2,
    label: "Public",
    icon: "public",
  },
];

export const GROUP_CHOICES = {
  backlog: "Backlog",
  unstarted: "Unstarted",
  started: "Started",
  completed: "Completed",
  cancelled: "Cancelled",
};

export const PRIORITIES: TIssuePriorities[] = ["urgent", "high", "medium", "low", "none"];

export const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export const PROJECT_AUTOMATION_MONTHS = [
  { label: "1 Month", value: 1 },
  { label: "3 Months", value: 3 },
  { label: "6 Months", value: 6 },
  { label: "9 Months", value: 9 },
  { label: "12 Months", value: 12 },
];
