export default {
  common_empty_state: {
    progress: {
      title: "There're no progress metrics to show yet.",
      description: "Start setting property values in work items to see progress metrics here.",
    },
    updates: {
      title: "No updates yet.",
      description: "Once project members add updates it will appear here",
    },
    search: {
      title: "No matching results.",
      description: "No results found. Try adjusting your search terms.",
    },
    not_found: {
      title: "Oops! Something seems wrong",
      description: "We are unable to fetch your plane account currently. This might be a network error.",
      cta_primary: "Try reloading",
    },
    server_error: {
      title: "Server error",
      description: "We are unable to connect and fetch data from our server. Don't worry, we are working on it.",
      cta_primary: "Try reloading",
    },
  },
  project_empty_state: {
    no_access: {
      title: "Seems like you don’t have access to this Project",
      restricted_description: "Contact admin to request for access and you can continue here.",
      join_description: "Click the button below to join it.",
      cta_primary: "Join project",
      cta_loading: "Joining project",
    },
    invalid_project: {
      title: "Project not found",
      description: "The project you are looking for does not exist.",
    },
    work_items: {
      title: "Start with your first work item.",
      description:
        "Work items are the building blocks of your project — assign owners, set priorities, and track progress easily.",
      cta_primary: "Create your first work item",
    },
    cycles: {
      title: "Group and timebox your work in Cycles.",
      description:
        "Break work down by timeboxed chunks, work backwards from your project deadline to set dates, and make tangible progress as a team.",
      cta_primary: "Set your first cycle",
    },
    cycle_work_items: {
      title: "No work items to show in this cycle",
      description:
        "Create work items to begin monitoring your team's progress this cycle and achieve your goals on time.",
      cta_primary: "Create work item",
      cta_secondary: "Add existing work item",
    },
    modules: {
      title: "Map your project goals to Modules and track easily.",
      description:
        "Modules are made up of interconnected work items. They assist in monitoring progress through project phases, each with specific deadlines and analytics to indicate how close you are to achieving those phases.",
      cta_primary: "Set your first module",
    },
    module_work_items: {
      title: "No work items to show in this Module",
      description: "Create work items to begin monitoring this module.",
      cta_primary: "Create work item",
      cta_secondary: "Add existing work item",
    },
    views: {
      title: "Save custom views for your project",
      description:
        "Views are saved filters that help you quickly access the information you use most. Collaborate effortlessly as teammates share and tailor views to their specific needs.",
      cta_primary: "Create view",
    },
    no_work_items_in_project: {
      title: "No work items in the project yet",
      description: "Add work items to your project and slice your work into trackable pieces with views.",
      cta_primary: "Add work item",
    },
    work_item_filter: {
      title: "No work items found",
      description: "Your current filter didn't return any results. Try changing the filters.",
      cta_primary: "Add work item",
    },
    pages: {
      title: "Document everything — from notes to PRDs",
      description:
        "Pages let you capture and organize information in one place. Write meeting notes, project documentation, and PRDs, embed work items, and structure them with ready-to-use components.",
      cta_primary: "Create your first Page",
    },
    archive_pages: {
      title: "No archived pages yet",
      description: "Archive pages not on your radar. Access them here when needed.",
    },
    intake_sidebar: {
      title: "Log Intake requests",
      description: "Submit new requests to be reviewed, prioritized, and tracked within your project's workflow.",
      cta_primary: "Create Intake request",
    },
    intake_main: {
      title: "Select an Intake work item to view its details",
    },
  },
  workspace_empty_state: {
    archive_work_items: {
      title: "No archived work items yet",
      description:
        "Manually or through automation, you can archive work items that are completed or cancelled. Find them here once archived.",
      cta_primary: "Set automation",
    },
    archive_cycles: {
      title: "No archived cycles yet",
      description: "To tidy up your project, archive completed cycles. Find them here once archived.",
    },
    archive_modules: {
      title: "No archived Modules yet",
      description: "To tidy up your project, archive completed or cancelled modules. Find them here once archived.",
    },
    home_widget_quick_links: {
      title: "Keep important references, resources, or docs handy for your work",
    },
    inbox_sidebar_all: {
      title: "Updates for your subscribed work items will appear here",
    },
    inbox_sidebar_mentions: {
      title: "Mentions for your work items will appear here",
    },
    your_work_by_priority: {
      title: "No work item assigned yet",
    },
    your_work_by_state: {
      title: "No work item assigned yet",
    },
    views: {
      title: "No Views yet",
      description: "Add work items to your project and use views to filter, sort, and monitor progress effortlessly.",
      cta_primary: "Add work item",
    },
    drafts: {
      title: "Half-written work items",
      description:
        "To try this out, start adding a work item and leave it mid-way or create your first draft below. 😉",
      cta_primary: "Create draft work item",
    },
    projects_archived: {
      title: "No projects archived",
      description: "Looks like all your projects are still active—great job!",
    },
    analytics_projects: {
      title: "Create projects to visualize project metrics here.",
    },
    analytics_work_items: {
      title:
        "Create projects with work items and assignees to start tracking performance, progress, and team impact here.",
    },
    analytics_no_cycle: {
      title: "Create cycles to organise work into time-bound phases and track progress across sprints.",
    },
    analytics_no_module: {
      title: "Create modules to organize your work and track progress across different stages.",
    },
    analytics_no_intake: {
      title: "Set up intake to manage incoming requests and track how they're accepted and rejected",
    },
  },
  settings_empty_state: {
    estimates: {
      title: "No estimates yet",
      description: "Define how your team measures effort and track it consistently across all work items.",
      cta_primary: "Add estimate system",
    },
    labels: {
      title: "No labels yet",
      description: "Create personalized labels to effectively categorize and manage your work items.",
      cta_primary: "Create your first label",
    },
    exports: {
      title: "No exports yet",
      description: "You don't have any export records right now. Once you export data, all records will appear here.",
    },
    tokens: {
      title: "No Personal token yet",
      description: "Generate secure API tokens to connect your workspace with external systems and applications.",
      cta_primary: "Add API token",
    },
    webhooks: {
      title: "No Webhook added yet",
      description: "Automate notifications to external services when project events occur.",
      cta_primary: "Add webhook",
    },
  },
} as const;
