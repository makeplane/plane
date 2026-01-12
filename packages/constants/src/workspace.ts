import type { TStaticViewTypes, IWorkspaceSearchResults } from "@plane/types";
import { EUserWorkspaceRoles } from "@plane/types";

export const ORGANIZATION_SIZE: string[] = ["Just myself", "2-10", "11-50", "51-200", "201-500", "500+"];

export const RESTRICTED_URLS: string[] = [
  "404",
  "accounts",
  "api",
  "create-workspace",
  "god-mode",
  "installations",
  "invitations",
  "onboarding",
  "profile",
  "spaces",
  "workspace-invitations",
  "password",
  "flags",
  "monitor",
  "monitoring",
  "ingest",
  "plane-pro",
  "plane-ultimate",
  "enterprise",
  "plane-enterprise",
  "disco",
  "silo",
  "chat",
  "calendar",
  "drive",
  "channels",
  "upgrade",
  "billing",
  "sign-in",
  "sign-up",
  "signin",
  "signup",
  "config",
  "live",
  "admin",
  "m",
  "import",
  "importers",
  "integrations",
  "integration",
  "configuration",
  "initiatives",
  "initiative",
  "config",
  "workflow",
  "workflows",
  "epics",
  "epic",
  "story",
  "mobile",
  "dashboard",
  "desktop",
  "onload",
  "real-time",
  "one",
  "pages",
  "mobile",
  "business",
  "pro",
  "settings",
  "monitor",
  "license",
  "licenses",
  "instances",
  "instance",
];

export const ROLE = {
  [EUserWorkspaceRoles.GUEST]: "Guest",
  [EUserWorkspaceRoles.MEMBER]: "Member",
  [EUserWorkspaceRoles.ADMIN]: "Admin",
};

export const ROLE_DETAILS = {
  [EUserWorkspaceRoles.GUEST]: {
    i18n_title: "role_details.guest.title",
    i18n_description: "role_details.guest.description",
  },
  [EUserWorkspaceRoles.MEMBER]: {
    i18n_title: "role_details.member.title",
    i18n_description: "role_details.member.description",
  },
  [EUserWorkspaceRoles.ADMIN]: {
    i18n_title: "role_details.admin.title",
    i18n_description: "role_details.admin.description",
  },
};

export const USER_ROLES = [
  {
    value: "Product / Project Manager",
    i18n_label: "user_roles.product_or_project_manager",
  },
  {
    value: "Development / Engineering",
    i18n_label: "user_roles.development_or_engineering",
  },
  {
    value: "Founder / Executive",
    i18n_label: "user_roles.founder_or_executive",
  },
  {
    value: "Freelancer / Consultant",
    i18n_label: "user_roles.freelancer_or_consultant",
  },
  { value: "Marketing / Growth", i18n_label: "user_roles.marketing_or_growth" },
  {
    value: "Sales / Business Development",
    i18n_label: "user_roles.sales_or_business_development",
  },
  {
    value: "Support / Operations",
    i18n_label: "user_roles.support_or_operations",
  },
  {
    value: "Student / Professor",
    i18n_label: "user_roles.student_or_professor",
  },
  { value: "Human Resources", i18n_label: "user_roles.human_resources" },
  { value: "Other", i18n_label: "user_roles.other" },
];

export const IMPORTERS_LIST = [
  {
    provider: "github",
    type: "import",
    i18n_title: "importer.github.title",
    i18n_description: "importer.github.description",
  },
  {
    provider: "jira",
    type: "import",
    i18n_title: "importer.jira.title",
    i18n_description: "importer.jira.description",
  },
];

export const EXPORTERS_LIST = [
  {
    provider: "csv",
    type: "export",
    i18n_title: "exporter.csv.title",
    i18n_description: "exporter.csv.description",
  },
  {
    provider: "xlsx",
    type: "export",
    i18n_title: "exporter.excel.title",
    i18n_description: "exporter.csv.description",
  },
  {
    provider: "json",
    type: "export",
    i18n_title: "exporter.json.title",
    i18n_description: "exporter.csv.description",
  },
];

export const DEFAULT_GLOBAL_VIEWS_LIST: {
  key: TStaticViewTypes;
  i18n_label: string;
}[] = [
  {
    key: "all-issues",
    i18n_label: "default_global_view.all_issues",
  },
  {
    key: "assigned",
    i18n_label: "default_global_view.assigned",
  },
  {
    key: "created",
    i18n_label: "default_global_view.created",
  },
  {
    key: "subscribed",
    i18n_label: "default_global_view.subscribed",
  },
];

export interface IWorkspaceSidebarNavigationItem {
  key: string;
  labelTranslationKey: string;
  href: string;
  access: EUserWorkspaceRoles[];
  highlight: (pathname: string, url: string) => boolean;
}

export const WORKSPACE_SIDEBAR_DYNAMIC_NAVIGATION_ITEMS: Record<string, IWorkspaceSidebarNavigationItem> = {
  views: {
    key: "views",
    labelTranslationKey: "views",
    href: `/workspace-views/all-issues/`,
    access: [EUserWorkspaceRoles.ADMIN, EUserWorkspaceRoles.MEMBER, EUserWorkspaceRoles.GUEST],
    highlight: (pathname: string, url: string) => pathname.includes(url),
  },
  analytics: {
    key: "analytics",
    labelTranslationKey: "analytics",
    href: `/analytics/`,
    access: [EUserWorkspaceRoles.ADMIN, EUserWorkspaceRoles.MEMBER],
    highlight: (pathname: string, url: string) => pathname.includes(url),
  },
  archives: {
    key: "archives",
    labelTranslationKey: "archives",
    href: `/projects/archives/`,
    access: [EUserWorkspaceRoles.ADMIN, EUserWorkspaceRoles.MEMBER],
    highlight: (pathname: string, url: string) => pathname.includes(url),
  },
};

export const WORKSPACE_SIDEBAR_DYNAMIC_NAVIGATION_ITEMS_LINKS: IWorkspaceSidebarNavigationItem[] = [
  WORKSPACE_SIDEBAR_DYNAMIC_NAVIGATION_ITEMS["views"],
  WORKSPACE_SIDEBAR_DYNAMIC_NAVIGATION_ITEMS["analytics"],
  WORKSPACE_SIDEBAR_DYNAMIC_NAVIGATION_ITEMS["archives"],
];

export const WORKSPACE_SIDEBAR_STATIC_NAVIGATION_ITEMS: Record<string, IWorkspaceSidebarNavigationItem> = {
  home: {
    key: "home",
    labelTranslationKey: "home.title",
    href: `/`,
    access: [EUserWorkspaceRoles.ADMIN, EUserWorkspaceRoles.MEMBER, EUserWorkspaceRoles.GUEST],
    highlight: (pathname: string, url: string) => pathname === url,
  },
  inbox: {
    key: "inbox",
    labelTranslationKey: "notification.label",
    href: `/notifications/`,
    access: [EUserWorkspaceRoles.ADMIN, EUserWorkspaceRoles.MEMBER, EUserWorkspaceRoles.GUEST],
    highlight: (pathname: string, url: string) => pathname.includes(url),
  },
  "your-work": {
    key: "your_work",
    labelTranslationKey: "your_work",
    href: `/profile/`,
    access: [EUserWorkspaceRoles.ADMIN, EUserWorkspaceRoles.MEMBER],
    highlight: (pathname: string, url: string) => pathname.includes(url),
  },
  stickies: {
    key: "stickies",
    labelTranslationKey: "sidebar.stickies",
    href: `/stickies/`,
    access: [EUserWorkspaceRoles.ADMIN, EUserWorkspaceRoles.MEMBER, EUserWorkspaceRoles.GUEST],
    highlight: (pathname: string, url: string) => pathname.includes(url),
  },
  drafts: {
    key: "drafts",
    labelTranslationKey: "drafts",
    href: `/drafts/`,
    access: [EUserWorkspaceRoles.ADMIN, EUserWorkspaceRoles.MEMBER],
    highlight: (pathname: string, url: string) => pathname.includes(url),
  },
  projects: {
    key: "projects",
    labelTranslationKey: "projects",
    href: `/projects/`,
    access: [EUserWorkspaceRoles.ADMIN, EUserWorkspaceRoles.MEMBER, EUserWorkspaceRoles.GUEST],
    highlight: (pathname: string, url: string) => pathname === url,
  },
};

export const WORKSPACE_SIDEBAR_STATIC_NAVIGATION_ITEMS_LINKS: IWorkspaceSidebarNavigationItem[] = [
  WORKSPACE_SIDEBAR_STATIC_NAVIGATION_ITEMS["home"],
];

export const WORKSPACE_SIDEBAR_STATIC_PINNED_NAVIGATION_ITEMS_LINKS: IWorkspaceSidebarNavigationItem[] = [
  WORKSPACE_SIDEBAR_STATIC_NAVIGATION_ITEMS["projects"],
];

export const IS_FAVORITE_MENU_OPEN = "is_favorite_menu_open";
export const WORKSPACE_DEFAULT_SEARCH_RESULT: IWorkspaceSearchResults = {
  results: {
    workspace: [],
    project: [],
    issue: [],
    cycle: [],
    module: [],
    issue_view: [],
    page: [],
  },
};

export const USE_CASES = [
  "Plan and track product roadmaps",
  "Manage engineering sprints",
  "Coordinate cross-functional projects",
  "Replace our current tool",
  "Just exploring",
];
