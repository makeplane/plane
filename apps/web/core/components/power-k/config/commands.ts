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

// local imports
import type { TPowerKCommandConfig } from "../core/types";
import { usePowerKContextBasedActions } from "../ui/pages/context-based";
import { usePowerKAccountCommands } from "./account-commands";
import { usePowerKActionsCommands } from "./actions-commands";
import { usePowerKCreationCommands } from "./creation/root";
import { usePowerKHelpCommands } from "./help-commands";
import { usePowerKMiscellaneousCommands } from "./miscellaneous-commands";
import { usePowerKNavigationCommands } from "./navigation/root";
import { usePowerKPreferencesCommands } from "./preferences-commands";

export const useProjectsAppPowerKCommands = (): TPowerKCommandConfig[] => {
  const actionsCommands = usePowerKActionsCommands();
  const navigationCommands = usePowerKNavigationCommands();
  const creationCommands = usePowerKCreationCommands();
  const contextualCommands = usePowerKContextBasedActions();
  const accountCommands = usePowerKAccountCommands();
  const miscellaneousCommands = usePowerKMiscellaneousCommands();
  const preferencesCommands = usePowerKPreferencesCommands();
  const helpCommands = usePowerKHelpCommands();

  return [
    ...navigationCommands,
    ...creationCommands,
    ...actionsCommands,
    ...contextualCommands,
    ...accountCommands,
    ...miscellaneousCommands,
    ...preferencesCommands,
    ...helpCommands,
  ];
};
