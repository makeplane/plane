/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import { ListTodo, Mail, Timer, Users, Zap } from "lucide-react";
// plane imports
import { CycleIcon, IntakeIcon, MilestoneIcon, ModuleIcon, PageIcon, ViewsIcon } from "@plane/propel/icons";
import type { IProject } from "@plane/types";

export type TIntakeFeatureKeys = "in_app" | "email" | "form";
export type TIntakeResponsibilityKeys = "notify_assignee";

type TProjectOtherFeatureKeys = "is_time_tracking_enabled" | "is_milestone_enabled";

export type TIntakeFeatureList = {
  [key in TIntakeFeatureKeys]: TProperties & {
    hasOptions: boolean;
    hasHyperlink?: boolean;
    canShuffle?: boolean;
    fieldName?: string;
  };
};

export type TIntakeResponsibilityList = { [key in TIntakeResponsibilityKeys]: TProperties };

export const INTAKE_FEATURES_LIST: TIntakeFeatureList = {
  in_app: {
    property: "in_app",
    title: "In-app",
    description:
      "Get new work items from Members and Guests in your workspace without disruption to your existing work items.",
    icon: <Zap className="h-4 w-4 flex-shrink-0 text-tertiary" />,
    isPro: false,
    isEnabled: true,
    hasOptions: false,
    key: "in_app",
  },
  email: {
    property: "email",
    title: "Email",
    description: "Collect new work items from anyone who sends an email to a Plane email address.",
    icon: <Mail className="h-4 w-4 flex-shrink-0 text-tertiary" />,
    isPro: false,
    isEnabled: true,
    hasOptions: true,
    hasHyperlink: false,
    canShuffle: true,
    key: "intake_email",
    fieldName: "Email ID",
  },
  form: {
    property: "form",
    title: "Forms",
    description:
      "Let folks outside your workspace create potential new work items for you via a dedicated and secure form.",
    icon: <ListTodo className="h-4 w-4 flex-shrink-0 text-tertiary" />,
    isPro: false,
    isEnabled: true,
    hasOptions: true,
    hasHyperlink: true,
    canShuffle: true,
    key: "intake",
    fieldName: "Default form URL",
  },
};

export const INTAKE_RESPONSIBILITY_LIST: TIntakeResponsibilityList = {
  notify_assignee: {
    property: "notify_assignee",
    title: "Notify assignees",
    description: "For a new request to intake, default assignees will be alerted via notifications",
    icon: <Users className="h-4 w-4 flex-shrink-0 text-tertiary" />,
    isPro: false,
    isEnabled: true,
    key: "notify_assignee",
  },
};

export type TProperties = {
  key: string;
  property: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  isPro: boolean;
  isEnabled: boolean;
  renderChildren?: (currentProjectDetails: IProject, workspaceSlug: string) => React.ReactNode;
  href?: string;
};

type TProjectBaseFeatureKeys = "cycles" | "modules" | "views" | "pages" | "inbox";

type TBaseFeatureList = {
  [key in TProjectBaseFeatureKeys]: TProperties;
};

export const PROJECT_BASE_FEATURES_LIST: TBaseFeatureList = {
  cycles: {
    key: "cycles",
    property: "cycle_view",
    title: "Cycles",
    description: "Timebox work as you see fit per project and change frequency from one period to the next.",
    icon: <CycleIcon className="h-5 w-5 flex-shrink-0 rotate-180 text-tertiary" />,
    href: "/cycles",
    isPro: false,
    isEnabled: true,
  },
  modules: {
    key: "modules",
    property: "module_view",
    title: "Modules",
    description: "Group work into sub-project-like set-ups with their own leads and assignees.",
    icon: <ModuleIcon width={20} height={20} className="flex-shrink-0 text-tertiary" />,
    isPro: false,
    isEnabled: true,
  },
  views: {
    key: "views",
    property: "issue_views_view",
    title: "Views",
    description: "Save sorts, filters, and display options for later or share them.",
    icon: <ViewsIcon className="h-5 w-5 flex-shrink-0 text-tertiary" />,
    isPro: false,
    isEnabled: true,
  },
  pages: {
    key: "pages",
    property: "page_view",
    title: "Pages",
    description: "Write anything like you write anything.",
    icon: <PageIcon className="h-5 w-5 flex-shrink-0 text-tertiary" />,
    isPro: false,
    isEnabled: true,
  },
  inbox: {
    key: "intake",
    property: "inbox_view",
    title: "Intake",
    description: "Consider and discuss work items before you add them to your project.",
    icon: <IntakeIcon className="h-5 w-5 flex-shrink-0 text-tertiary" />,
    isPro: false,
    isEnabled: true,
    href: "/intake",
  },
};

type TOtherFeatureList = {
  [key in TProjectOtherFeatureKeys]: TProperties;
};

export const PROJECT_OTHER_FEATURES_LIST: TOtherFeatureList = {
  is_time_tracking_enabled: {
    key: "time_tracking",
    property: "is_time_tracking_enabled",
    title: "Time Tracking",
    description: "Log time, see timesheets, and download full CSVs for your entire workspace.",
    icon: <Timer className="h-5 w-5 flex-shrink-0 text-tertiary" />,
    isEnabled: true,
    isPro: true,
  },
  is_milestone_enabled: {
    key: "milestones",
    property: "is_milestone_enabled",
    title: "Milestones",
    description: "Milestones provide a layer to align work items toward shared completion dates.",
    icon: <MilestoneIcon className="h-5 w-5 flex-shrink-0 text-tertiary" />,
    isPro: true,
    isEnabled: true,
  },
};

type TProjectFeatures = {
  project_features: {
    key: string;
    title: string;
    description: string;
    featureList: TBaseFeatureList;
  };
  project_others: {
    key: string;
    title: string;
    description: string;
    featureList: TOtherFeatureList;
  };
};

export const PROJECT_FEATURES_LIST: TProjectFeatures = {
  project_features: {
    key: "projects_and_issues",
    title: "Projects and work items",
    description: "Toggle these on or off this project.",
    featureList: PROJECT_BASE_FEATURES_LIST,
  },
  project_others: {
    key: "work_management",
    title: "Work management",
    description: "Available only on some plans as indicated by the label next to the feature below.",
    featureList: PROJECT_OTHER_FEATURES_LIST,
  },
};

export const PROJECT_FEATURES_LIST_FOR_TEMPLATE = {
  ...PROJECT_BASE_FEATURES_LIST,
  ...PROJECT_OTHER_FEATURES_LIST,
  inbox: {
    ...PROJECT_BASE_FEATURES_LIST.inbox,
    property: "intake_view", // TODO: Remove this once the property is updated in original constant
  },
};

export type TProjectFeatureForTemplateKeys = keyof typeof PROJECT_FEATURES_LIST_FOR_TEMPLATE;
