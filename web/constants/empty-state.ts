import { EUserProjectRoles } from "./project";
import { EUserWorkspaceRoles } from "./workspace";

export interface EmptyStateDetails {
  key: string;
  title?: string;
  description?: string;
  path?: string;
  primaryButton?: {
    icon?: any;
    text: string;
    comicBox?: {
      title?: string;
      description?: string;
    };
  };
  secondaryButton?: {
    icon?: any;
    text: string;
    comicBox?: {
      title?: string;
      description?: string;
    };
  };
  accessType?: "workspace" | "project";
  access?: EUserWorkspaceRoles | EUserProjectRoles;
}

export type EmptyStateKeys = keyof typeof emptyStateDetails;

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
  WORKSPACE_SETTINGS_API_TOKENS = "workspace-settings-api-tokens",
  WORKSPACE_SETTINGS_WEBHOOKS = "workspace-settings-webhooks",
  WORKSPACE_SETTINGS_EXPORT = "workspace-settings-export",
  WORKSPACE_SETTINGS_IMPORT = "workspace-settings-import",
  PROFILE_ASSIGNED = "profile-assigned",
  PROFILE_CREATED = "profile-created",
  PROFILE_SUBSCRIBED = "profile-subscribed",
  PROJECT_SETTINGS_LABELS = "project-settings-labels",
  PROJECT_SETTINGS_INTEGRATIONS = "project-settings-integrations",
  PROJECT_SETTINGS_ESTIMATE = "project-settings-estimate",
  PROJECT_CYCLES = "project-cycles",
  PROJECT_CYCLE_NO_ISSUES = "project-cycle-no-issues",
  PROJECT_CYCLE_ACTIVE = "project-cycle-active",
  PROJECT_CYCLE_UPCOMING = "project-cycle-upcoming",
  PROJECT_CYCLE_COMPLETED = "project-cycle-completed",
  PROJECT_CYCLE_DRAFT = "project-cycle-draft",
  PROJECT_EMPTY_FILTER = "project-empty-filter",
  PROJECT_ARCHIVED_EMPTY_FILTER = "project-archived-empty-filter",
  PROJECT_DRAFT_EMPTY_FILTER = "project-draft-empty-filter",
  PROJECT_NO_ISSUES = "project-no-issues",
  PROJECT_ARCHIVED_NO_ISSUES = "project-archived-no-issues",
  PROJECT_DRAFT_NO_ISSUES = "project-draft-no-issues",
  VIEWS_EMPTY_SEARCH = "views-empty-search",
  PROJECTS_EMPTY_SEARCH = "projects-empty-search",
  COMMANDK_EMPTY_SEARCH = "commandK-empty-search",
  MEMBERS_EMPTY_SEARCH = "members-empty-search",
  PROJECT_MODULE_ISSUES = "project-module-issues",
  PROJECT_MODULE = "project-module",
  PROJECT_VIEW = "project-view",
  PROJECT_PAGE = "project-page",
  PROJECT_PAGE_ALL = "project-page-all",
  PROJECT_PAGE_FAVORITE = "project-page-favorite",
  PROJECT_PAGE_PRIVATE = "project-page-private",
  PROJECT_PAGE_SHARED = "project-page-shared",
  PROJECT_PAGE_ARCHIVED = "project-page-archived",
  PROJECT_PAGE_RECENT = "project-page-recent",
}

const emptyStateDetails = {
  // workspace
  "workspace-dashboard": {
    key: "workspace-dashboard",
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
    access: EUserWorkspaceRoles.MEMBER,
  },
  "workspace-analytics": {
    key: "workspace-analytics",
    title: "Track progress, workloads, and allocations. Spot trends, remove blockers, and move work faster",
    description:
      "See scope versus demand, estimates, and scope creep. Get performance by team members and teams, and make sure your project runs on time.",
    path: "/empty-state/onboarding/analytics",
    primaryButton: {
      text: "Create Cycles and Modules first",
      comicBox: {
        title: "Analytics works best with Cycles + Modules",
        description:
          "First, timebox your issues into Cycles and, if you can, group issues that span more than a cycle into Modules. Check out both on the left nav.",
      },
    },
    accessType: "workspace",
    access: EUserWorkspaceRoles.MEMBER,
  },
  "workspace-projects": {
    key: "workspace-projects",
    title: "Start a Project",
    description:
      "Think of each project as the parent for goal-oriented work. Projects are where Jobs, Cycles, and Modules live and, along with your colleagues, help you achieve that goal.",
    path: "/empty-state/onboarding/projects",
    primaryButton: {
      text: "Start your first project",
      comicBox: {
        title: "Everything starts with a project in Plane",
        description: "A project could be a product’s roadmap, a marketing campaign, or launching a new car.",
      },
    },
    accessType: "workspace",
    access: EUserWorkspaceRoles.MEMBER,
  },
  // all-issues
  "workspace-all-issues": {
    key: "workspace-all-issues",
    title: "No issues in the project",
    description: "First project done! Now, slice your work into trackable pieces with issues. Let's go!",
    path: "/empty-state/all-issues/all-issues",
    primaryButton: {
      text: "Create new issue",
    },
    accessType: "workspace",
    access: EUserWorkspaceRoles.MEMBER,
  },
  "workspace-assigned": {
    key: "workspace-assigned",
    title: "No issues yet",
    description: "Issues assigned to you can be tracked from here.",
    path: "/empty-state/all-issues/assigned",
    primaryButton: {
      text: "Create new issue",
    },
    accessType: "workspace",
    access: EUserWorkspaceRoles.MEMBER,
  },
  "workspace-created": {
    key: "workspace-created",
    title: "No issues yet",
    description: "All issues created by you come here, track them here directly.",
    path: "/empty-state/all-issues/created",
    primaryButton: {
      text: "Create new issue",
    },
    accessType: "workspace",
    access: EUserWorkspaceRoles.MEMBER,
  },
  "workspace-subscribed": {
    key: "workspace-subscribed",
    title: "No issues yet",
    description: "Subscribe to issues you are interested in, track all of them here.",
    path: "/empty-state/all-issues/subscribed",
  },
  "workspace-custom-view": {
    key: "workspace-custom-view",
    title: "No issues yet",
    description: "Issues that applies to the filters, track all of them here.",
    path: "/empty-state/all-issues/custom-view",
  },
  "workspace-no-projects": {
    key: "workspace-no-projects",
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
    access: EUserWorkspaceRoles.MEMBER,
  },
  // workspace settings
  "workspace-settings-api-tokens": {
    key: "workspace-settings-api-tokens",
    title: "No API tokens created",
    description:
      "Plane APIs can be used to integrate your data in Plane with any external system. Create a token to get started.",
    path: "/empty-state/workspace-settings/api-tokens",
  },
  "workspace-settings-webhooks": {
    key: "workspace-settings-webhooks",
    title: "No webhooks added",
    description: "Create webhooks to receive real-time updates and automate actions.",
    path: "/empty-state/workspace-settings/webhooks",
  },
  "workspace-settings-export": {
    key: "workspace-settings-export",
    title: "No previous exports yet",
    description: "Anytime you export, you will also have a copy here for reference.",
    path: "/empty-state/workspace-settings/exports",
  },
  "workspace-settings-import": {
    key: "workspace-settings-import",
    title: "No previous imports yet",
    description: "Find all your previous imports here and download them.",
    path: "/empty-state/workspace-settings/imports",
  },
  // profile
  "profile-assigned": {
    key: "profile-assigned",
    title: "No issues are assigned to you",
    description: "Issues assigned to you can be tracked from here.",
    path: "/empty-state/profile/assigned",
  },
  "profile-created": {
    key: "profile-created",
    title: "No issues yet",
    description: "All issues created by you come here, track them here directly.",
    path: "/empty-state/profile/created",
  },
  "profile-subscribed": {
    key: "profile-subscribed",
    title: "No issues yet",
    description: "Subscribe to issues you are interested in, track all of them here.",
    path: "/empty-state/profile/subscribed",
  },
  // project settings
  "project-settings-labels": {
    key: "project-settings-labels",
    title: "No labels yet",
    description: "Create labels to help organize and filter issues in you project.",
    path: "/empty-state/project-settings/labels",
  },
  "project-settings-integrations": {
    key: "project-settings-integrations",
    title: "No integrations configured",
    description: "Configure GitHub and other integrations to sync your project issues.",
    path: "/empty-state/project-settings/integrations",
  },
  "project-settings-estimate": {
    key: "project-settings-estimate",
    title: "No estimates added",
    description: "Create a set of estimates to communicate the amount of work per issue.",
    path: "/empty-state/project-settings/estimates",
  },
  // project cycles
  "project-cycles": {
    key: "project-cycles",
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
    accessType: "workspace",
    access: EUserWorkspaceRoles.MEMBER,
  },
  "project-cycle-no-issues": {
    key: "project-cycle-no-issues",
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
    access: EUserProjectRoles.MEMBER,
  },
  "project-cycle-active": {
    key: "project-cycle-active",
    title: "No active cycles",
    description:
      "An active cycle includes any period that encompasses today's date within its range. Find the progress and details of the active cycle here.",
    path: "/empty-state/cycle/active",
  },
  "project-cycle-upcoming": {
    key: "project-cycle-upcoming",
    title: "No upcoming cycles",
    description: "Upcoming cycles on deck! Just add dates to cycles in draft, and they'll show up right here.",
    path: "/empty-state/cycle/upcoming",
  },
  "project-cycle-completed": {
    key: "project-cycle-completed",
    title: "No completed cycles",
    description: "Any cycle with a past due date is considered completed. Explore all completed cycles here.",
    path: "/empty-state/cycle/completed",
  },
  "project-cycle-draft": {
    key: "project-cycle-draft",
    title: "No draft cycles",
    description: "No dates added in cycles? Find them here as drafts.",
    path: "/empty-state/cycle/draft",
  },
  // empty filters
  "project-empty-filter": {
    key: "project-empty-filter",
    title: "No issues found matching the filters applied",
    path: "/empty-state/empty-filters/",
    secondaryButton: {
      text: "Clear all filters",
    },
    accessType: "project",
    access: EUserProjectRoles.MEMBER,
  },
  "project-archived-empty-filter": {
    key: "project-archived-empty-filter",
    title: "No issues found matching the filters applied",
    path: "/empty-state/empty-filters/",
    secondaryButton: {
      text: "Clear all filters",
    },
    accessType: "project",
    access: EUserProjectRoles.MEMBER,
  },
  "project-draft-empty-filter": {
    key: "project-draft-empty-filter",
    title: "No issues found matching the filters applied",
    path: "/empty-state/empty-filters/",
    secondaryButton: {
      text: "Clear all filters",
    },
    accessType: "project",
    access: EUserProjectRoles.MEMBER,
  },
  //  project issues
  "project-no-issues": {
    key: "project-no-issues",
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
    access: EUserProjectRoles.MEMBER,
  },
  "project-archived-no-issues": {
    key: "project-archived-no-issues",
    title: "No archived issues yet",
    description:
      "Archived issues help you remove issues you completed or cancelled from focus. You can set automation to auto archive issues and find them here.",
    path: "/empty-state/archived/empty-issues",
    primaryButton: {
      text: "Set automation",
    },
    accessType: "project",
    access: EUserProjectRoles.MEMBER,
  },
  "project-draft-no-issues": {
    key: "project-draft-no-issues",
    title: "No draft issues yet",
    description:
      "Quickly stepping away but want to keep your place? No worries – save a draft now. Your issues will be right here waiting for you.",
    path: "/empty-state/draft/draft-issues-empty",
  },
  "views-empty-search": {
    key: "views-empty-search",
    title: "No matching views",
    description: "No views match the search criteria. Create a new view instead.",
    path: "/empty-state/search/search",
  },
  "projects-empty-search": {
    key: "projects-empty-search",
    title: "No matching projects",
    description: "No projects detected with the matching criteria. Create a new project instead.",
    path: "/empty-state/search/project",
  },
  "commandK-empty-search": {
    key: "commandK-empty-search",
    title: "No results found. ",
    path: "/empty-state/search/search",
  },
  "members-empty-search": {
    key: "members-empty-search",
    title: "No matching members",
    description: "Add them to the project if they are already a part of the workspace",
    path: "/empty-state/search/member",
  },
  // project module
  "project-module-issues": {
    key: "project-modules-issues",
    title: "No issues in the module",
    description: "Create or add issues which you want to accomplish as part of this module",
    path: "/empty-state/module-issues/",
    primaryButton: {
      text: "Create new issue ",
    },
    secondaryButton: {
      text: "Add an existing issue",
    },
    accessType: "project",
    access: EUserProjectRoles.MEMBER,
  },
  "project-module": {
    key: "project-module",
    title: "Map your project milestones to Modules and track aggregated work easily.",
    description:
      "A group of issues that belong to a logical, hierarchical parent form a module. Think of them as a way to track work by project milestones. They have their own periods and deadlines as well as analytics to help you see how close or far you are from a milestone.",
    path: "/empty-state/onboarding/modules",
    primaryButton: {
      text: "Build your first module",
      comicBox: {
        title: "Modules help group work by hierarchy.",
        description: "A cart module, a chassis module, and a warehouse module are all good example of this grouping.",
      },
    },
    accessType: "project",
    access: EUserProjectRoles.MEMBER,
  },
  // project views
  "project-view": {
    key: "project-view",
    title: "Save filtered views for your project. Create as many as you need",
    description:
      "Views are a set of saved filters that you use frequently or want easy access to. All your colleagues in a project can see everyone’s views and choose whichever suits their needs best.",
    path: "/empty-state/onboarding/views",
    primaryButton: {
      text: "Create your first view",
      comicBox: {
        title: "Views work atop Issue properties.",
        description: "You can create a view from here with as many properties as filters as you see fit.",
      },
    },
    accessType: "project",
    access: EUserProjectRoles.MEMBER,
  },
  // project pages
  "project-page": {
    key: "pages",
    title: "Write a note, a doc, or a full knowledge base. Get Galileo, Plane’s AI assistant, to help you get started",
    description:
      "Pages are thoughts potting space in Plane. Take down meeting notes, format them easily, embed issues, lay them out using a library of components, and keep them all in your project’s context. To make short work of any doc, invoke Galileo, Plane’s AI, with a shortcut or the click of a button.",
    path: "/empty-state/onboarding/pages",
    primaryButton: {
      text: "Create your first page",
      comicBox: {
        title: "A page can be a doc or a doc of docs.",
        description:
          "We wrote Nikhil and Meera’s love story. You could write your project’s mission, goals, and eventual vision.",
      },
    },
    accessType: "project",
    access: EUserProjectRoles.MEMBER,
  },
  "project-page-all": {
    key: "project-page-all",
    title: "Write a note, a doc, or a full knowledge base",
    description:
      "Pages help you organise your thoughts to create wikis, discussions or even document heated takes for your project. Use it wisely!",
    path: "/empty-state/pages/all",
  },
  "project-page-favorite": {
    key: "project-page-favorite",
    title: "No favorite pages yet",
    description: "Favorites for quick access? mark them and find them right here.",
    path: "/empty-state/pages/favorites",
  },
  "project-page-private": {
    key: "project-page-private",
    title: "No private pages yet",
    description: "Keep your private thoughts here. When you're ready to share, the team's just a click away.",
    path: "/empty-state/pages/private",
  },
  "project-page-shared": {
    key: "project-page-shared",
    title: "No shared pages yet",
    description: "See pages shared with everyone in your project right here.",
    path: "/empty-state/pages/shared",
  },
  "project-page-archived": {
    key: "project-page-archived",
    title: "No archived pages yet",
    description: "Archive pages not on your radar. Access them here when needed.",
    path: "/empty-state/pages/archived",
  },
  "project-page-recent": {
    key: "project-page-recent",
    title: "Write a note, a doc, or a full knowledge base",
    description:
      "Pages help you organise your thoughts to create wikis, discussions or even document heated takes for your project. Use it wisely! Pages will be sorted and grouped by last updated",
    path: "/empty-state/pages/recent",
    primaryButton: {
      text: "Create new page",
    },
    accessType: "project",
    access: EUserProjectRoles.MEMBER,
  },
} as const;

export const EMPTY_STATE_DETAILS: Record<EmptyStateKeys, EmptyStateDetails> = emptyStateDetails;
