// workspace empty state
export const WORKSPACE_EMPTY_STATE_DETAILS = {
  dashboard: {
    title: "Overview of your projects, activity, and metrics",
    description:
      " Welcome to Plane, we are excited to have you here. Create your first project and track your issues, and this page will transform into a space that helps you progress. Admins will also see items which help their team progress.",
    primaryButton: {
      text: "Build your first project",
    },
    comicBox: {
      title: "Everything starts with a project in Plane",
      description: "A project could be a product’s roadmap, a marketing campaign, or launching a new car.",
    },
  },
  analytics: {
    title: "Track progress, workloads, and allocations. Spot trends, remove blockers, and move work faster",
    description:
      "See scope versus demand, estimates, and scope creep. Get performance by team members and teams, and make sure your project runs on time.",
    primaryButton: {
      text: "Create Cycles and Modules first",
    },
    comicBox: {
      title: "Analytics works best with Cycles + Modules",
      description:
        "First, timebox your issues into Cycles and, if you can, group issues that span more than a cycle into Modules. Check out both on the left nav.",
    },
  },
  projects: {
    title: "Start a Project",
    description:
      "Think of each project as the parent for goal-oriented work. Projects are where Jobs, Cycles, and Modules live and, along with your colleagues, help you achieve that goal.",
    primaryButton: {
      text: "Start your first project",
    },
    comicBox: {
      title: "Everything starts with a project in Plane",
      description: "A project could be a product’s roadmap, a marketing campaign, or launching a new car.",
    },
  },
  "assigned-notification": {
    key: "assigned-notification",
    title: "No issues assigned",
    description: "Updates for issues assigned to you can be seen here",
  },
  "created-notification": {
    key: "created-notification",
    title: "No updates to issues",
    description: "Updates to issues created by you can be seen here",
  },
  "subscribed-notification": {
    key: "subscribed-notification",
    title: "No updates to issues",
    description: "Updates to any issue you are subscribed to can be seen here",
  },
};

export const ALL_ISSUES_EMPTY_STATE_DETAILS = {
  "all-issues": {
    key: "all-issues",
    title: "No issues in the project",
    description: "First project done! Now, slice your work into trackable pieces with issues. Let's go!",
  },
  assigned: {
    key: "assigned",
    title: "No issues yet",
    description: "Issues assigned to you can be tracked from here.",
  },
  created: {
    key: "created",
    title: "No issues yet",
    description: "All issues created by you come here, track them here directly.",
  },
  subscribed: {
    key: "subscribed",
    title: "No issues yet",
    description: "Subscribe to issues you are interested in, track all of them here.",
  },
  "custom-view": {
    key: "custom-view",
    title: "No issues yet",
    description: "Issues that applies to the filters, track all of them here.",
  },
};

export const SEARCH_EMPTY_STATE_DETAILS = {
  views: {
    key: "views",
    title: "No matching views",
    description: "No views match the search criteria. Create a new view instead.",
  },
  projects: {
    key: "projects",
    title: "No matching projects",
    description: "No projects detected with the matching criteria. Create a new project instead.",
  },
  commandK: {
    key: "commandK",
    title: "No results found. ",
  },
  members: {
    key: "members",
    title: "No matching members",
    description: "Add them to the project if they are already a part of the workspace",
  },
};

export const WORKSPACE_SETTINGS_EMPTY_STATE_DETAILS = {
  "api-tokens": {
    key: "api-tokens",
    title: "No API tokens created",
    description:
      "Plane APIs can be used to integrate your data in Plane with any external system. Create a token to get started.",
  },
  webhooks: {
    key: "webhooks",
    title: "No webhooks added",
    description: "Create webhooks to receive real-time updates and automate actions.",
  },
  export: {
    key: "export",
    title: "No previous exports yet",
    description: "Anytime you export, you will also have a copy here for reference.",
  },
  import: {
    key: "export",
    title: "No previous imports yet",
    description: "Find all your previous imports here and download them.",
  },
};

//  profile empty state
export const PROFILE_EMPTY_STATE_DETAILS = {
  assigned: {
    key: "assigned",
    title: "No issues are assigned to you",
    description: "Issues assigned to you can be tracked from here.",
  },
  subscribed: {
    key: "created",
    title: "No issues yet",
    description: "All issues created by you come here, track them here directly.",
  },
  created: {
    key: "subscribed",
    title: "No issues yet",
    description: "Subscribe to issues you are interested in, track all of them here.",
  },
};

// project empty state

export const PROJECT_SETTINGS_EMPTY_STATE_DETAILS = {
  labels: {
    key: "labels",
    title: "No labels yet",
    description: "Create labels to help organize and filter issues in you project.",
  },
  integrations: {
    key: "integrations",
    title: "No integrations configured",
    description: "Configure GitHub and other integrations to sync your project issues.",
  },
  estimate: {
    key: "estimate",
    title: "No estimates added",
    description: "Create a set of estimates to communicate the amount of work per issue.",
  },
};

export const CYCLE_EMPTY_STATE_DETAILS = {
  cycles: {
    title: "Group and timebox your work in Cycles.",
    description:
      "Break work down by timeboxed chunks, work backwards from your project deadline to set dates, and make tangible progress as a team.",
    comicBox: {
      title: "Cycles are repetitive time-boxes.",
      description:
        "A sprint, an iteration, and or any other term you use for weekly or fortnightly tracking of work is a cycle.",
    },
    primaryButton: {
      text: "Set your first cycle",
    },
  },
  "no-issues": {
    key: "no-issues",
    title: "No issues added to the cycle",
    description: "Add or create issues you wish to timebox and deliver within this cycle",
    primaryButton: {
      text: "Create new issue ",
    },
    secondaryButton: {
      text: "Add an existing issue",
    },
  },
  active: {
    key: "active",
    title: "No active cycles",
    description:
      "An active cycle includes any period that encompasses today's date within its range. Find the progress and details of the active cycle here.",
  },
  upcoming: {
    key: "upcoming",
    title: "No upcoming cycles",
    description: "Upcoming cycles on deck! Just add dates to cycles in draft, and they'll show up right here.",
  },
  completed: {
    key: "completed",
    title: "No completed cycles",
    description: "Any cycle with a past due date is considered completed. Explore all completed cycles here.",
  },
  draft: {
    key: "draft",
    title: "No draft cycles",
    description: "No dates added in cycles? Find them here as drafts.",
  },
};

export const EMPTY_FILTER_STATE_DETAILS = {
  archived: {
    key: "archived",
    title: "No issues found matching the filters applied",
    secondaryButton: {
      text: "Clear all filters",
    },
  },
  draft: {
    key: "draft",
    title: "No issues found matching the filters applied",
    secondaryButton: {
      text: "Clear all filters",
    },
  },
  project: {
    key: "project",
    title: "No issues found matching the filters applied",
    secondaryButton: {
      text: "Clear all filters",
    },
  },
};

export const EMPTY_ISSUE_STATE_DETAILS = {
  archived: {
    key: "archived",
    title: "No archived issues yet",
    description:
      "Archived issues help you remove issues you completed or cancelled from focus. You can set automation to auto archive issues and find them here.",
    primaryButton: {
      text: "Set Automation",
    },
  },
  draft: {
    key: "draft",
    title: "No draft issues yet",
    description:
      "Quickly stepping away but want to keep your place? No worries – save a draft now. Your issues will be right here waiting for you.",
  },
  project: {
    key: "project",
    title: "Create an issue and assign it to someone, even yourself",
    description:
      "Think of issues as jobs, tasks, work, or JTBD. Which we like. An issue and its sub-issues are usually time-based actionables assigned to members of your team. Your team creates, assigns, and completes issues to move your project towards its goal.",
    comicBox: {
      title: "Issues are building blocks in Plane.",
      description:
        "Redesign the Plane UI, Rebrand the company, or Launch the new fuel injection system are examples of issues that likely have sub-issues.",
    },
    primaryButton: {
      text: "Create your first issue",
    },
  },
};

export const MODULE_EMPTY_STATE_DETAILS = {
  "no-issues": {
    key: "no-issues",
    title: "No issues in the module",
    description: "Create or add issues which you want to accomplish as part of this module",
    primaryButton: {
      text: "Create new issue ",
    },
    secondaryButton: {
      text: "Add an existing issue",
    },
  },
  modules: {
    title: "Map your project milestones to Modules and track aggregated work easily.",
    description:
      "A group of issues that belong to a logical, hierarchical parent form a module. Think of them as a way to track work by project milestones. They have their own periods and deadlines as well as analytics to help you see how close or far you are from a milestone.",

    comicBox: {
      title: "Modules help group work by hierarchy.",
      description: "A cart module, a chassis module, and a warehouse module are all good example of this grouping.",
    },
    primaryButton: {
      text: "Build your first module",
    },
  },
};

export const VIEW_EMPTY_STATE_DETAILS = {
  "project-views": {
    title: "Save filtered views for your project. Create as many as you need",
    description:
      "Views are a set of saved filters that you use frequently or want easy access to. All your colleagues in a project can see everyone’s views and choose whichever suits their needs best.",
    comicBox: {
      title: "Views work atop Issue properties.",
      description: "You can create a view from here with as many properties as filters as you see fit.",
    },
    primaryButton: {
      text: "Create your first view",
    },
  },
};

export const PAGE_EMPTY_STATE_DETAILS = {
  pages: {
    key: "pages",
    title: "Write a note, a doc, or a full knowledge base. Get Galileo, Plane’s AI assistant, to help you get started",
    description:
      "Pages are thoughts potting space in Plane. Take down meeting notes, format them easily, embed issues, lay them out using a library of components, and keep them all in your project’s context. To make short work of any doc, invoke Galileo, Plane’s AI, with a shortcut or the click of a button.",
    primaryButton: {
      text: "Create your first page",
    },
    comicBox: {
      title: "A page can be a doc or a doc of docs.",
      description:
        "We wrote Nikhil and Meera’s love story. You could write your project’s mission, goals, and eventual vision.",
    },
  },
  All: {
    key: "all",
    title: "Write a note, a doc, or a full knowledge base",
    description:
      "Pages help you organise your thoughts to create wikis, discussions or even document heated takes for your project. Use it wisely!",
  },
  Favorites: {
    key: "favorites",
    title: "No favorite pages yet",
    description: "Favorites for quick access? mark them and find them right here.",
  },
  Private: {
    key: "private",
    title: "No private pages yet",
    description: "Keep your private thoughts here. When you're ready to share, the team's just a click away.",
  },
  Shared: {
    key: "shared",
    title: "No shared pages yet",
    description: "See pages shared with everyone in your project right here.",
  },
  Archived: {
    key: "archived",
    title: "No archived pages yet",
    description: "Archive pages not on your radar. Access them here when needed.",
  },
  Recent: {
    key: "recent",
    title: "Write a note, a doc, or a full knowledge base",
    description:
      "Pages help you organise your thoughts to create wikis, discussions or even document heated takes for your project. Use it wisely! Pages will be sorted and grouped by last updated",
    primaryButton: {
      text: "Create new page",
    },
  },
};
