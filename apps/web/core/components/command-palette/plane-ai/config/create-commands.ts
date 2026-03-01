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

import { SquarePlus } from "lucide-react";
// components
import type { TPowerKCommandConfig } from "@/components/power-k/core/types";
// plane web imports
import { getIsWorkspaceCreationDisabled } from "@/helpers/workspace";

export type TPowerKCreationCommandKeys = "create_work_item" | "create_workspace";

/**
 * Creation commands - Create any entity in the app
 */
export const usePlaneAiAppPowerKCreationCommands = (): TPowerKCommandConfig[] => {
  const isWorkspaceCreationDisabled = getIsWorkspaceCreationDisabled();

  return [
    {
      id: "create_workspace",
      type: "action",
      group: "create",
      i18n_title: "power_k.creation_actions.create_workspace",
      icon: SquarePlus,
      action: (ctx) => ctx.router.push("/create-workspace"),
      isEnabled: () => !isWorkspaceCreationDisabled,
      isVisible: () => !isWorkspaceCreationDisabled,
      closeOnSelect: true,
    },
  ];
};
