import { linearGradientDef } from "@nivo/core";
// assets
import UpcomingIssuesDark from "public/empty-state/dashboard/dark/upcoming-issues.svg";
import UpcomingIssuesLight from "public/empty-state/dashboard/light/upcoming-issues.svg";
import OverdueIssuesDark from "public/empty-state/dashboard/dark/overdue-issues.svg";
import OverdueIssuesLight from "public/empty-state/dashboard/light/overdue-issues.svg";
import CompletedIssuesDark from "public/empty-state/dashboard/dark/completed-issues.svg";
import CompletedIssuesLight from "public/empty-state/dashboard/light/completed-issues.svg";
// types
import { TDurationFilterOptions, TIssuesListTypes, TStateGroups } from "@plane/types";
import { Props } from "components/icons/types";
// constants
import { EUserWorkspaceRoles } from "./workspace";
// icons
import { BarChart2, Briefcase, CheckCircle, LayoutGrid } from "lucide-react";
import { ContrastIcon } from "@plane/ui";

// gradients for issues by priority widget graph bars
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

// colors for issues by state group widget graph arcs
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

// filter duration options
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

// random background colors for project cards
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

// assigned and created issues widgets tabs list
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
    label: "Marked completed",
  },
];

export const ASSIGNED_ISSUES_EMPTY_STATES = {
  upcoming: {
    title: "Upcoming issues assigned to\nyou will show up here.",
    darkImage: UpcomingIssuesDark,
    lightImage: UpcomingIssuesLight,
  },
  overdue: {
    title: "Issues assigned to you that are past\ntheir due date will show up here.",
    darkImage: OverdueIssuesDark,
    lightImage: OverdueIssuesLight,
  },
  completed: {
    title: "Issues assigned to you that you have\nmarked Completed will show up here.",
    darkImage: CompletedIssuesDark,
    lightImage: CompletedIssuesLight,
  },
};

export const CREATED_ISSUES_EMPTY_STATES = {
  upcoming: {
    title: "Upcoming issues you created\nwill show up here.",
    darkImage: UpcomingIssuesDark,
    lightImage: UpcomingIssuesLight,
  },
  overdue: {
    title: "Issues created by you that are past their\ndue date will show up here.",
    darkImage: OverdueIssuesDark,
    lightImage: OverdueIssuesLight,
  },
  completed: {
    title: "Issues created by you that you have\nmarked completed will show up here.",
    darkImage: CompletedIssuesDark,
    lightImage: CompletedIssuesLight,
  },
};

export const SIDEBAR_MENU_ITEMS: {
  key: string;
  label: string;
  href: string;
  access: EUserWorkspaceRoles;
  highlight: (pathname: string, baseUrl: string) => boolean;
  Icon: React.FC<Props>;
}[] = [
  {
    key: "dashboard",
    label: "Dashboard",
    href: ``,
    access: EUserWorkspaceRoles.GUEST,
    highlight: (pathname: string, baseUrl: string) => pathname === `${baseUrl}`,
    Icon: LayoutGrid,
  },
  {
    key: "analytics",
    label: "Analytics",
    href: `/analytics`,
    access: EUserWorkspaceRoles.MEMBER,
    highlight: (pathname: string, baseUrl: string) => pathname === `${baseUrl}/analytics`,
    Icon: BarChart2,
  },
  {
    key: "projects",
    label: "Projects",
    href: `/projects`,
    access: EUserWorkspaceRoles.GUEST,
    highlight: (pathname: string, baseUrl: string) => pathname === `${baseUrl}/projects`,
    Icon: Briefcase,
  },
  {
    key: "all-issues",
    label: "All Issues",
    href: `/workspace-views/all-issues`,
    access: EUserWorkspaceRoles.GUEST,
    highlight: (pathname: string, baseUrl: string) => pathname.includes(`${baseUrl}/workspace-views`),
    Icon: CheckCircle,
  },
  {
    key: "active-cycles",
    label: "Active Cycles",
    href: `/active-cycles`,
    access: EUserWorkspaceRoles.GUEST,
    highlight: (pathname: string, baseUrl: string) => pathname === `${baseUrl}/active-cycles`,
    Icon: ContrastIcon,
  },
];
