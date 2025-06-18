import { Mail, MessageCircle } from "lucide-react";
import { EProductSubscriptionEnum } from "@plane/types";
// plane imports
import { DiscordIcon } from "@plane/ui";
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

const RiDiscordFill = ({ className }: { className?: string }) => (
  <DiscordIcon className={cn(className, "size-5 text-custom-text-200")} />
);

export const ComingSoonBadge = ({ className }: { className?: string }) => (
  <span
    className={cn(
      "bg-[#3f76ff] text-white font-semibold text-[8px] py-0.5 px-1.5 w-fit whitespace-nowrap rounded",
      className
    )}
  >
    COMING SOON
  </span>
);

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
          business: (
            <span className="flex flex-col items-end lg:items-center gap-1">
              <ComingSoonBadge />
              Work item transfers and conversions
            </span>
          ),
          enterprise: (
            <span className="flex flex-col items-end lg:items-center gap-1">
              <ComingSoonBadge />
              Work item transfers and conversions
            </span>
          ),
        },
      },
      {
        title: "Time Tracking + Worklogs",
        description: "Track time per work item, see aggregated reports, and\nfilter by need.",
        cloud: {
          free: false,
          one: "Basic",
          pro: "Historical timesheets",
          business: "Historical timesheets\nand approvals",
          enterprise: "Historical timesheets\nand approvals",
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
          pro: "Project-level\ncustom properties",
          business: "Workspace-level\nproperties and roll-ups",
          enterprise: "Workspace-level\nproperties and roll-ups",
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
        comingSoon: true,
        cloud: {
          free: false,
          one: false,
          pro: true,
          business: true,
          enterprise: true,
        },
      },
      {
        title: "Checkpoints",
        description:
          "Add markers to Projects, Epics and Initiatives to keep your\nteam on track and report on progress.",
        comingSoon: true,
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
      {
        title: "Auto-assignment In Modules",
        description: "Choose assignment rules for work items in a\nmodule including Linear, Round Robin, or Capacity.",
        cloud: {
          free: false,
          one: false,
          pro: "Linear",
          business: "Round-robin and Capacity",
          enterprise: "Round-robin and Capacity",
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
        comingSoon: true,
        cloud: {
          free: false,
          one: false,
          pro: true,
          business: true,
          enterprise: true,
        },
      },
      {
        title: "Teamspace Cycles",
        description: "See multiple cycles in multiple projects at once.",
        cloud: {
          free: false,
          one: false,
          pro: false,
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
        title: "Baselines And Deviations",
        description: "Declare baselines for how your projects progress\nand zoom in on deviations.",
        cloud: {
          free: false,
          one: false,
          pro: false,
          business: true,
          enterprise: true,
        },
      },
      {
        title: "Scheduled Comms",
        description: "Schedule reports, notifications, and messages to\nthird-party tools.",
        cloud: {
          free: false,
          one: false,
          pro: false,
          business: true,
          enterprise: true,
        },
      },
      {
        title: "Intake Assignees",
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
        title: "Custom SLAs",
        description: "Set SLA matrices for time-sensitive work items.",
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
        comingSoon: true,
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
      {
        title: "Insights",
        description: "Hindsight, On-demand insights, Foresights.",
        comingSoon: true,
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
        comingSoon: true,
        cloud: {
          free: false,
          one: false,
          pro: false,
          business: true,
          enterprise: true,
        },
      },
      {
        title: "Custom Reports",
        description: "Generate reports by any dimension and metric\nacross your project or workspace.",
        comingSoon: true,
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
      //         <span className="bg-[#3f76ff] text-white font-semibold text-[8px] p-0.5 w-fit whitespace-nowrap rounded-sm">
      //           COMING SOON
      //         </span>
      //         Operator capsules from text or PQL
      //       </span>
      //     ),
      //     business: (
      //       <span className="flex flex-col items-end lg:items-center gap-1">
      //         <span className="bg-[#3f76ff] text-white font-semibold text-[8px] p-0.5 w-fit whitespace-nowrap rounded-sm">
      //           COMING SOON
      //         </span>
      //         Operator capsules from text or PQL
      //       </span>
      //     ),
      //     enterprise: (
      //       <span className="flex flex-col items-end lg:items-center gap-1">
      //         <span className="bg-[#3f76ff] text-white font-semibold text-[8px] p-0.5 w-fit whitespace-nowrap rounded-sm">
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
        title: "Approvals",
        description: "Set workspace, project, and work item type approvals to\ndesignated admins.",
        comingSoon: true,
        cloud: {
          free: false,
          one: false,
          pro: false,
          business: true,
          enterprise: true,
        },
      },
      {
        title: "Admin Interface",
        description: "Get an admin overview to manage workspace and\nproject settings.",
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
      {
        title: "API-enabled Audit Logs",
        description: "See a full-workspace audit log and use APIs to flag\nPlane activity in compliance systems.",
        comingSoon: true,
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
      {
        title: "Decisions And Loops Automation",
        description: "Use actions as triggers indefinitely in an\nautomation flow.",
        comingSoon: true,
        cloud: {
          free: false,
          one: false,
          pro: false,
          business: true,
          enterprise: true,
        },
      },
      {
        title: "Number of automations",
        description: "Total number of automation flows in your\nworkspace",
        cloud: {
          free: false,
          one: false,
          pro: "5,000",
          business: "10,000",
          enterprise: "Unlimited",
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
          pro: "One download\nat a time",
          business: "Queued downloads",
          enterprise: "Queued downloads",
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
          pro: "2 days",
          business: "3 months",
          enterprise: "Unlimited",
        },
      },
      {
        title: "Databases + Formulas",
        description:
          "Put databases and formulas into a page without\nworrying about losing text, images, or other content\ntypes.",
        comingSoon: true,
        cloud: {
          free: false,
          one: false,
          pro: false,
          business: true,
          enterprise: true,
        },
      },
      {
        title: "Nested Pages",
        description: "Pages inside a page, organize your pages\nas you see fit for the progressive\ndisclosure.",
        comingSoon: true,
        cloud: {
          free: false,
          one: false,
          pro: false,
          business: "Word-compatible + other format downloads",
          enterprise: "Word-compatible + other format downloads",
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
        title: "GitHub",
        description: "Import your work items and members from GitHub.",
        cloud: {
          free: "Without custom props",
          one: "Without custom props",
          pro: "With custom props",
          business: "With custom props",
          enterprise: "With custom props",
        },
      },
    ],
  },
  {
    id: "integrations",
    title: "Integrations",
    comingSoon: true,
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
        title: "Zapier",
        description: "Run if-then-else automations using Zapier.",
        cloud: {
          free: false,
          one: false,
          pro: true,
          business: true,
          enterprise: true,
        },
      },
      {
        title: "Zendesk",
        description: "Create Plane work items from Zendesk tickets.",
        cloud: {
          free: false,
          one: false,
          pro: true,
          business: true,
          enterprise: true,
        },
      },
      {
        title: "Freshdesk",
        description: "Create Plane work items from Freshdesk tickets.",
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
    id: "storage",
    title: "Storage",
    cloudOnly: true,
    features: [
      {
        title: "Space",
        description: "Total storage allowed per workspace",
        cloud: {
          free: "5GB",
          one: false,
          pro: "1 TB",
          business: "5 TB",
          enterprise: "Custom",
        },
      },
      {
        title: "Max file size",
        description: "Limit for uploads to your workspace",
        cloud: {
          free: "5 MB",
          one: false,
          pro: "100 MB",
          business: "200 MB",
          enterprise: "Custom",
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
        title: "Domain Security",
        description:
          "Choose other domains that can authenticate into\nyour Plane workspace or restrict all but one domain.",
        cloud: {
          free: false,
          one: false,
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
        comingSoon: true,
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
      {
        title: "Private deployments",
        description: "Get our hosted Cloud app on a private Cloud\nmanaged by us.",
        comingSoon: true,
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
    id: "support",
    title: "Support",
    features: [
      {
        title: "Channels",
        description: "Get access to one or more Support channels\nby your plan.",
        cloud: {
          free: (
            <>
              <RiDiscordFill className="size-4" />
            </>
          ),
          one: (
            <div className="flex items-center gap-1">
              <Mail className="flex-shrink-0 size-4" />
              <RiDiscordFill className="flex-shrink-0 size-4" />
            </div>
          ),
          pro: (
            <div className="flex items-center gap-1">
              <Mail className="flex-shrink-0 size-4" />
              <RiDiscordFill className="flex-shrink-0 size-4" />
              <MessageCircle className="flex-shrink-0 size-4" />
            </div>
          ),
          business: "Full-suite\nprofessional services",
          enterprise: "Full-suite\nprofessional services",
        },
      },
      {
        title: "SLA",
        description: (
          <>
            Get business-friendly SLAs with higher plans. SLAs are by priority of work item and tiers{" "}
            <a href="https://plane.so/talk-to-sales" target="_blank" rel="noopener noreferrer" className="underline">
              can be requested
            </a>
            .
          </>
        ),
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
