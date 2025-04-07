// plane imports
import { TProductSubscriptionType } from "@plane/types";
import { E_FEATURE_FLAGS } from "@plane/constants";

export const ENTERPRISE_PLAN_FEATURES = [
  "Private + managed deployments",
  "GAC",
  "LDAP support",
  "Databases + Formulas",
  "Unlimited and full Automation Flows",
  "Full-suite professional services",
];

export const BUSINESS_PLAN_FEATURES = [
  "Project Templates",
  "Workflows + Approvals",
  "Decision + Loops Automation",
  "Custom Reports",
  "Nested Pages",
  "Intake Forms",
];

export const PRO_PLAN_FEATURES = [
  "Dashboards + Reports",
  "Full Time Tracking + Bulk Ops",
  "Teamspaces",
  "Trigger And Action",
  "Wikis",
  "Popular integrations",
];

export const ONE_PLAN_FEATURES = [
  "OIDC + SAML for SSO",
  "Active Cycles",
  "Real-time collab + public views and page",
  "Link pages in issues and vice-versa",
  "Time-tracking + limited bulk ops",
  "Docker, Kubernetes and more",
];

export const FREE_PLAN_UPGRADE_FEATURES = [
  "OIDC + SAML for SSO",
  "Time Tracking and Bulk Ops",
  "Integrations",
  "Public Views and Pages",
];

/**
 * This map is used to determine the base plan for a feature flag.
 */
// TODO: Update this to include all features flags
export const FEATURE_TO_BASE_PLAN_MAP = {
  [E_FEATURE_FLAGS.WORKFLOWS]: "BUSINESS",
  [E_FEATURE_FLAGS.CUSTOMERS]: "PRO",
  [E_FEATURE_FLAGS.WORKITEM_TEMPLATES]: "PRO",
  [E_FEATURE_FLAGS.DASHBOARDS]: "PRO",
};
