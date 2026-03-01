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
import type { TPowerKCreationCommandKeysExtended } from "@/components/command-palette/power-k/commands/creation";
import { usePowerKCreationCommandsRecordExtended } from "@/components/command-palette/power-k/commands/creation";
// local imports
import { usePowerKCreationCommandsRecord } from "./command";
import type { TPowerKCreationCommandKeys } from "./command";

export const usePowerKCreationCommands = (): TPowerKCommandConfig[] => {
  const optionsList: Record<TPowerKCreationCommandKeys, TPowerKCommandConfig> = usePowerKCreationCommandsRecord();
  const optionsListExtended: Record<TPowerKCreationCommandKeysExtended, TPowerKCommandConfig> =
    usePowerKCreationCommandsRecordExtended();

  return [
    optionsList["create_work_item"],
    optionsList["create_page"],
    optionsList["create_view"],
    optionsList["create_cycle"],
    optionsList["create_module"],
    optionsList["create_project"],
    optionsListExtended["create_teamspace"],
    optionsListExtended["create_initiative"],
    optionsListExtended["create_workspace_dashboard"],
    optionsListExtended["create_customer"],
    optionsList["create_workspace"],
  ];
};
