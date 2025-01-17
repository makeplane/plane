import { EUserPermissions } from "ee/constants/user-permissions";
import { Plus, Shapes } from "lucide-react";

export interface EmptyStateDetails {
  key: EmptyStateType;
  title?: string;
  description?: string;
  path?: string;
  primaryButton?: {
    icon?: React.ReactNode;
    text: string;
    comicBox?: {
      title?: string;
      description?: string;
    };
  };
  secondaryButton?: {
    icon?: React.ReactNode;
    text: string;
    comicBox?: {
      title?: string;
      description?: string;
    };
  };
  accessType?: "workspace" | "project";
  access?: any;
}

export enum EmptyStateType {
  WORKSPACE_DASHBOARD = "workspace-dashboard",
  WORKSPACE_ANALYTICS = "workspace-analytics",
  WORKSPACE_PROJECTS = "workspace-projects",
  WORKSPACE_ALL_ISSUES = "workspace-all-issues",
  WORKSPACE_ASSIGNED = "workspace-assigned",
  WORKSPACE_CREATED = "workspace-created",
  WORKSPACE_SUBSCRIBED = "workspace-subscribed",
  WORKSPACE_CUSTOM_VIEW = "workspace-custom-view",
  WORKSPACE_NO_PROJECTS = "workspace-no-projects",
  WORKSPACE_PROJECT_NOT_FOUND = "workspace-project-not-found",
  WORKSPACE_SETTINGS_API_TOKENS = "workspace-settings-api-tokens",
  WORKSPACE_SETTINGS_WEBHOOKS = "workspace-settings-webhooks",
  WORKSPACE_SETTINGS_EXPORT = "workspace-settings-export",
  WORKSPACE_SETTINGS_IMPORT = "workspace-settings-import",
  PROFILE_ACTIVITY = "profile-activity",
  PROFILE_ASSIGNED = "profile-assigned",
  PROFILE_CREATED = "profile-created",
  PROFILE_SUBSCRIBED = "profile-subscribed",
  PROJECT_SETTINGS_LABELS = "project-settings-labels",
  PROJECT_SETTINGS_INTEGRATIONS = "project-settings-integrations",
  PROJECT_SETTINGS_ESTIMATE = "project-settings-estimate",
  PROJECT_CYCLES = "project-cycles",
  PROJECT_CYCLE_NO_ISSUES = "project-cycle-no-issues",
  PROJECT_CYCLE_ACTIVE = "project-cycle-active",
  PROJECT_CYCLE_ALL = "project-cycle-all",
  PROJECT_CYCLE_COMPLETED_NO_ISSUES = "project-cycle-completed-no-issues",
  PROJECT_ARCHIVED_NO_CYCLES = "project-archived-no-cycles",
  PROJECT_EMPTY_FILTER = "project-empty-filter",
  PROJECT_ARCHIVED_EMPTY_FILTER = "project-archived-empty-filter",
  PROJECT_NO_ISSUES = "project-no-issues",
  PROJECT_ARCHIVED_NO_ISSUES = "project-archived-no-issues",
  VIEWS_EMPTY_SEARCH = "views-empty-search",
  PROJECTS_EMPTY_SEARCH = "projects-empty-search",
  MEMBERS_EMPTY_SEARCH = "members-empty-search",
  // stickies
  STICKIES = "stickies",
  STICKIES_SEARCH = "stickies-search",
  // home widgets
  HOME_WIDGETS = "home-widgets",
}

const emptyStateDetails: Record<EmptyStateType, EmptyStateDetails> = {
  // workspace
  [EmptyStateType.WORKSPACE_DASHBOARD]: {
    key: EmptyStateType.WORKSPACE_DASHBOARD,
    title: "Overview of your projects, activity, and metrics",
    description:
      " Welcome to Plane, we are excited to have you here. Create your first project and track your issues, and this page will transform into a space that helps you progress. Admins will also see items which help their team progress.",
    path: "/empty-state/onboarding/dashboard",
    // path: "/empty-state/onboarding/",
    primaryButton: {
      text: "Build your first project",
      comicBox: {
        title: "Everything starts with a project in Plane",
        description: "A project could be a product’s roadmap, a marketing campaign, or launching a new car.",
      },
    },

    accessType: "workspace",
    access: [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
  },
  [EmptyStateType.WORKSPACE_ANALYTICS]: {
    key: EmptyStateType.WORKSPACE_ANALYTICS,
    title: "Track progress, workloads, and allocations. Spot trends, remove blockers, and move work faster",
    description:
      "See scope versus demand, estimates, and scope creep. Get performance by team members and teams, and make sure your project runs on time.",
    path: "/empty-state/onboarding/analytics",
    primaryButton: {
      text: "Start your first project",
      comicBox: {
        title: "Analytics works best with Cycles + Modules",
        description:
          "First, timebox your issues into Cycles and, if you can, group issues that span more than a cycle into Modules. Check out both on the left nav.",
      },
    },
    accessType: "workspace",
    access: [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
  },
  [EmptyStateType.WORKSPACE_PROJECTS]: {
    key: EmptyStateType.WORKSPACE_PROJECTS,
    title: "No active projects",
    description:
      "Think of each project as the parent for goal-oriented work. Projects are where Jobs, Cycles, and Modules live and, along with your colleagues, help you achieve that goal. Create a new project or filter for archived projects.",
    path: "/empty-state/onboarding/projects",
    primaryButton: {
      text: "Start your first project",
      comicBox: {
        title: "Everything starts with a project in Plane",
        description: "A project could be a product’s roadmap, a marketing campaign, or launching a new car.",
      },
    },
    accessType: "workspace",
    access: [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
  },
  // all-issues
  [EmptyStateType.WORKSPACE_ALL_ISSUES]: {
    key: EmptyStateType.WORKSPACE_ALL_ISSUES,
    title: "No issues in the project",
    description: "First project done! Now, slice your work into trackable pieces with issues. Let's go!",
    path: "/empty-state/all-issues/all-issues",
    primaryButton: {
      text: "Create new issue",
    },
    accessType: "workspace",
    access: [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
  },
  [EmptyStateType.WORKSPACE_ASSIGNED]: {
    key: EmptyStateType.WORKSPACE_ASSIGNED,
    title: "No issues yet",
    description: "Issues assigned to you can be tracked from here.",
    path: "/empty-state/all-issues/assigned",
    primaryButton: {
      text: "Create new issue",
    },
    accessType: "workspace",
    access: [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
  },
  [EmptyStateType.WORKSPACE_CREATED]: {
    key: EmptyStateType.WORKSPACE_CREATED,
    title: "No issues yet",
    description: "All issues created by you come here, track them here directly.",
    path: "/empty-state/all-issues/created",
    primaryButton: {
      text: "Create new issue",
    },
    accessType: "workspace",
    access: [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
  },
  [EmptyStateType.WORKSPACE_SUBSCRIBED]: {
    key: EmptyStateType.WORKSPACE_SUBSCRIBED,
    title: "No issues yet",
    description: "Subscribe to issues you are interested in, track all of them here.",
    path: "/empty-state/all-issues/subscribed",
  },
  [EmptyStateType.WORKSPACE_CUSTOM_VIEW]: {
    key: EmptyStateType.WORKSPACE_CUSTOM_VIEW,
    title: "No issues yet",
    description: "Issues that applies to the filters, track all of them here.",
    path: "/empty-state/all-issues/custom-view",
  },
  [EmptyStateType.WORKSPACE_PROJECT_NOT_FOUND]: {
    key: EmptyStateType.WORKSPACE_PROJECT_NOT_FOUND,
    title: "No such project exists",
    description: "To create issues or manage your work, you need to create a project or be a part of one.",
    path: "/empty-state/onboarding/projects",
    primaryButton: {
      text: "Create Project",
      comicBox: {
        title: "Everything starts with a project in Plane",
        description: "A project could be a product’s roadmap, a marketing campaign, or launching a new car.",
      },
    },

    accessType: "workspace",
    access: [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
  },
  [EmptyStateType.WORKSPACE_NO_PROJECTS]: {
    key: EmptyStateType.WORKSPACE_NO_PROJECTS,
    title: "No project",
    description: "To create issues or manage your work, you need to create a project or be a part of one.",
    path: "/empty-state/onboarding/projects",
    primaryButton: {
      text: "Start your first project",
      comicBox: {
        title: "Everything starts with a project in Plane",
        description: "A project could be a product’s roadmap, a marketing campaign, or launching a new car.",
      },
    },
    accessType: "workspace",
    access: [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
  },
  // workspace settings
  [EmptyStateType.WORKSPACE_SETTINGS_API_TOKENS]: {
    key: EmptyStateType.WORKSPACE_SETTINGS_API_TOKENS,
    title: "No API tokens created",
    description:
      "Plane APIs can be used to integrate your data in Plane with any external system. Create a token to get started.",
    path: "/empty-state/workspace-settings/api-tokens",
  },
  [EmptyStateType.WORKSPACE_SETTINGS_WEBHOOKS]: {
    key: EmptyStateType.WORKSPACE_SETTINGS_WEBHOOKS,
    title: "No webhooks added",
    description: "Create webhooks to receive real-time updates and automate actions.",
    path: "/empty-state/workspace-settings/webhooks",
  },
  [EmptyStateType.WORKSPACE_SETTINGS_EXPORT]: {
    key: EmptyStateType.WORKSPACE_SETTINGS_EXPORT,
    title: "No previous exports yet",
    description: "Anytime you export, you will also have a copy here for reference.",
    path: "/empty-state/workspace-settings/exports",
  },
  [EmptyStateType.WORKSPACE_SETTINGS_IMPORT]: {
    key: EmptyStateType.WORKSPACE_SETTINGS_IMPORT,
    title: "No previous imports yet",
    description: "Find all your previous imports here and download them.",
    path: "/empty-state/workspace-settings/imports",
  },
  // profile
  [EmptyStateType.PROFILE_ACTIVITY]: {
    key: EmptyStateType.PROFILE_ASSIGNED,
    title: "No activities yet",
    description:
      "Get started by creating a new issue! Add details and properties to it. Explore more in Plane to see your activity.",
    path: "/empty-state/profile/activity",
  },
  [EmptyStateType.PROFILE_ASSIGNED]: {
    key: EmptyStateType.PROFILE_ASSIGNED,
    title: "No issues are assigned to you",
    description: "Issues assigned to you can be tracked from here.",
    path: "/empty-state/profile/assigned",
  },
  [EmptyStateType.PROFILE_CREATED]: {
    key: EmptyStateType.PROFILE_CREATED,
    title: "No issues yet",
    description: "All issues created by you come here, track them here directly.",
    path: "/empty-state/profile/created",
  },
  [EmptyStateType.PROFILE_SUBSCRIBED]: {
    key: EmptyStateType.PROFILE_SUBSCRIBED,
    title: "No issues yet",
    description: "Subscribe to issues you are interested in, track all of them here.",
    path: "/empty-state/profile/subscribed",
  },
  // project settings
  [EmptyStateType.PROJECT_SETTINGS_LABELS]: {
    key: EmptyStateType.PROJECT_SETTINGS_LABELS,
    title: "No labels yet",
    description: "Create labels to help organize and filter issues in you project.",
    path: "/empty-state/project-settings/labels",
  },
  [EmptyStateType.PROJECT_SETTINGS_INTEGRATIONS]: {
    key: EmptyStateType.PROJECT_SETTINGS_INTEGRATIONS,
    title: "No integrations configured",
    description: "Configure GitHub and other integrations to sync your project issues.",
    path: "/empty-state/project-settings/integrations",
  },
  [EmptyStateType.PROJECT_SETTINGS_ESTIMATE]: {
    key: EmptyStateType.PROJECT_SETTINGS_ESTIMATE,
    title: "No estimates added",
    description: "Create a set of estimates to communicate the amount of work per issue.",
    path: "/empty-state/project-settings/estimates",
  },
  // project cycles
  [EmptyStateType.PROJECT_CYCLES]: {
    key: EmptyStateType.PROJECT_CYCLES,
    title: "Group and timebox your work in Cycles.",
    description:
      "Break work down by timeboxed chunks, work backwards from your project deadline to set dates, and make tangible progress as a team.",
    path: "/empty-state/onboarding/cycles",
    primaryButton: {
      text: "Set your first cycle",
      comicBox: {
        title: "Cycles are repetitive time-boxes.",
        description:
          "A sprint, an iteration, and or any other term you use for weekly or fortnightly tracking of work is a cycle.",
      },
    },
    accessType: "project",
    access: [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
  },
  [EmptyStateType.PROJECT_CYCLE_NO_ISSUES]: {
    key: EmptyStateType.PROJECT_CYCLE_NO_ISSUES,
    title: "No issues added to the cycle",
    description: "Add or create issues you wish to timebox and deliver within this cycle",
    path: "/empty-state/cycle-issues/",
    primaryButton: {
      text: "Create new issue ",
    },
    secondaryButton: {
      text: "Add an existing issue",
    },
    accessType: "project",
    access: [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
  },
  [EmptyStateType.PROJECT_CYCLE_ACTIVE]: {
    key: EmptyStateType.PROJECT_CYCLE_ACTIVE,
    title: "No active cycle",
    description:
      "An active cycle includes any period that encompasses today's date within its range. Find the progress and details of the active cycle here.",
    path: "/empty-state/cycle/active",
  },
  [EmptyStateType.PROJECT_CYCLE_COMPLETED_NO_ISSUES]: {
    key: EmptyStateType.PROJECT_CYCLE_COMPLETED_NO_ISSUES,
    title: "No issues in the cycle",
    description:
      "No issues in the cycle. Issues are either transferred or hidden. To see hidden issues if any, update your display properties accordingly.",
    path: "/empty-state/cycle/completed-no-issues",
  },
  [EmptyStateType.PROJECT_ARCHIVED_NO_CYCLES]: {
    key: EmptyStateType.PROJECT_ARCHIVED_NO_CYCLES,
    title: "No archived cycles yet",
    description: "To tidy up your project, archive completed cycles. Find them here once archived.",
    path: "/empty-state/archived/empty-cycles",
  },
  [EmptyStateType.PROJECT_CYCLE_ALL]: {
    key: EmptyStateType.PROJECT_CYCLE_ALL,
    title: "No cycles",
    description:
      "An active cycle includes any period that encompasses today's date within its range. Find the progress and details of the active cycle here.",
    path: "/empty-state/cycle/active",
  },
  // empty filters
  [EmptyStateType.PROJECT_EMPTY_FILTER]: {
    key: EmptyStateType.PROJECT_EMPTY_FILTER,
    title: "No issues found matching the filters applied",
    path: "/empty-state/empty-filters/",
    secondaryButton: {
      text: "Clear all filters",
    },
    accessType: "project",
    access: [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
  },
  [EmptyStateType.PROJECT_ARCHIVED_EMPTY_FILTER]: {
    key: EmptyStateType.PROJECT_ARCHIVED_EMPTY_FILTER,
    title: "No issues found matching the filters applied",
    path: "/empty-state/empty-filters/",
    secondaryButton: {
      text: "Clear all filters",
    },
    accessType: "project",
    access: [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
  },
  //  project issues
  [EmptyStateType.PROJECT_NO_ISSUES]: {
    key: EmptyStateType.PROJECT_NO_ISSUES,
    title: "Create an issue and assign it to someone, even yourself",
    description:
      "Think of issues as jobs, tasks, work, or JTBD. Which we like. An issue and its sub-issues are usually time-based actionables assigned to members of your team. Your team creates, assigns, and completes issues to move your project towards its goal.",
    path: "/empty-state/onboarding/issues",
    primaryButton: {
      text: "Create your first issue",
      comicBox: {
        title: "Issues are building blocks in Plane.",
        description:
          "Redesign the Plane UI, Rebrand the company, or Launch the new fuel injection system are examples of issues that likely have sub-issues.",
      },
    },
    accessType: "project",
    access: [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
  },
  [EmptyStateType.PROJECT_ARCHIVED_NO_ISSUES]: {
    key: EmptyStateType.PROJECT_ARCHIVED_NO_ISSUES,
    title: "No archived issues yet",
    description:
      "Manually or through automation, you can archive issues that are completed or cancelled. Find them here once archived.",
    path: "/empty-state/archived/empty-issues",
    primaryButton: {
      text: "Set automation",
    },
    accessType: "project",
    access: [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
  },
  [EmptyStateType.VIEWS_EMPTY_SEARCH]: {
    key: EmptyStateType.VIEWS_EMPTY_SEARCH,
    title: "No matching views",
    description: "No views match the search criteria. \n Create a new view instead.",
    path: "/empty-state/search/views",
  },
  [EmptyStateType.PROJECTS_EMPTY_SEARCH]: {
    key: EmptyStateType.PROJECTS_EMPTY_SEARCH,
    title: "No matching projects",
    description: "No projects detected with the matching criteria. Create a new project instead.",
    path: "/empty-state/search/project",
  },
  [EmptyStateType.MEMBERS_EMPTY_SEARCH]: {
    key: EmptyStateType.MEMBERS_EMPTY_SEARCH,
    title: "No matching members",
    description: "Add them to the project if they are already a part of the workspace",
    path: "/empty-state/search/member",
  },
  [EmptyStateType.STICKIES]: {
    key: EmptyStateType.STICKIES,
    title: "Stickies are quick notes and to-dos you take down on the fly.",
    description:
      "Capture your thoughts and ideas effortlessly by creating stickies that you can access anytime and from anywhere.",
    path: "/empty-state/stickies/stickies",
    primaryButton: {
      icon: <Plus className="size-4" />,
      text: "Add sticky",
    },
    access: [EUserPermissions.ADMIN, EUserPermissions.MEMBER, EUserPermissions.GUEST],
    accessType: "workspace",
  },
  [EmptyStateType.STICKIES_SEARCH]: {
    key: EmptyStateType.STICKIES_SEARCH,
    title: "That doesn't match any of your stickies.",
    description: "Try a different term or let us know\nif you are sure your search is right. ",
    path: "/empty-state/stickies/stickies-search",
    primaryButton: {
      icon: <Plus className="size-4" />,
      text: "Add sticky",
    },
    access: [EUserPermissions.ADMIN, EUserPermissions.MEMBER, EUserPermissions.GUEST],
    accessType: "workspace",
  },
  [EmptyStateType.HOME_WIDGETS]: {
    key: EmptyStateType.HOME_WIDGETS,
    title: "It's Quiet Without Widgets, Turn Them On",
    description: "It looks like all your widgets are turned off. Enable them\nnow to enhance your experience!",
    path: "/empty-state/dashboard/widgets",
    primaryButton: {
      icon: <Shapes className="size-4" />,
      text: "Manage widgets",
    },
    access: [EUserPermissions.ADMIN, EUserPermissions.MEMBER, EUserPermissions.GUEST],
    accessType: "workspace",
  },
} as const;

export const EMPTY_STATE_DETAILS: Record<EmptyStateType, EmptyStateDetails> = emptyStateDetails;
