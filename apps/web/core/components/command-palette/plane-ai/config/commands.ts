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
import { usePowerKAccountCommands } from "@/components/power-k/config/account-commands";
import { usePowerKHelpCommands } from "@/components/power-k/config/help-commands";
import { usePowerKMiscellaneousCommands } from "@/components/power-k/config/miscellaneous-commands";
import { usePowerKPreferencesCommands } from "@/components/power-k/config/preferences-commands";
import type { TPowerKCommandConfig } from "@/components/power-k/core/types";
// local imports
import { usePlaneAiAppPowerKCreationCommands } from "./create-commands";

export const usePlaneAiAppPowerKCommands = (): TPowerKCommandConfig[] => {
  const creationCommands = usePlaneAiAppPowerKCreationCommands();
  const accountCommands = usePowerKAccountCommands();
  const miscellaneousCommands = usePowerKMiscellaneousCommands();
  const preferencesCommands = usePowerKPreferencesCommands();
  const helpCommands = usePowerKHelpCommands();

  return [...creationCommands, ...accountCommands, ...miscellaneousCommands, ...preferencesCommands, ...helpCommands];
};
