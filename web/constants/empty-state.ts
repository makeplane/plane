import { EUserProjectRoles } from "./project";
import { EUserWorkspaceRoles } from "./workspace";

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
  access?: EUserWorkspaceRoles | EUserProjectRoles;
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
  PROJECT_CYCLE_ALL = "project-cycle-all",
  PROJECT_CYCLE_COMPLETED_NO_ISSUES = "project-cycle-completed-no-issues",
  PROJECT_ARCHIVED_NO_CYCLES = "project-archived-no-cycles",
  PROJECT_EMPTY_FILTER = "project-empty-filter",
  PROJECT_ARCHIVED_EMPTY_FILTER = "project-archived-empty-filter",
  PROJECT_DRAFT_EMPTY_FILTER = "project-draft-empty-filter",
  PROJECT_NO_ISSUES = "project-no-issues",
  PROJECT_ARCHIVED_NO_ISSUES = "project-archived-no-issues",
  PROJECT_DRAFT_NO_ISSUES = "project-draft-no-issues",
  VIEWS_EMPTY_SEARCH = "views-empty-search",
  PROJECTS_EMPTY_SEARCH = "projects-empty-search",
  MEMBERS_EMPTY_SEARCH = "members-empty-search",
  PROJECT_MODULE_ISSUES = "project-module-issues",
  PROJECT_MODULE = "project-module",
  PROJECT_ARCHIVED_NO_MODULES = "project-archived-no-modules",
  PROJECT_VIEW = "project-view",
  PROJECT_PAGE = "project-page",
  PROJECT_PAGE_PRIVATE = "project-page-private",
  PROJECT_PAGE_PUBLIC = "project-page-public",
  PROJECT_PAGE_ARCHIVED = "project-page-archived",

  COMMAND_K_SEARCH_EMPTY_STATE = "command-k-search-empty-state",
  ISSUE_RELATION_SEARCH_EMPTY_STATE = "issue-relation-search-empty-state",
  ISSUE_RELATION_EMPTY_STATE = "issue-relation-empty-state",
  ISSUE_COMMENT_EMPTY_STATE = "issue-comment-empty-state",

  NOTIFICATION_MY_ISSUE_EMPTY_STATE = "notification-my-issues-empty-state",
  NOTIFICATION_CREATED_EMPTY_STATE = "notification-created-empty-state",
  NOTIFICATION_SUBSCRIBED_EMPTY_STATE = "notification-subscribed-empty-state",
  NOTIFICATION_ARCHIVED_EMPTY_STATE = "notification-archived-empty-state",
  NOTIFICATION_SNOOZED_EMPTY_STATE = "notification-snoozed-empty-state",
  NOTIFICATION_UNREAD_EMPTY_STATE = "notification-unread-empty-state",

  ACTIVE_CYCLE_PROGRESS_EMPTY_STATE = "active-cycle-progress-empty-state",
  ACTIVE_CYCLE_CHART_EMPTY_STATE = "active-cycle-chart-empty-state",
  ACTIVE_CYCLE_PRIORITY_ISSUE_EMPTY_STATE = "active-cycle-priority-issue-empty-state",
  ACTIVE_CYCLE_ASSIGNEE_EMPTY_STATE = "active-cycle-assignee-empty-state",
  ACTIVE_CYCLE_LABEL_EMPTY_STATE = "active-cycle-label-empty-state",

  DISABLED_PROJECT_INBOX = "disabled-project-inbox",
  DISABLED_PROJECT_CYCLE = "disabled-project-cycle",
  DISABLED_PROJECT_MODULE = "disabled-project-module",
  DISABLED_PROJECT_VIEW = "disabled-project-view",
  DISABLED_PROJECT_PAGE = "disabled-project-page",

  INBOX_SIDEBAR_OPEN_TAB = "inbox-sidebar-open-tab",
  INBOX_SIDEBAR_CLOSED_TAB = "inbox-sidebar-closed-tab",
  INBOX_SIDEBAR_FILTER_EMPTY_STATE = "inbox-sidebar-filter-empty-state",
  INBOX_DETAIL_EMPTY_STATE = "inbox-detail-empty-state",
}

const emptyStateDetails = {
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
    access: EUserWorkspaceRoles.MEMBER,
  },
  [EmptyStateType.WORKSPACE_ANALYTICS]: {
    key: EmptyStateType.WORKSPACE_ANALYTICS,
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
    access: EUserWorkspaceRoles.MEMBER,
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
    access: EUserWorkspaceRoles.MEMBER,
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
    access: EUserWorkspaceRoles.MEMBER,
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
    access: EUserWorkspaceRoles.MEMBER,
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
    access: EUserWorkspaceRoles.MEMBER,
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
    access: EUserProjectRoles.MEMBER,
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
    access: EUserProjectRoles.MEMBER,
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
    access: EUserProjectRoles.MEMBER,
  },
  [EmptyStateType.PROJECT_ARCHIVED_EMPTY_FILTER]: {
    key: EmptyStateType.PROJECT_ARCHIVED_EMPTY_FILTER,
    title: "No issues found matching the filters applied",
    path: "/empty-state/empty-filters/",
    secondaryButton: {
      text: "Clear all filters",
    },
    accessType: "project",
    access: EUserProjectRoles.MEMBER,
  },
  [EmptyStateType.PROJECT_DRAFT_EMPTY_FILTER]: {
    key: EmptyStateType.PROJECT_DRAFT_EMPTY_FILTER,
    title: "No issues found matching the filters applied",
    path: "/empty-state/empty-filters/",
    secondaryButton: {
      text: "Clear all filters",
    },
    accessType: "project",
    access: EUserProjectRoles.MEMBER,
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
    access: EUserProjectRoles.MEMBER,
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
    access: EUserProjectRoles.MEMBER,
  },
  [EmptyStateType.PROJECT_DRAFT_NO_ISSUES]: {
    key: EmptyStateType.PROJECT_DRAFT_NO_ISSUES,
    title: "No draft issues yet",
    description:
      "Quickly stepping away but want to keep your place? No worries – save a draft now. Your issues will be right here waiting for you.",
    path: "/empty-state/draft/draft-issues-empty",
  },
  [EmptyStateType.VIEWS_EMPTY_SEARCH]: {
    key: EmptyStateType.VIEWS_EMPTY_SEARCH,
    title: "No matching views",
    description: "No views match the search criteria. Create a new view instead.",
    path: "/empty-state/search/search",
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
  // project module
  [EmptyStateType.PROJECT_MODULE_ISSUES]: {
    key: EmptyStateType.PROJECT_MODULE_ISSUES,
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
  [EmptyStateType.PROJECT_MODULE]: {
    key: EmptyStateType.PROJECT_MODULE,
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
  [EmptyStateType.PROJECT_ARCHIVED_NO_MODULES]: {
    key: EmptyStateType.PROJECT_ARCHIVED_NO_MODULES,
    title: "No archived Modules yet",
    description: "To tidy up your project, archive completed or cancelled modules. Find them here once archived.",
    path: "/empty-state/archived/empty-modules",
  },
  // project views
  [EmptyStateType.PROJECT_VIEW]: {
    key: EmptyStateType.PROJECT_VIEW,
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
  [EmptyStateType.PROJECT_PAGE]: {
    key: EmptyStateType.PROJECT_PAGE,
    title: "Write a note, a doc, or a full knowledge base. Get Galileo, Plane’s AI assistant, to help you get started",
    description:
      "Pages are thoughts potting space in Plane. Take down meeting notes, format them easily, embed issues, lay them out using a library of components, and keep them all in your project’s context. To make short work of any doc, invoke Galileo, Plane’s AI, with a shortcut or the click of a button.",
    path: "/empty-state/onboarding/pages",
    primaryButton: {
      text: "Create your first page",
    },
    accessType: "project",
    access: EUserProjectRoles.MEMBER,
  },
  [EmptyStateType.PROJECT_PAGE_PRIVATE]: {
    key: EmptyStateType.PROJECT_PAGE_PRIVATE,
    title: "No private pages yet",
    description: "Keep your private thoughts here. When you're ready to share, the team's just a click away.",
    path: "/empty-state/pages/private",
    primaryButton: {
      text: "Create your first page",
    },
    accessType: "project",
    access: EUserProjectRoles.MEMBER,
  },
  [EmptyStateType.PROJECT_PAGE_PUBLIC]: {
    key: EmptyStateType.PROJECT_PAGE_PUBLIC,
    title: "No public pages yet",
    description: "See pages shared with everyone in your project right here.",
    path: "/empty-state/pages/public",
    primaryButton: {
      text: "Create your first page",
    },
    accessType: "project",
    access: EUserProjectRoles.MEMBER,
  },
  [EmptyStateType.PROJECT_PAGE_ARCHIVED]: {
    key: EmptyStateType.PROJECT_PAGE_ARCHIVED,
    title: "No archived pages yet",
    description: "Archive pages not on your radar. Access them here when needed.",
    path: "/empty-state/pages/archived",
  },

  [EmptyStateType.COMMAND_K_SEARCH_EMPTY_STATE]: {
    key: EmptyStateType.COMMAND_K_SEARCH_EMPTY_STATE,
    title: "No results found",
    path: "/empty-state/search/search",
  },
  [EmptyStateType.ISSUE_RELATION_SEARCH_EMPTY_STATE]: {
    key: EmptyStateType.ISSUE_RELATION_SEARCH_EMPTY_STATE,
    title: "No maching issues found",
    path: "/empty-state/search/search",
  },
  [EmptyStateType.ISSUE_RELATION_EMPTY_STATE]: {
    key: EmptyStateType.ISSUE_RELATION_EMPTY_STATE,
    title: "No issues found",
    path: "/empty-state/search/issues",
  },
  [EmptyStateType.ISSUE_COMMENT_EMPTY_STATE]: {
    key: EmptyStateType.ISSUE_COMMENT_EMPTY_STATE,
    title: "No comments yet",
    description: "Comments can be used as a discussion and \n follow-up space for the issues",
    path: "/empty-state/search/comments",
  },

  [EmptyStateType.NOTIFICATION_MY_ISSUE_EMPTY_STATE]: {
    key: EmptyStateType.NOTIFICATION_MY_ISSUE_EMPTY_STATE,
    title: "No issues assigned",
    description: "Updates for issues assigned to you can be \n seen here",
    path: "/empty-state/search/notification",
  },

  [EmptyStateType.NOTIFICATION_CREATED_EMPTY_STATE]: {
    key: EmptyStateType.NOTIFICATION_CREATED_EMPTY_STATE,
    title: "No updates to issues",
    description: "Updates to issues created by you can be \n seen here",
    path: "/empty-state/search/notification",
  },
  [EmptyStateType.NOTIFICATION_SUBSCRIBED_EMPTY_STATE]: {
    key: EmptyStateType.NOTIFICATION_SUBSCRIBED_EMPTY_STATE,
    title: "No updates to issues",
    description: "Updates to any issue you are \n subscribed to can be seen here",
    path: "/empty-state/search/notification",
  },
  [EmptyStateType.NOTIFICATION_UNREAD_EMPTY_STATE]: {
    key: EmptyStateType.NOTIFICATION_UNREAD_EMPTY_STATE,
    title: "No unread notifications",
    description: "Congratulations, you are up-to-date \n with everything happening in the issues \n you care about",
    path: "/empty-state/search/notification",
  },
  [EmptyStateType.NOTIFICATION_SNOOZED_EMPTY_STATE]: {
    key: EmptyStateType.NOTIFICATION_SNOOZED_EMPTY_STATE,
    title: "No snoozed notifications yet",
    description: "Any notification you snooze for later will \n be available here to act upon",
    path: "/empty-state/search/snooze",
  },
  [EmptyStateType.NOTIFICATION_ARCHIVED_EMPTY_STATE]: {
    key: EmptyStateType.NOTIFICATION_ARCHIVED_EMPTY_STATE,
    title: "No archived notifications yet",
    description: "Any notification you archive will be \n available here to help you focus",
    path: "/empty-state/search/archive",
  },
  [EmptyStateType.ACTIVE_CYCLE_PROGRESS_EMPTY_STATE]: {
    key: EmptyStateType.ACTIVE_CYCLE_PROGRESS_EMPTY_STATE,
    title: "Add issues to the cycle to view it's \n progress",
    path: "/empty-state/active-cycle/progress",
  },
  [EmptyStateType.ACTIVE_CYCLE_CHART_EMPTY_STATE]: {
    key: EmptyStateType.ACTIVE_CYCLE_CHART_EMPTY_STATE,
    title: "Add issues to the cycle to view the \n burndown chart.",
    path: "/empty-state/active-cycle/chart",
  },
  [EmptyStateType.ACTIVE_CYCLE_PRIORITY_ISSUE_EMPTY_STATE]: {
    key: EmptyStateType.ACTIVE_CYCLE_PRIORITY_ISSUE_EMPTY_STATE,
    title: "Observe high priority issues tackled in \n the cycle at a glance.",
    path: "/empty-state/active-cycle/priority",
  },
  [EmptyStateType.ACTIVE_CYCLE_ASSIGNEE_EMPTY_STATE]: {
    key: EmptyStateType.ACTIVE_CYCLE_ASSIGNEE_EMPTY_STATE,
    title: "Add assignees to issues to see a \n breakdown of work by assignees.",
    path: "/empty-state/active-cycle/assignee",
  },
  [EmptyStateType.ACTIVE_CYCLE_LABEL_EMPTY_STATE]: {
    key: EmptyStateType.ACTIVE_CYCLE_LABEL_EMPTY_STATE,
    title: "Add labels to issues to see the \n breakdown of work by labels.",
    path: "/empty-state/active-cycle/label",
  },
  [EmptyStateType.DISABLED_PROJECT_INBOX]: {
    key: EmptyStateType.DISABLED_PROJECT_INBOX,
    title: "Inbox is not enabled for the project.",
    description:
      "Inbox helps you manage incoming requests to your project and add them as issues in your workflow. Enable inbox \n from project settings to manage requests.",
    accessType: "project",
    access: EUserProjectRoles.ADMIN,
    path: "/empty-state/disabled-feature/inbox",
    primaryButton: {
      text: "Manage features",
    },
  },
  [EmptyStateType.DISABLED_PROJECT_CYCLE]: {
    key: EmptyStateType.DISABLED_PROJECT_CYCLE,
    title: "Cycles is not enabled for this project.",
    description:
      "Break work down by timeboxed chunks, work backwards from your project deadline to set dates, and make tangible progress as a team. Enable the cycles feature for your project to start using them.",
    accessType: "project",
    access: EUserProjectRoles.ADMIN,
    path: "/empty-state/disabled-feature/cycles",
    primaryButton: {
      text: "Manage features",
    },
  },
  [EmptyStateType.DISABLED_PROJECT_MODULE]: {
    key: EmptyStateType.DISABLED_PROJECT_MODULE,
    title: "Modules are not enabled for the project.",
    description:
      "A group of issues that belong to a logical, hierarchical parent form a module. Think of them as a way to track work by project milestones. Enable modules from project settings.",
    accessType: "project",
    access: EUserProjectRoles.ADMIN,
    path: "/empty-state/disabled-feature/modules",
    primaryButton: {
      text: "Manage features",
    },
  },
  [EmptyStateType.DISABLED_PROJECT_PAGE]: {
    key: EmptyStateType.DISABLED_PROJECT_PAGE,
    title: "Pages are not enabled for the project.",
    description:
      "Pages are thought spotting space in Plane. Take down meeting notes, format them easily, embed issues, lay them out using a library of components, and keep them all in your project’s context. Enable the pages feature to start creating them in your project.",
    accessType: "project",
    access: EUserProjectRoles.ADMIN,
    path: "/empty-state/disabled-feature/pages",
    primaryButton: {
      text: "Manage features",
    },
  },
  [EmptyStateType.DISABLED_PROJECT_VIEW]: {
    key: EmptyStateType.DISABLED_PROJECT_VIEW,
    title: "Views is not enabled for this project.",
    description:
      "Views are a set of saved filters that you use frequently or want easy access to. All your colleagues in a project can see everyone’s views and choose whichever suits their needs best. Enable views in the project settings to start using them.",
    accessType: "project",
    access: EUserProjectRoles.ADMIN,
    path: "/empty-state/disabled-feature/views",
    primaryButton: {
      text: "Manage features",
    },
  },
  [EmptyStateType.INBOX_SIDEBAR_OPEN_TAB]: {
    key: EmptyStateType.INBOX_SIDEBAR_OPEN_TAB,
    title: "No open issues",
    description: "Find open issues here. Create new issue.",
    path: "/empty-state/inbox/inbox-issue",
  },
  [EmptyStateType.INBOX_SIDEBAR_CLOSED_TAB]: {
    key: EmptyStateType.INBOX_SIDEBAR_CLOSED_TAB,
    title: "No closed issues",
    description: "All the issues whether accepted or \n declined can be found here.",
    path: "/empty-state/inbox/inbox-issue",
  },
  [EmptyStateType.INBOX_SIDEBAR_FILTER_EMPTY_STATE]: {
    key: EmptyStateType.INBOX_SIDEBAR_FILTER_EMPTY_STATE,
    title: "No  matching issues",
    description: "No issue matches filter applied in inbox. \n Create a new issue.",
    path: "/empty-state/inbox/filter-issue",
  },
  [EmptyStateType.INBOX_DETAIL_EMPTY_STATE]: {
    key: EmptyStateType.INBOX_DETAIL_EMPTY_STATE,
    title: "Select an issue to view its details.",
    path: "/empty-state/inbox/issue-detail",
  },
} as const;

export const EMPTY_STATE_DETAILS: Record<EmptyStateType, EmptyStateDetails> = emptyStateDetails;
