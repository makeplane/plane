// components
import type { TPowerKCommandConfig } from "@/components/power-k/core/types";
// local imports
import type { TPowerKNavigationCommandKeys } from "./commands";
import { usePowerKNavigationCommandsRecord } from "./commands";

export const usePowerKNavigationCommands = (): TPowerKCommandConfig[] => {
  const optionsList: Record<TPowerKNavigationCommandKeys, TPowerKCommandConfig> = usePowerKNavigationCommandsRecord();

  return [
    // User-level Navigation
    optionsList["open_workspace"],
    optionsList["nav_home"],
    optionsList["nav_inbox"],
    optionsList["nav_your_work"],
    optionsList["nav_account_settings"],
    // Workspace-Level Navigation
    optionsList["open_project"],
    optionsList["nav_projects_list"],
    optionsList["nav_all_workspace_work_items"],
    optionsList["nav_assigned_workspace_work_items"],
    optionsList["nav_created_workspace_work_items"],
    optionsList["nav_subscribed_workspace_work_items"],
    optionsList["nav_workspace_analytics"],
    optionsList["nav_workspace_drafts"],
    optionsList["nav_workspace_archives"],
    optionsList["open_workspace_setting"],
    optionsList["nav_workspace_settings"],
    // Project-Level Navigation (Only visible in project context)
    optionsList["nav_project_work_items"],
    optionsList["open_project_cycle"],
    optionsList["nav_project_cycles"],
    optionsList["open_project_module"],
    optionsList["nav_project_modules"],
    optionsList["open_project_view"],
    optionsList["nav_project_views"],
    optionsList["nav_project_pages"],
    optionsList["nav_project_intake"],
    optionsList["nav_project_archives"],
    optionsList["open_project_setting"],
    optionsList["nav_project_settings"],
  ];
};
