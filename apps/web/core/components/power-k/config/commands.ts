/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// local imports
import type { TPowerKCommandConfig } from "../core/types";
import { usePowerKContextBasedActions } from "../ui/pages/context-based";
import { usePowerKAccountCommands } from "./account-commands";
import { usePowerKCreationCommands } from "./creation/root";
import { usePowerKHelpCommands } from "./help-commands";
import { usePowerKMiscellaneousCommands } from "./miscellaneous-commands";
import { usePowerKNavigationCommands } from "./navigation/root";
import { usePowerKPreferencesCommands } from "./preferences-commands";

export const useProjectsAppPowerKCommands = (): TPowerKCommandConfig[] => {
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
    ...contextualCommands,
    ...accountCommands,
    ...miscellaneousCommands,
    ...preferencesCommands,
    ...helpCommands,
  ];
};
