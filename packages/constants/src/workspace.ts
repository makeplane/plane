import type { TStaticViewTypes, IWorkspaceSearchResults } from "@plane/types";
import { EUserWorkspaceRoles } from "@plane/types";

export const ORGANIZATION_SIZE = ["Just myself", "2-10", "11-50", "51-200", "201-500", "500+"];

export const RESTRICTED_URLS = [
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

export const WORKSPACE_SETTINGS = {
  general: {
    key: "general",
    i18n_label: "workspace_settings.settings.general.title" as const,
    href: `/settings`,
    access: [EUserWorkspaceRoles.ADMIN, EUserWorkspaceRoles.MEMBER],
    highlight: (pathname: string, baseUrl: string) => pathname === `${baseUrl}/settings/`,
  },
  members: {
    key: "members",
    i18n_label: "workspace_settings.settings.members.title" as const,
    href: `/settings/members`,
    access: [EUserWorkspaceRoles.ADMIN, EUserWorkspaceRoles.MEMBER],
    highlight: (pathname: string, baseUrl: string) => pathname === `${baseUrl}/settings/members/`,
  },
  "billing-and-plans": {
    key: "billing-and-plans",
    i18n_label: "workspace_settings.settings.billing_and_plans.title" as const,
    href: `/settings/billing`,
    access: [EUserWorkspaceRoles.ADMIN],
    highlight: (pathname: string, baseUrl: string) => pathname === `${baseUrl}/settings/billing/`,
  },
  export: {
    key: "export",
    i18n_label: "workspace_settings.settings.exports.title" as const,
    href: `/settings/exports`,
    access: [EUserWorkspaceRoles.ADMIN, EUserWorkspaceRoles.MEMBER],
    highlight: (pathname: string, baseUrl: string) => pathname === `${baseUrl}/settings/exports/`,
  },
  webhooks: {
    key: "webhooks",
    i18n_label: "workspace_settings.settings.webhooks.title" as const,
    href: `/settings/webhooks`,
    access: [EUserWorkspaceRoles.ADMIN],
    highlight: (pathname: string, baseUrl: string) => pathname === `${baseUrl}/settings/webhooks/`,
  },
};

export const WORKSPACE_SETTINGS_ACCESS = Object.fromEntries(
  Object.entries(WORKSPACE_SETTINGS).map(([_, { href, access }]) => [href, access])
);

export const WORKSPACE_SETTINGS_LINKS = [
  WORKSPACE_SETTINGS["general"],
  WORKSPACE_SETTINGS["members"],
  WORKSPACE_SETTINGS["billing-and-plans"],
  WORKSPACE_SETTINGS["export"],
  WORKSPACE_SETTINGS["webhooks"],
];

export const ROLE = {
  [EUserWorkspaceRoles.GUEST]: "Guest",
  [EUserWorkspaceRoles.MEMBER]: "Member",
  [EUserWorkspaceRoles.ADMIN]: "Admin",
};

export const ROLE_DETAILS = {
  [EUserWorkspaceRoles.GUEST]: {
    i18n_title: "role_details.guest.title" as const,
    i18n_description: "role_details.guest.description" as const,
  },
  [EUserWorkspaceRoles.MEMBER]: {
    i18n_title: "role_details.member.title" as const,
    i18n_description: "role_details.member.description" as const,
  },
  [EUserWorkspaceRoles.ADMIN]: {
    i18n_title: "role_details.admin.title" as const,
    i18n_description: "role_details.admin.description" as const,
  },
};

export const USER_ROLES = [
  {
    value: "Product / Project Manager",
    i18n_label: "user_roles.product_or_project_manager" as const,
  },
  {
    value: "Development / Engineering",
    i18n_label: "user_roles.development_or_engineering" as const,
  },
  {
    value: "Founder / Executive",
    i18n_label: "user_roles.founder_or_executive" as const,
  },
  {
    value: "Freelancer / Consultant",
    i18n_label: "user_roles.freelancer_or_consultant" as const,
  },
  { value: "Marketing / Growth", i18n_label: "user_roles.marketing_or_growth" as const },
  {
    value: "Sales / Business Development",
    i18n_label: "user_roles.sales_or_business_development" as const,
  },
  {
    value: "Support / Operations",
    i18n_label: "user_roles.support_or_operations" as const,
  },
  {
    value: "Student / Professor",
    i18n_label: "user_roles.student_or_professor" as const,
  },
  { value: "Human Resources", i18n_label: "user_roles.human_resources" as const },
  { value: "Other", i18n_label: "user_roles.other" as const },
];

export const IMPORTERS_LIST = [
  {
    provider: "github",
    type: "import",
    i18n_title: "importer.github.title" as const,
    i18n_description: "importer.github.description" as const,
  },
  {
    provider: "jira",
    type: "import",
    i18n_title: "importer.jira.title" as const,
    i18n_description: "importer.jira.description" as const,
  },
];

export const EXPORTERS_LIST = [
  {
    provider: "csv",
    type: "export",
    i18n_title: "exporter.csv.title" as const,
    i18n_description: "exporter.csv.description" as const,
  },
  {
    provider: "xlsx",
    type: "export",
    i18n_title: "exporter.excel.title" as const,
    i18n_description: "exporter.csv.description" as const,
  },
  {
    provider: "json",
    type: "export",
    i18n_title: "exporter.json.title" as const,
    i18n_description: "exporter.csv.description" as const,
  },
];

export const DEFAULT_GLOBAL_VIEWS_LIST = [
  {
    key: "all-issues",
    i18n_label: "default_global_view.all_issues" as const,
  },
  {
    key: "assigned",
    i18n_label: "default_global_view.assigned" as const,
  },
  {
    key: "created",
    i18n_label: "default_global_view.created" as const,
  },
  {
    key: "subscribed",
    i18n_label: "default_global_view.subscribed" as const,
  },
] as const;

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
    labelTranslationKey: "views" as const,
    href: `/workspace-views/all-issues/`,
    access: [EUserWorkspaceRoles.ADMIN, EUserWorkspaceRoles.MEMBER, EUserWorkspaceRoles.GUEST],
    highlight: (pathname: string, url: string) => pathname.includes(url),
  },
  analytics: {
    key: "analytics",
    labelTranslationKey: "analytics" as const,
    href: `/analytics/`,
    access: [EUserWorkspaceRoles.ADMIN, EUserWorkspaceRoles.MEMBER],
    highlight: (pathname: string, url: string) => pathname.includes(url),
  },
  archives: {
    key: "archives",
    labelTranslationKey: "archives" as const,
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
    labelTranslationKey: "home.title" as const,
    href: `/`,
    access: [EUserWorkspaceRoles.ADMIN, EUserWorkspaceRoles.MEMBER, EUserWorkspaceRoles.GUEST],
    highlight: (pathname: string, url: string) => pathname === url,
  },
  inbox: {
    key: "inbox",
    labelTranslationKey: "notification.label" as const,
    href: `/notifications/`,
    access: [EUserWorkspaceRoles.ADMIN, EUserWorkspaceRoles.MEMBER, EUserWorkspaceRoles.GUEST],
    highlight: (pathname: string, url: string) => pathname.includes(url),
  },
  "your-work": {
    key: "your_work",
    labelTranslationKey: "your_work" as const,
    href: `/profile/`,
    access: [EUserWorkspaceRoles.ADMIN, EUserWorkspaceRoles.MEMBER],
    highlight: (pathname: string, url: string) => pathname.includes(url),
  },
  stickies: {
    key: "stickies",
    labelTranslationKey: "sidebar.stickies" as const,
    href: `/stickies/`,
    access: [EUserWorkspaceRoles.ADMIN, EUserWorkspaceRoles.MEMBER, EUserWorkspaceRoles.GUEST],
    highlight: (pathname: string, url: string) => pathname.includes(url),
  },
  drafts: {
    key: "drafts",
    labelTranslationKey: "drafts" as const,
    href: `/drafts/`,
    access: [EUserWorkspaceRoles.ADMIN, EUserWorkspaceRoles.MEMBER],
    highlight: (pathname: string, url: string) => pathname.includes(url),
  },
  projects: {
    key: "projects",
    labelTranslationKey: "projects" as const,
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
