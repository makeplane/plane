import { useContext } from "react";
// context
import { StoreContext } from "@/lib/store-context";

export enum E_FEATURE_FLAGS {
  BULK_OPS = "BULK_OPS",
  BULK_OPS_ADVANCED = "BULK_OPS_ADVANCED",
  COLLABORATION_CURSOR = "COLLABORATION_CURSOR",
  EDITOR_AI_OPS = "EDITOR_AI_OPS",
  ESTIMATE_WITH_TIME = "ESTIMATE_WITH_TIME",
  ISSUE_TYPE_DISPLAY = "ISSUE_TYPE_DISPLAY",
  ISSUE_TYPE_SETTINGS = "ISSUE_TYPE_SETTINGS",
  OIDC_SAML_AUTH = "OIDC_SAML_AUTH",
  PAGE_ISSUE_EMBEDS = "PAGE_ISSUE_EMBEDS",
  PAGE_PUBLISH = "PAGE_PUBLISH",
  VIEW_ACCESS_PRIVATE = "VIEW_ACCESS_PRIVATE",
  VIEW_LOCK = "VIEW_LOCK",
  VIEW_PUBLISH = "VIEW_PUBLISH",
  WORKSPACE_ACTIVE_CYCLES = "WORKSPACE_ACTIVE_CYCLES",
  WORKSPACE_PAGES = "WORKSPACE_PAGES",
  ISSUE_WORKLOG = "ISSUE_WORKLOG",
  PROJECT_GROUPING = "PROJECT_GROUPING",
  ACTIVE_CYCLE_PRO = "ACTIVE_CYCLE_PRO",
  NO_LOAD = "NO_LOAD",
  // integrations
  SILO_INTEGRATION = "SILO_INTEGRATION",
  SILO_JIRA_INTEGRATION = "SILO_JIRA_INTEGRATION",
  SILO_LINEAR_INTEGRATION = "SILO_LINEAR_INTEGRATION",
}

export const useFlag = (
  workspaceSlug: string,
  flag: keyof typeof E_FEATURE_FLAGS,
  defaultValue: boolean = false
): boolean => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("useFlag must be used within StoreProvider");
  return context.featureFlags.flags[workspaceSlug]?.[E_FEATURE_FLAGS[flag]] ?? defaultValue;
};
