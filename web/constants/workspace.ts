// services images
import GithubLogo from "public/services/github.png";
import JiraLogo from "public/services/jira.svg";
import CSVLogo from "public/services/csv.svg";
import ExcelLogo from "public/services/excel.svg";
import JSONLogo from "public/services/json.svg";
// types
import { TStaticViewTypes } from "@plane/types";
import { Props } from "components/icons/types";
// icons
import { SettingIcon } from "components/icons";

export enum EUserWorkspaceRoles {
  GUEST = 5,
  VIEWER = 10,
  MEMBER = 15,
  ADMIN = 20,
}

export const ROLE = {
  5: "Guest",
  10: "Viewer",
  15: "Member",
  20: "Admin",
};

export const ORGANIZATION_SIZE = ["Just myself", "2-10", "11-50", "51-200", "201-500", "500+"];

export const USER_ROLES = [
  { value: "Product / Project Manager", label: "Product / Project Manager" },
  { value: "Development / Engineering", label: "Development / Engineering" },
  { value: "Founder / Executive", label: "Founder / Executive" },
  { value: "Freelancer / Consultant", label: "Freelancer / Consultant" },
  { value: "Marketing / Growth", label: "Marketing / Growth" },
  { value: "Sales / Business Development", label: "Sales / Business Development" },
  { value: "Support / Operations", label: "Support / Operations" },
  { value: "Student / Professor", label: "Student / Professor" },
  { value: "Human Resources", label: "Human Resources" },
  { value: "Other", label: "Other" },
];

export const IMPORTERS_LIST = [
  {
    provider: "github",
    type: "import",
    title: "GitHub",
    description: "Import issues from GitHub repositories and sync them.",
    logo: GithubLogo,
  },
  {
    provider: "jira",
    type: "import",
    title: "Jira",
    description: "Import issues and epics from Jira projects and epics.",
    logo: JiraLogo,
  },
];

export const EXPORTERS_LIST = [
  {
    provider: "csv",
    type: "export",
    title: "CSV",
    description: "Export issues to a CSV file.",
    logo: CSVLogo,
  },
  {
    provider: "xlsx",
    type: "export",
    title: "Excel",
    description: "Export issues to a Excel file.",
    logo: ExcelLogo,
  },
  {
    provider: "json",
    type: "export",
    title: "JSON",
    description: "Export issues to a JSON file.",
    logo: JSONLogo,
  },
];

export const DEFAULT_GLOBAL_VIEWS_LIST: {
  key: TStaticViewTypes;
  label: string;
}[] = [
  {
    key: "all-issues",
    label: "All issues",
  },
  {
    key: "assigned",
    label: "Assigned",
  },
  {
    key: "created",
    label: "Created",
  },
  {
    key: "subscribed",
    label: "Subscribed",
  },
];

export const RESTRICTED_URLS = [
  "404",
  "accounts",
  "api",
  "create-workspace",
  "error",
  "god-mode",
  "installations",
  "invitations",
  "onboarding",
  "profile",
  "spaces",
  "workspace-invitations",
];

export const WORKSPACE_SETTINGS_LINKS: {
  key: string;
  label: string;
  href: string;
  access: EUserWorkspaceRoles;
  highlight: (pathname: string, baseUrl: string) => boolean;
  Icon: React.FC<Props>;
}[] = [
  {
    key: "general",
    label: "General",
    href: `/settings`,
    access: EUserWorkspaceRoles.GUEST,
    highlight: (pathname: string, baseUrl: string) => pathname === `${baseUrl}/settings`,
    Icon: SettingIcon,
  },
  {
    key: "members",
    label: "Members",
    href: `/settings/members`,
    access: EUserWorkspaceRoles.GUEST,
    highlight: (pathname: string, baseUrl: string) => pathname === `${baseUrl}/settings/members`,
    Icon: SettingIcon,
  },
  {
    key: "billing-and-plans",
    label: "Billing and plans",
    href: `/settings/billing`,
    access: EUserWorkspaceRoles.ADMIN,
    highlight: (pathname: string, baseUrl: string) => pathname === `${baseUrl}/settings/billing`,
    Icon: SettingIcon,
  },
  {
    key: "integrations",
    label: "Integrations",
    href: `/settings/integrations`,
    access: EUserWorkspaceRoles.ADMIN,
    highlight: (pathname: string, baseUrl: string) => pathname === `${baseUrl}/settings/integrations`,
    Icon: SettingIcon,
  },
  {
    key: "import",
    label: "Imports",
    href: `/settings/imports`,
    access: EUserWorkspaceRoles.ADMIN,
    highlight: (pathname: string, baseUrl: string) => pathname === `${baseUrl}/settings/imports`,
    Icon: SettingIcon,
  },
  {
    key: "export",
    label: "Exports",
    href: `/settings/exports`,
    access: EUserWorkspaceRoles.MEMBER,
    highlight: (pathname: string, baseUrl: string) => pathname === `${baseUrl}/settings/exports`,
    Icon: SettingIcon,
  },
  {
    key: "webhooks",
    label: "Webhooks",
    href: `/settings/webhooks`,
    access: EUserWorkspaceRoles.ADMIN,
    highlight: (pathname: string, baseUrl: string) => pathname === `${baseUrl}/settings/webhooks`,
    Icon: SettingIcon,
  },
  {
    key: "api-tokens",
    label: "API tokens",
    href: `/settings/api-tokens`,
    access: EUserWorkspaceRoles.ADMIN,
    highlight: (pathname: string, baseUrl: string) => pathname === `${baseUrl}/settings/api-tokens`,
    Icon: SettingIcon,
  },
];

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
