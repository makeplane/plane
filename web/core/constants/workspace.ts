// types
import { TStaticViewTypes } from "@plane/types";
import { EUserPermissions } from "@/plane-web/constants/user-permissions";
// services images
import CSVLogo from "@/public/services/csv.svg";
import ExcelLogo from "@/public/services/excel.svg";
import GithubLogo from "@/public/services/github.png";
import JiraLogo from "@/public/services/jira.svg";
import JSONLogo from "@/public/services/json.svg";

export const ROLE = {
  [EUserPermissions.GUEST]: "Guest",
  [EUserPermissions.MEMBER]: "Member",
  [EUserPermissions.ADMIN]: "Admin",
};

export const ROLE_DETAILS = {
  [EUserPermissions.GUEST]: {
    title: "Guest",
    description: "External members of organizations can be invited as guests.",
  },
  [EUserPermissions.MEMBER]: {
    title: "Member",
    description: "Ability to read, write, edit, and delete entities inside projects, cycles, and modules",
  },
  [EUserPermissions.ADMIN]: {
    title: "Admin",
    description: "All permissions set to true within the workspace.",
  },
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
