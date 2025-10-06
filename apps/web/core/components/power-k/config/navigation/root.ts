// components
import type { TPowerKCommandConfig } from "@/components/power-k/core/types";
// local imports
import { TPowerKNavigationCommandKeys, usePowerKNavigationCommandsRecord } from "./commands";

export const usePowerKNavigationCommands = (): TPowerKCommandConfig[] => {
  const optionsList: Record<TPowerKNavigationCommandKeys, TPowerKCommandConfig> = usePowerKNavigationCommandsRecord();

  return [
    // User-level Navigation
    optionsList["open-workspace"],
    optionsList["nav-home"],
    optionsList["nav-inbox"],
    optionsList["nav-your-work"],
    optionsList["nav-account-settings"],
    // Workspace-Level Navigation
    optionsList["open-project"],
    optionsList["nav-projects-list"],
    optionsList["nav-all-workspace-work-items"],
    optionsList["nav-assigned-workspace-work-items"],
    optionsList["nav-created-workspace-work-items"],
    optionsList["nav-subscribed-workspace-work-items"],
    optionsList["nav-workspace-analytics"],
    optionsList["nav-workspace-drafts"],
    optionsList["nav-workspace-archives"],
    optionsList["open-workspace-setting"],
    optionsList["nav-workspace-settings"],
    // Project-Level Navigation (Only visible in project context)
    optionsList["nav-project-work-items"],
    optionsList["open-project-cycle"],
    optionsList["nav-project-cycles"],
    optionsList["open-project-module"],
    optionsList["nav-project-modules"],
    optionsList["open-project-view"],
    optionsList["nav-project-views"],
    optionsList["nav-project-pages"],
    optionsList["nav-project-intake"],
    optionsList["nav-project-archives"],
    optionsList["open-project-setting"],
    optionsList["nav-project-settings"],
  ];
};
