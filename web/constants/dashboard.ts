import { linearGradientDef } from "@nivo/core";
// assets
import UpcomingAssignedIssuesDark from "public/empty-state/dashboard/dark/upcoming-assigned-issues.svg";
import UpcomingAssignedIssuesLight from "public/empty-state/dashboard/light/upcoming-assigned-issues.svg";
import OverdueAssignedIssuesDark from "public/empty-state/dashboard/dark/overdue-assigned-issues.svg";
import OverdueAssignedIssuesLight from "public/empty-state/dashboard/light/overdue-assigned-issues.svg";
import CompletedAssignedIssuesDark from "public/empty-state/dashboard/dark/completed-assigned-issues.svg";
import CompletedAssignedIssuesLight from "public/empty-state/dashboard/light/completed-assigned-issues.svg";
import UpcomingCreatedIssuesDark from "public/empty-state/dashboard/dark/upcoming-created-issues.svg";
import UpcomingCreatedIssuesLight from "public/empty-state/dashboard/light/upcoming-created-issues.svg";
import OverdueCreatedIssuesDark from "public/empty-state/dashboard/dark/overdue-created-issues.svg";
import OverdueCreatedIssuesLight from "public/empty-state/dashboard/light/overdue-created-issues.svg";
import CompletedCreatedIssuesDark from "public/empty-state/dashboard/dark/completed-created-issues.svg";
import CompletedCreatedIssuesLight from "public/empty-state/dashboard/light/completed-created-issues.svg";
// types
import { TDurationFilterOptions, TIssuesListTypes, TStateGroups } from "@plane/types";

export const PRIORITY_GRAPH_GRADIENTS = [
  linearGradientDef(
    "gradientUrgent",
    [
      { offset: 0, color: "#A90408" },
      { offset: 100, color: "#DF4D51" },
    ],
    {
      x1: 1,
      y1: 0,
      x2: 0,
      y2: 0,
    }
  ),
  linearGradientDef(
    "gradientHigh",
    [
      { offset: 0, color: "#FE6B00" },
      { offset: 100, color: "#FFAC88" },
    ],
    {
      x1: 1,
      y1: 0,
      x2: 0,
      y2: 0,
    }
  ),
  linearGradientDef(
    "gradientMedium",
    [
      { offset: 0, color: "#F5AC00" },
      { offset: 100, color: "#FFD675" },
    ],
    {
      x1: 1,
      y1: 0,
      x2: 0,
      y2: 0,
    }
  ),
  linearGradientDef(
    "gradientLow",
    [
      { offset: 0, color: "#1B46DE" },
      { offset: 100, color: "#4F9BF4" },
    ],
    {
      x1: 1,
      y1: 0,
      x2: 0,
      y2: 0,
    }
  ),
  linearGradientDef(
    "gradientNone",
    [
      { offset: 0, color: "#A0A1A9" },
      { offset: 100, color: "#B9BBC6" },
    ],
    {
      x1: 1,
      y1: 0,
      x2: 0,
      y2: 0,
    }
  ),
];

export const STATE_GROUP_GRAPH_GRADIENTS = [
  linearGradientDef("gradientBacklog", [
    { offset: 0, color: "#DEDEDE" },
    { offset: 100, color: "#BABABE" },
  ]),
  linearGradientDef("gradientUnstarted", [
    { offset: 0, color: "#D4D4D4" },
    { offset: 100, color: "#878796" },
  ]),
  linearGradientDef("gradientStarted", [
    { offset: 0, color: "#FFD300" },
    { offset: 100, color: "#FAE270" },
  ]),
  linearGradientDef("gradientCompleted", [
    { offset: 0, color: "#0E8B1B" },
    { offset: 100, color: "#37CB46" },
  ]),
  linearGradientDef("gradientCanceled", [
    { offset: 0, color: "#C90004" },
    { offset: 100, color: "#FF7679" },
  ]),
];

export const STATE_GROUP_GRAPH_COLORS: Record<TStateGroups, string> = {
  backlog: "#CDCED6",
  unstarted: "#80838D",
  started: "#FFC53D",
  completed: "#3E9B4F",
  cancelled: "#E5484D",
};

export const DURATION_FILTER_OPTIONS: {
  key: TDurationFilterOptions;
  label: string;
}[] = [
  {
    key: "today",
    label: "Today",
  },
  {
    key: "this_week",
    label: "This week",
  },
  {
    key: "this_month",
    label: "This month",
  },
  {
    key: "this_year",
    label: "This year",
  },
];

export const PROJECT_BACKGROUND_COLORS = [
  "bg-gray-500/20",
  "bg-green-500/20",
  "bg-red-500/20",
  "bg-orange-500/20",
  "bg-blue-500/20",
  "bg-yellow-500/20",
  "bg-pink-500/20",
  "bg-purple-500/20",
];

export const ISSUES_TABS_LIST: {
  key: TIssuesListTypes;
  label: string;
}[] = [
  {
    key: "upcoming",
    label: "Upcoming",
  },
  {
    key: "overdue",
    label: "Overdue",
  },
  {
    key: "completed",
    label: "Completed",
  },
];

const DURATION_TITLES: {
  [duration in TDurationFilterOptions]: string;
} = {
  today: "today",
  this_week: "in this week",
  this_month: "in this month",
  this_year: "in this year",
};

export const ASSIGNED_ISSUES_EMPTY_STATES = {
  upcoming: {
    title: "No upcoming issues",
    darkImage: UpcomingAssignedIssuesDark,
    lightImage: UpcomingAssignedIssuesLight,
  },
  overdue: {
    title: "No overdue issues",
    darkImage: OverdueAssignedIssuesDark,
    lightImage: OverdueAssignedIssuesLight,
  },
  completed: {
    title: "No completed issues",
    darkImage: CompletedAssignedIssuesDark,
    lightImage: CompletedAssignedIssuesLight,
  },
};

export const CREATED_ISSUES_EMPTY_STATES = {
  upcoming: {
    title: (duration: TDurationFilterOptions) =>
      `No created issues have deadlines coming up ${DURATION_TITLES[duration]}.`,
    darkImage: UpcomingCreatedIssuesDark,
    lightImage: UpcomingCreatedIssuesLight,
  },
  overdue: {
    title: (duration: TDurationFilterOptions) =>
      `No created issues with due dates ${DURATION_TITLES[duration]} are open.`,
    darkImage: OverdueCreatedIssuesDark,
    lightImage: OverdueCreatedIssuesLight,
  },
  completed: {
    title: (duration: TDurationFilterOptions) => `No created issues are completed ${DURATION_TITLES[duration]}.`,
    darkImage: CompletedCreatedIssuesDark,
    lightImage: CompletedCreatedIssuesLight,
  },
};
