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

import { FileText, SquarePlus } from "lucide-react";
// components
import type { TPowerKCommandConfig } from "@/components/power-k/core/types";
import { usePowerKPermissions } from "@/components/command-palette/power-k/hooks/use-power-k-permissions";
// hooks
import { useCommandPalette } from "@/hooks/store/use-command-palette";

export type TPowerKCreationCommandKeys = "create_work_item" | "create_workspace";

/**
 * Creation commands - Create any entity in the app
 */
export const useWikiAppPowerKCreationCommands = (): TPowerKCommandConfig[] => {
  // store
  const { toggleCreatePageModal } = useCommandPalette();
  const { canCreateResource } = usePowerKPermissions();

  return [
    {
      id: "create_page",
      type: "action",
      group: "create",
      i18n_title: "power_k.creation_actions.create_page",
      icon: FileText,
      shortcut: "d",
      action: () => toggleCreatePageModal({ isOpen: true }),
      isEnabled: (ctx) => canCreateResource(ctx.params.workspaceSlug, ctx.params.projectId, "create_page"),
      isVisible: (ctx) => canCreateResource(ctx.params.workspaceSlug, ctx.params.projectId, "create_page"),
      closeOnSelect: true,
    },
    {
      id: "create_workspace",
      type: "action",
      group: "create",
      i18n_title: "power_k.creation_actions.create_workspace",
      icon: SquarePlus,
      action: (ctx) => ctx.router.push("/create-workspace"),
      isEnabled: (ctx) => canCreateResource(ctx.params.workspaceSlug, ctx.params.projectId, "create_workspace"),
      isVisible: (ctx) => canCreateResource(ctx.params.workspaceSlug, ctx.params.projectId, "create_workspace"),
      closeOnSelect: true,
    },
  ];
};
