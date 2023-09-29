import { localized } from "helpers/localization.helper";
import { TIssuePriorities } from "types";

export const NETWORK_CHOICES: { key: 0 | 2; label: string; icon: string }[] = [
  {
    key: 0,
    label: localized("Private"),
    icon: "lock",
  },
  {
    key: 2,
    label: localized("Public"),
    icon: "public",
  },
];

export const GROUP_CHOICES = {
  backlog: localized("Backlog"),
  unstarted: localized("Unstarted"),
  started: localized("Started"),
  completed: localized("Completed"),
  cancelled: localized("Cancelled"),
};

export const PRIORITIES: TIssuePriorities[] = ["urgent", "high", "medium", "low", "none"];

export const MONTHS = [
  localized("January"),
  localized("February"),
  localized("March"),
  localized("April"),
  localized("May"),
  localized("June"),
  localized("July"),
  localized("August"),
  localized("September"),
  localized("October"),
  localized("November"),
  localized("December"),
];

export const DAYS = [
  localized("Sunday"),
  localized("Monday"),
  localized("Tuesday"),
  localized("Wednesday"),
  localized("Thursday"),
  localized("Friday"),
  localized("Saturday"),
];

export const PROJECT_AUTOMATION_MONTHS = [
  { label: "1 " + localized("Month"), value: 1 },
  { label: "3 " + localized("Months"), value: 3 },
  { label: "6 " + localized("Months"), value: 6 },
  { label: "9 " + localized("Months"), value: 9 },
  { label: "12 " + localized("Months"), value: 12 },
];
