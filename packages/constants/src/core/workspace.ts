// types
import { TStaticViewTypes } from "@plane/types";
import { EUserPermissions } from "../ce/user-permissions";

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
    description:
      "Ability to read, write, edit, and delete entities inside projects, cycles, and modules",
  },
  [EUserPermissions.ADMIN]: {
    title: "Admin",
    description: "All permissions set to true within the workspace.",
  },
};

export const USER_ROLES = [
  { value: "Product / Project Manager", label: "Product / Project Manager" },
  { value: "Development / Engineering", label: "Development / Engineering" },
  { value: "Founder / Executive", label: "Founder / Executive" },
  { value: "Freelancer / Consultant", label: "Freelancer / Consultant" },
  { value: "Marketing / Growth", label: "Marketing / Growth" },
  {
    value: "Sales / Business Development",
    label: "Sales / Business Development",
  },
  { value: "Support / Operations", label: "Support / Operations" },
  { value: "Student / Professor", label: "Student / Professor" },
  { value: "Human Resources", label: "Human Resources" },
  { value: "Other", label: "Other" },
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

export const ORGANIZATION_SIZE = [
  "Just myself",
  "2-10",
  "11-50",
  "51-200",
  "201-500",
  "500+",
];

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
