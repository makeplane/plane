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

import { Mail, MessageCircle, MessageSquare } from "lucide-react";
import { EProductSubscriptionEnum } from "@plane/types";
// plane imports
import { cn } from "@plane/utils";

export type TPlanFeatureData = React.ReactNode | boolean | null;

// TODO: we should change this type and use TProductSubscriptionType instead. Need changes in common constants.
export type TPlanePlans = "free" | "one" | "pro" | "business" | "enterprise";

export type TPlanDetail = {
  id: EProductSubscriptionEnum;
  name: React.ReactNode;
  monthlyPrice?: number;
  yearlyPrice?: number;
  monthlyPriceSecondaryDescription?: React.ReactNode;
  yearlyPriceSecondaryDescription?: React.ReactNode;
  buttonCTA?: React.ReactNode;
  isActive: boolean;
};

type TPlanFeatureDetails = {
  title: React.ReactNode;
  description?: React.ReactNode;
  selfHostedDescription?: React.ReactNode;
  comingSoon?: boolean;
  selfHostedOnly?: boolean;
  cloud: Record<TPlanePlans, TPlanFeatureData>;
  "self-hosted"?: Record<TPlanePlans, TPlanFeatureData>;
};

type TPlansComparisonDetails = {
  id: string;
  title: React.ReactNode;
  comingSoon?: boolean;
  cloudOnly?: boolean;
  selfHostedOnly?: boolean;
  features: TPlanFeatureDetails[];
};

type PlanePlans = {
  planDetails: Record<TPlanePlans, TPlanDetail>;
  planHighlights: Record<TPlanePlans, string[]>;
  planComparison: TPlansComparisonDetails[];
};

function RiForumFill({ className }: { className?: string }) {
  return <MessageSquare className={cn(className, "size-5 text-secondary")} />;
}

export function ComingSoonBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "bg-accent-primary text-on-color font-semibold text-9 py-0.5 px-1.5 w-fit whitespace-nowrap rounded-sm",
        className
      )}
    >
      COMING SOON
    </span>
  );
}

export const PLANS_LIST: TPlanePlans[] = ["free", "one", "pro", "business", "enterprise"];

export const PLANS_COMPARISON_LIST: TPlansComparisonDetails[] = [
  {
    id: "project-work-tracking",
    title: "Project + work tracking",
    features: [
      {
        title: "Projects",
        description: "Add projects to house work items, cycles, and modules.",
        cloud: {
          free: true,
          one: true,
          pro: true,
          business: true,
          enterprise: true,
        },
      },
      {
        title: "Work items",
        description: "Add work via work items, set properties for tracking, and add to\ncycles or modules.",
        cloud: {
          free: true,
          one: true,
          pro: true,
          business: true,
          enterprise: true,
        },
      },
      {
        title: "Comments",
        description: "Respond to work items, @mention members, and brainstorm\ntogether without leaving Plane.",
        cloud: {
          free: true,
          one: true,
          pro: true,
          business: true,
          enterprise: true,
        },
      },
      {
        title: "Cycles",
        description: "Track work in timeboxes with differing frequency.",
        cloud: {
          free: true,
          one: true,
          pro: true,
          business: true,
          enterprise: true,
        },
      },
      {
        title: "Modules",
        description: "Group replicable work in modules with their own\nleads.",
        cloud: {
          free: true,
          one: true,
          pro: true,
          business: true,
          enterprise: true,
        },
      },
      {
        title: "Intake",
        description:
          "See suggestions and feedback from viewers and\nguests before you decide to add them to your\nproject.",
        cloud: {
          free: true,
          one: true,
          pro: true,
          business: true,
          enterprise: true,
        },
      },
      {
        title: "Estimates",
        description: "Measure effort in points in a system that works for\nyou.",
        cloud: {
          free: "Basic",
          one: "Basic",
          pro: "Advanced",
          business: "Advanced",
          enterprise: "Advanced",
        },
      },
    ],
  },
  {
    id: "project-work-management",
    title: "Project + work management",
    features: [
      {
        title: "Bulk Ops",
        description: "Add several work items to cycles or modules, transfer\nthem, or edit their properties.",
        cloud: {
          free: false,
          one: "Limited props",
          pro: "All props",
          business: "All props",
          enterprise: "All props",
        },
      },
      {
        title: "Worklogs",
        description: "Track time per work item, see aggregated reports, and\nfilter by need.",
        cloud: {
          free: false,
          one: "Basic",
          pro: true,
          business: true,
          enterprise: true,
        },
      },
      {
        title: "Active Cycles",
        description: "See all running cycles across all projects, or soon, in\na single project.",
        cloud: {
          free: false,
          one: true,
          pro: true,
          business: true,
          enterprise: true,
        },
      },
      {
        title: "Work item Types",
        description: "Create your own work item types with your own\nproperties.",
        cloud: {
          free: false,
          one: false,
          pro: true,
          business: true,
          enterprise: true,
        },
      },
      {
        title: "Custom Properties",
        description: "Create your own properties and apply them to your\nworkspace or project.",
        cloud: {
          free: false,
          one: false,
          pro: true,
          business: true,
          enterprise: true,
        },
      },
      {
        title: "Dependencies in Gantt",
        description: "Adjust timelines for dependent work items visually on\nour Gantt layout.",
        cloud: {
          free: false,
          one: false,
          pro: true,
          business: true,
          enterprise: true,
        },
      },
      {
        title: "Work item Transfers",
        description: "Move a work item from a project or a cycle to\nanother.",
        cloud: {
          free: false,
          one: false,
          pro: true,
          business: true,
          enterprise: true,
        },
      },
      {
        title: "Auto-transfer Cycle Work items",
        description:
          "Transfer incomplete work items from a completed cycle\nto the next cycle or to the default project state. ",
        cloud: {
          free: false,
          one: false,
          pro: true,
          business: true,
          enterprise: true,
        },
      },
      {
        title: "Epics",
        description: "Organize long-term work in epics that house work items,\ncycles, and modules.",
        cloud: {
          free: false,
          one: false,
          pro: true,
          business: true,
          enterprise: true,
        },
      },
      {
        title: "Initiatives",
        description: "Create initiatives to roll up several epics.",
        cloud: {
          free: false,
          one: false,
          pro: true,
          business: true,
          enterprise: true,
        },
      },
      {
        title: "Module Overview",
        description: "Like Cycle Overviews, see relevant details and\nprogress charts for each module.",
        cloud: {
          free: false,
          one: false,
          pro: true,
          business: true,
          enterprise: true,
        },
      },
      // {
      //   title: "Project Overview",
      //   description: "See just-in-time snapshots of your project with\nessential metrics.",
      //   comingSoon: true,
      //   cloud: {
      //     free: false,
      //     one: false,
      //     pro: true,
      //     business: true,
      //     enterprise: true,
      //   },
      // },
      {
        title: "Public, Private, and Secret projects",
        description:
          "Public projects are visible and accessible to\neveryone. Private ones are visible but need approval\nto join. Secret projects aren't visible or accessible.",
        cloud: {
          free: false,
          one: false,
          pro: true,
          business: true,
          enterprise: true,
        },
      },
      {
        title: "State Of Projects",
        description:
          "See all projects laid across states that highlight\nthose that need attention and those on track.",
        cloud: {
          free: false,
          one: false,
          pro: true,
          business: true,
          enterprise: true,
        },
      },
      // {
      //   title: "Project Updates",
      //   description:
      //     "Keep stakeholders in the loop with a dedicated\nspace for updates that everyone in the project can\nsee.",
      //   comingSoon: true,
      //   cloud: {
      //     free: false,
      //     one: false,
      //     pro: true,
      //     business: true,
      //     enterprise: true,
      //   },
      // },
      {
        title: "Pre-defined work item Templates",
        description:
          "Choose from our available work item templates that\ncustomize work item types and properties for several\nuse cases.",
        cloud: {
          free: false,
          one: false,
          pro: true,
          business: true,
          enterprise: true,
        },
      },
      {
        title: "Project Templates",
        description: "Save states, workflows, automation, and other project\nsettings into templates.",
        cloud: {
          free: false,
          one: false,
          pro: false,
          business: true,
          enterprise: true,
        },
      },
      {
        title: "Intake Responsibility",
        description: "Assign approved Intake work items to a member by\ndefault.",
        cloud: {
          free: false,
          one: false,
          pro: false,
          business: true,
          enterprise: true,
        },
      },
      {
        title: "Intake Forms",
        description: "Take Intake work items from externally accessible web\nforms.",
        cloud: {
          free: false,
          one: false,
          pro: false,
          business: true,
          enterprise: true,
        },
      },
      {
        title: "Emails For Intake",
        description: "Get an email address for reporting work items\ndirectly into a project's Intake.",
        cloud: {
          free: false,
          one: false,
          pro: false,
          business: true,
          enterprise: true,
        },
      },
    ],
  },
  {
    id: "visualization",
    title: "Visualization",
    features: [
      {
        title: "Layouts",
        description:
          "Choose from the List, the Board, the Calendar, the\nGantt, or the Spreadsheet layout for your work items.",
        cloud: {
          free: true,
          one: true,
          pro: true,
          business: true,
          enterprise: true,
        },
      },
      {
        title: "Views",
        description: "Save sort, filter, and display options on a layout to a\nview.",
        cloud: {
          free: true,
          one: true,
          pro: true,
          business: true,
          enterprise: true,
        },
      },
      {
        title: "Shared Views",
        description: "Choose a few members to share a view with.",
        cloud: {
          free: false,
          one: false,
          pro: true,
          business: true,
          enterprise: true,
        },
      },
      {
        title: "Publish Views",
        description: "Put a view on the Internet and let your customers\ninteract with them.",
        cloud: {
          free: false,
          one: false,
          pro: true,
          business: true,
          enterprise: true,
        },
      },
      {
        title: "Dashboards and Widgets",
        description: "Create your own dashboards with custom widgets\nand data types.",
        cloud: {
          free: false,
          one: false,
          pro: true,
          business: true,
          enterprise: true,
        },
      },
    ],
  },
  {
    id: "analytics-reports",
    title: "Analytics + reports",
    features: [
      {
        title: "Progress Charts",
        description:
          "Track progress in cycles, modules, and overviews\nthroughout Plane without switching to dashboards\nor Analytics.",
        cloud: {
          free: false,
          one: false,
          pro: true,
          business: true,
          enterprise: true,
        },
      },
      {
        title: "Cycle Reports",
        description: "Get on-demand cycle reports during and after a\ncycle. Revisit reports anytime from permalinks.",
        cloud: {
          free: false,
          one: false,
          pro: true,
          business: true,
          enterprise: true,
        },
      },
      // {
      //   title: "Time Capsule",
      //   description: "Go back in your project's timeline and see point-in-\ntime snapshots.",
      //   comingSoon: true,
      //   cloud: {
      //     free: false,
      //     one: false,
      //     pro: false,
      //     business: true,
      //     enterprise: true,
      //   },
      // },
      {
        title: "Advanced Pages Analytics",
        description: "See who's viewing, sharing, and commenting on\nyour pages along with other useful info.",
        cloud: {
          free: false,
          one: false,
          pro: true,
          business: true,
          enterprise: true,
        },
      },
    ],
  },
  {
    id: "navigation",
    title: "Navigation",
    features: [
      {
        title: "Power K",
        description: "Access a keyboard-first gateway to almost anything\nin Plane.",
        cloud: {
          free: true,
          one: true,
          pro: true,
          business: true,
          enterprise: true,
        },
      },
      // {
      //   title: "Search",
      //   description: "Search via natural-language queries, operators, or\nPQL",
      //   cloud: {
      //     free: "Basic text search",
      //     one: "Basic text search",
      //     pro: (
      //       <span className="flex flex-col items-end lg:items-center gap-1">
      //         <span className="bg-[#3f76ff] text-on-color font-semibold text-9 p-0.5 w-fit whitespace-nowrap rounded-xs">
      //           COMING SOON
      //         </span>
      //         Operator capsules from text or PQL
      //       </span>
      //     ),
      //     business: (
      //       <span className="flex flex-col items-end lg:items-center gap-1">
      //         <span className="bg-[#3f76ff] text-on-color font-semibold text-9 p-0.5 w-fit whitespace-nowrap rounded-xs">
      //           COMING SOON
      //         </span>
      //         Operator capsules from text or PQL
      //       </span>
      //     ),
      //     enterprise: (
      //       <span className="flex flex-col items-end lg:items-center gap-1">
      //         <span className="bg-[#3f76ff] text-on-color font-semibold text-9 p-0.5 w-fit whitespace-nowrap rounded-xs">
      //           COMING SOON
      //         </span>
      //         Operator capsules from text or PQL
      //       </span>
      //     ),
      //   },
      // },
      {
        title: "PQL",
        description:
          "Write Plane Query Language in search with support\nfor Boolean operators. Soon, you can write natural\nlanguage queries.",
        cloud: {
          free: false,
          one: false,
          pro: true,
          business: true,
          enterprise: true,
        },
      },
    ],
  },
  {
    id: "workspace-user-management",
    title: "Workspace and user management",
    features: [
      {
        title: "Member limit",
        description: "Number of seats that can use project and work management features",
        selfHostedDescription: "Number of users that our standard infra supports\nIncrease infra to get more users",
        cloud: {
          free: "12",
          one: "",
          pro: "Unlimited",
          business: "Unlimited",
          enterprise: "Unlimited",
        },
        "self-hosted": {
          free: "~50",
          one: "~50",
          pro: "~200",
          business: "~200",
          enterprise: "Unlimited",
        },
      },
      {
        title: "Roles",
        description: "Choose from one of four pre-defined roles or create\ncustom ones with RBAC.",
        cloud: {
          free: "Basic",
          one: "Basic",
          pro: "Pre-defined roles",
          business: "RBAC",
          enterprise: "GAC",
        },
      },
      {
        title: "Guests",
        description: "Let some users see everything or just their work items in\na project.",
        cloud: {
          free: false,
          one: "5 per paid member",
          pro: "5 per paid member",
          business: "5 per paid member",
          enterprise: "5 per paid member",
        },
      },
      {
        title: "Project Activity Logs",
        description: "See filterable activity logs for your entire\nproject.",
        cloud: {
          free: false,
          one: false,
          pro: false,
          business: true,
          enterprise: true,
        },
      },
      {
        title: "Workspace Activity Logs",
        description: "See filterable activity logs for your entire\nworkspace.",
        cloud: {
          free: false,
          one: false,
          pro: false,
          business: true,
          enterprise: true,
        },
      },
    ],
  },
  {
    id: "automations-workflows",
    title: "Automations and workflows",
    features: [
      {
        title: "System Automations",
        description: "Choose your settings to archive work items, complete cycles, and more.",
        cloud: {
          free: false,
          one: false,
          pro: true,
          business: true,
          enterprise: true,
        },
      },
      {
        title: "Trigger And Action",
        description: "Choose a trigger and a corresponding action per\nautomation flow.",
        cloud: {
          free: false,
          one: false,
          pro: true,
          business: true,
          enterprise: true,
        },
      },
    ],
  },
  {
    id: "knowledge-management",
    title: "Knowledge management",
    features: [
      {
        title: "Pages",
        description: "Build knowledge bases for your teams which are\naccessible & shareable.",
        cloud: {
          free: true,
          one: true,
          pro: true,
          business: true,
          enterprise: true,
        },
      },
      {
        title: "Real-time Collab",
        description: "Edit a page together with members in your project,\nteam, or workspace.",
        cloud: {
          free: false,
          one: true,
          pro: true,
          business: true,
          enterprise: true,
        },
      },
      {
        title: "Work item Embeds",
        description: "Embed work items from any project you are a member\nof.",
        cloud: {
          free: false,
          one: true,
          pro: true,
          business: true,
          enterprise: true,
        },
      },
      {
        title: "Link-to-work items",
        description: "Link pages in work items in a separate section in work item\ndetails.",
        cloud: {
          free: false,
          one: true,
          pro: true,
          business: true,
          enterprise: true,
        },
      },
      {
        title: "Publish",
        description:
          "Put your pages on the web for external users and let\nthem comment without signing into your workspace.",
        cloud: {
          free: false,
          one: true,
          pro: true,
          business: true,
          enterprise: true,
        },
      },
      {
        title: "Wiki",
        description: "Create company-wide wikis or knowledge bases\nwithout creating a project.",
        cloud: {
          free: false,
          one: true,
          pro: true,
          business: true,
          enterprise: true,
        },
      },
      {
        title: "Exports",
        description: "Export page content into PDFs or Word-compatible\ndocs.",
        cloud: {
          free: false,
          one: false,
          pro: true,
          business: true,
          enterprise: true,
        },
      },
      {
        title: "Templates",
        description: "Use pages as templates for your project, team, or\nworkspace.",
        cloud: {
          free: false,
          one: false,
          pro: true,
          business: true,
          enterprise: true,
        },
      },
      {
        title: "Versions",
        description: "See restorable version of edits to your pages.",
        cloud: {
          free: false,
          one: false,
          pro: "20 days",
          business: "3 months",
          enterprise: "Unlimited",
        },
      },
      {
        title: "Nested Pages",
        description: "Pages inside a page, organize your pages\nas you see fit for the progressive\ndisclosure.",
        cloud: {
          free: false,
          one: false,
          pro: false,
          business: true,
          enterprise: true,
        },
      },
    ],
  },
  {
    id: "importers",
    title: "Importers",
    features: [
      {
        title: "Jira",
        description: "Import your work items and members from Jira.",
        cloud: {
          free: "Without custom props",
          one: "Without custom props",
          pro: "With custom props",
          business: "With custom props",
          enterprise: "With custom props",
        },
      },
      {
        title: "Jira Server/Data Center",
        description: "Import your work items and members from Jira\nServer or Data Center.",
        cloud: {
          free: "Without custom props",
          one: "Without custom props",
          pro: "With custom props",
          business: "With custom props",
          enterprise: "With custom props",
        },
      },
      {
        title: "Linear",
        description: "Import your work items and members from Linear.",
        cloud: {
          free: "Without custom props",
          one: "Without custom props",
          pro: "With custom props",
          business: "With custom props",
          enterprise: "With custom props",
        },
      },
      {
        title: "Asana",
        description: "Import your work items and members from Asana.",
        cloud: {
          free: "Without custom props",
          one: "Without custom props",
          pro: "With custom props",
          business: "With custom props",
          enterprise: "With custom props",
        },
      },
      {
        title: "ClickUp",
        description: "Import your work items and members from ClickUp.",
        cloud: {
          free: "Without custom props",
          one: "Without custom props",
          pro: "With custom props",
          business: "With custom props",
          enterprise: "With custom props",
        },
      },
      {
        title: "Notion",
        description: "Import your pages, databases, and members from Notion.",
        cloud: {
          free: false,
          one: false,
          pro: true,
          business: true,
          enterprise: true,
        },
      },
      {
        title: "Confluence",
        description: "Import your pages, blogs, and members from Confluence.",
        cloud: {
          free: false,
          one: false,
          pro: true,
          business: true,
          enterprise: true,
        },
      },
      {
        title: "Flatfile Importer",
        description: "Use our Flatfile importer to import your data from\nspreadsheets and databases.",
        cloud: {
          free: false,
          one: false,
          pro: true,
          business: true,
          enterprise: true,
        },
      },
      {
        title: "CSV",
        description: "Import your work items and projects from CSV\nspreadsheets.",
        cloud: {
          free: false,
          one: false,
          pro: true,
          business: true,
          enterprise: true,
        },
      },
    ],
  },
  {
    id: "integrations",
    title: "Integrations",
    features: [
      {
        title: "GitHub",
        description:
          "Sync Plane work items and states to GitHub work items and\nstates. Update GitHub automatically with activity\nfrom Plane and vice-versa.",
        cloud: {
          free: false,
          one: false,
          pro: true,
          business: true,
          enterprise: true,
        },
      },
      {
        title: "GitLab",
        description:
          "Sync Plane work items and states to GitLab work items and\nstates. Update GitLab automatically with activity\nfrom Plane and vice-versa.",
        cloud: {
          free: false,
          one: false,
          pro: true,
          business: true,
          enterprise: true,
        },
      },
      {
        title: "Slack",
        description: "Get Plane activity in Slack and use / commands in\nSlack to make changes in Plane.",
        cloud: {
          free: false,
          one: false,
          pro: true,
          business: true,
          enterprise: true,
        },
      },
      {
        title: "Sentry",
        description:
          "Sync Plane work items and states to Sentry issues and\nstates. Update Sentry automatically with activity\nfrom Plane and vice-versa.",
        cloud: {
          free: false,
          one: false,
          pro: true,
          business: true,
          enterprise: true,
        },
      },
      {
        title: "GitHub Enterprise",
        description:
          "Sync Plane work items and states to GitHub Enterprise work items and\nstates. Update GitHub Enterprise automatically with activity\nfrom Plane and vice-versa.",
        cloud: {
          free: false,
          one: false,
          pro: true,
          business: true,
          enterprise: true,
        },
      },
      {
        title: "GitLab Enterprise",
        description:
          "Sync Plane work items and states to GitLab Enterprise work items and\nstates. Update GitLab Enterprise automatically with activity\nfrom Plane and vice-versa.",
        cloud: {
          free: false,
          one: false,
          pro: true,
          business: true,
          enterprise: true,
        },
      },
      {
        title: "Draw.io",
        description: "Embed Draw.io diagrams in your Plane pages to make\nthem more visual and collaborative.",
        cloud: {
          free: false,
          one: false,
          pro: true,
          business: true,
          enterprise: true,
        },
      },
      {
        title: "VS Code MCP",
        description:
          "Use our VS Code MCP extension to see and update your\nPlane work items without leaving your code.",
        cloud: {
          free: false,
          one: false,
          pro: true,
          business: true,
          enterprise: true,
        },
      },
      {
        title: "Claude",
        description:
          "Use our Claude integration to ask questions about your\nwork items and projects, get summaries, and more.",
        cloud: {
          free: false,
          one: false,
          pro: true,
          business: true,
          enterprise: true,
        },
      },
      {
        title: "Raycast",
        description: "Use our Raycast extension to see and update your\nPlane work items without leaving your code.",
        cloud: {
          free: false,
          one: false,
          pro: true,
          business: true,
          enterprise: true,
        },
      },
    ],
  },
  {
    id: "security",
    title: "Security",
    features: [
      {
        title: "SAML",
        description: "Get the officially supported SAML implementation\nand make Plane secure with any IdP.",
        cloud: {
          free: false,
          one: true,
          pro: true,
          business: true,
          enterprise: true,
        },
      },
      {
        title: "OIDC",
        description: "Get the officially supported OIDC implementation\nand make Plane secure with any IdP.",
        selfHostedOnly: true,
        cloud: {
          free: false,
          one: true,
          pro: true,
          business: true,
          enterprise: true,
        },
      },
      {
        title: "Two-factor authentication and passkeys",
        description: "Secure your Plane workspace with device-\ndependent two-factor authentication and passkeys. ",
        cloud: {
          free: false,
          one: false,
          pro: true,
          business: true,
          enterprise: true,
        },
      },
      {
        title: "Password Policy",
        description: "Set custom password policies in line with your\ncompliance requirements.",
        cloud: {
          free: false,
          one: false,
          pro: true,
          business: true,
          enterprise: true,
        },
      },
      {
        title: "LDAP",
        description: "Get our official LDAP implementation and secure\nyour Plane workspace with your LDAP server.",
        cloud: {
          free: false,
          one: false,
          pro: false,
          business: false,
          enterprise: true,
        },
      },
    ],
  },
  {
    id: "self-hosted",
    title: "Self-hosted",
    selfHostedOnly: true,
    features: [
      {
        title: "God Mode",
        description: "Manage your self-hosted Plane instance better with\nan instance admin interface.",
        cloud: {
          free: true,
          one: true,
          pro: true,
          business: true,
          enterprise: true,
        },
      },
      {
        title: "One-click Deployment",
        description: "Install and deploy your self-hosted Plane to any\nprivate cloud with a single-line command.",
        cloud: {
          free: false,
          one: true,
          pro: true,
          business: true,
          enterprise: true,
        },
      },
      {
        title: "Digital Ocean Marketplace app",
        description: "Get our Digital Ocean-compatible app on their\nmarketplace.",
        cloud: {
          free: false,
          one: true,
          pro: true,
          business: true,
          enterprise: true,
        },
      },
      {
        title: "Heroku Platform app",
        description: "Get our Heroku Platform-compatible app and deploy\nto Heroku easily.",
        cloud: {
          free: false,
          one: true,
          pro: true,
          business: true,
          enterprise: true,
        },
      },
      {
        title: "AWS AMI",
        description: "Get our AMI-compatible app from the AWS\nmarketplace.",
        cloud: {
          free: false,
          one: true,
          pro: true,
          business: true,
          enterprise: true,
        },
      },
    ],
  },
];

export const PLANE_PLANS: PlanePlans = {
  planDetails: {
    free: {
      id: EProductSubscriptionEnum.FREE,
      name: "Free",
      monthlyPrice: 0,
      yearlyPrice: 0,
      isActive: true,
    },
    one: {
      id: EProductSubscriptionEnum.ONE,
      name: "One",
      monthlyPrice: 799,
      yearlyPrice: 799,
      monthlyPriceSecondaryDescription: "per workspace",
      yearlyPriceSecondaryDescription: "per workspace",
      buttonCTA: "Upgrade",
      isActive: false,
    },
    pro: {
      id: EProductSubscriptionEnum.PRO,
      name: "Pro",
      monthlyPrice: 8,
      yearlyPrice: 6,
      monthlyPriceSecondaryDescription: "billed monthly",
      yearlyPriceSecondaryDescription: "billed yearly",
      buttonCTA: "Upgrade",
      isActive: true,
    },
    business: {
      id: EProductSubscriptionEnum.BUSINESS,
      name: "Business",
      monthlyPriceSecondaryDescription: "billed monthly",
      yearlyPriceSecondaryDescription: "billed yearly",
      buttonCTA: "Talk to Sales",
      isActive: false,
    },
    enterprise: {
      id: EProductSubscriptionEnum.ENTERPRISE,
      name: "Enterprise",
      monthlyPriceSecondaryDescription: "billed monthly",
      yearlyPriceSecondaryDescription: "billed yearly",
      buttonCTA: "Talk to Sales",
      isActive: false,
    },
  },
  planHighlights: {
    free: ["Upto 12 users", "Pages", "Unlimited projects", "Unlimited cycles and modules"],
    one: ["Upto 50 users", "OIDC and SAML", "Active cycles", "Limited time tracking"],
    pro: ["Unlimited users", "Custom work items + Properties", "Work item templates", "Full Time Tracking"],
    business: ["RBAC", "Project Templates", "Baselines And Deviations", "Custom Reports"],
    enterprise: ["Private + managed deployments", "GAC", "LDAP support", "Databases + Formulas"],
  },
  planComparison: PLANS_COMPARISON_LIST,
};
