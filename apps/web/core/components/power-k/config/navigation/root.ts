/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

// components
import type { TPowerKCommandConfig } from "@/components/power-k/core/types";
// plane web imports
import type { TPowerKNavigationCommandKeysExtended } from "@/components/command-palette/power-k/commands/navigation";
import { usePowerKNavigationCommandsRecordExtended } from "@/components/command-palette/power-k/commands/navigation";
// local imports
import type { TPowerKNavigationCommandKeys } from "./commands";
import { usePowerKNavigationCommandsRecord } from "./commands";

export const usePowerKNavigationCommands = (): TPowerKCommandConfig[] => {
  const optionsList: Record<TPowerKNavigationCommandKeys, TPowerKCommandConfig> = usePowerKNavigationCommandsRecord();
  const optionsListExtended: Record<TPowerKNavigationCommandKeysExtended, TPowerKCommandConfig> =
    usePowerKNavigationCommandsRecordExtended();

  return [
    // Open actions from lowest to highest scope
    optionsList["open_project_cycle"],
    optionsList["open_project_module"],
    optionsList["open_project_view"],
    optionsList["open_project_setting"],
    optionsList["open_project"],
    optionsListExtended["open_teamspace"],
    optionsListExtended["open_initiative"],
    optionsListExtended["open_customer"],
    optionsList["open_workspace_setting"],
    optionsList["open_workspace"],
    // User-Level Navigation
    optionsList["nav_home"],
    optionsList["nav_inbox"],
    optionsList["nav_your_work"],
    // Project-Level Navigation (Only visible in project context)
    optionsListExtended["nav_project_epics"],
    optionsList["nav_project_work_items"],
    optionsList["nav_project_pages"],
    optionsList["nav_project_cycles"],
    optionsList["nav_project_modules"],
    optionsList["nav_project_views"],
    optionsList["nav_project_intake"],
    optionsListExtended["nav_project_overview"],
    optionsList["nav_project_settings"],
    optionsList["nav_project_archives"],
    // Navigate to workspace-level pages
    optionsList["nav_all_workspace_work_items"],
    optionsList["nav_assigned_workspace_work_items"],
    optionsList["nav_created_workspace_work_items"],
    optionsList["nav_subscribed_workspace_work_items"],
    optionsListExtended["nav_workspace_active_cycle"],
    optionsList["nav_workspace_analytics"],
    optionsList["nav_workspace_settings"],
    optionsList["nav_workspace_drafts"],
    optionsList["nav_workspace_archives"],
    optionsListExtended["nav_teamspaces_list"],
    optionsListExtended["nav_initiatives_list"],
    optionsListExtended["nav_workspace_dashboards"],
    optionsListExtended["nav_customers_list"],
    optionsList["nav_projects_list"],
    // Account-Level Navigation
    optionsList["nav_account_settings"],
  ];
};
