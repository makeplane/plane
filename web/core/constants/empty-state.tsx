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
  // empty filters
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
