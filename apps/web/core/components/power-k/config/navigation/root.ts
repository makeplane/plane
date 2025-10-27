// components
import type { TPowerKCommandConfig } from "@/components/power-k/core/types";
// local imports
import type { TPowerKNavigationCommandKeys } from "./commands";
import { usePowerKNavigationCommandsRecord } from "./commands";

export const usePowerKNavigationCommands = (): TPowerKCommandConfig[] => {
  const optionsList: Record<TPowerKNavigationCommandKeys, TPowerKCommandConfig> = usePowerKNavigationCommandsRecord();

  return [
    // Open actions from lowest to highest scope
    optionsList["open_project_cycle"],
    optionsList["open_project_module"],
    optionsList["open_project_view"],
    optionsList["open_project_setting"],
    optionsList["open_project"],
    optionsList["open_workspace_setting"],
    optionsList["open_workspace"],
    // User-Level Navigation
    optionsList["nav_home"],
    optionsList["nav_inbox"],
    optionsList["nav_your_work"],
    // Project-Level Navigation (Only visible in project context)
    optionsList["nav_project_work_items"],
    optionsList["nav_project_pages"],
    optionsList["nav_project_cycles"],
    optionsList["nav_project_modules"],
    optionsList["nav_project_views"],
    optionsList["nav_project_intake"],
    optionsList["nav_project_settings"],
    optionsList["nav_project_archives"],
    // Navigate to workspace-level pages
    optionsList["nav_all_workspace_work_items"],
    optionsList["nav_assigned_workspace_work_items"],
    optionsList["nav_created_workspace_work_items"],
    optionsList["nav_subscribed_workspace_work_items"],
    optionsList["nav_workspace_analytics"],
    optionsList["nav_workspace_settings"],
    optionsList["nav_workspace_drafts"],
    optionsList["nav_workspace_archives"],
    optionsList["nav_projects_list"],
    // Account-Level Navigation
    optionsList["nav_account_settings"],
  ];
};
