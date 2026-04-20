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

import { TrashIcon } from "@plane/propel/icons";
// components
import type { TPowerKCommandConfig } from "@/components/power-k/core/types";
// hooks
import { useCommandPalette } from "@/hooks/store/use-command-palette";
import { usePowerKPermissions } from "@/components/command-palette/power-k/hooks/use-power-k-permissions";

export type TPowerKActionsCommandKeys = "bulk_delete_work_items";

export const usePowerKActionsCommands = (): Record<TPowerKActionsCommandKeys, TPowerKCommandConfig> => {
  // store hooks
  const { toggleBulkDeleteIssueModal } = useCommandPalette();
  const { canPerformAction } = usePowerKPermissions();

  return {
    bulk_delete_work_items: {
      id: "bulk_delete_work_items",
      i18n_title: "power_k.actions_commands.bulk_delete_work_items",
      icon: TrashIcon,
      group: "actions",
      type: "action",
      action: () => toggleBulkDeleteIssueModal(true),
      keySequence: "backspace",
      isEnabled: (ctx) =>
        canPerformAction(
          ctx.params.workspaceSlug?.toString(),
          ctx.params.projectId?.toString(),
          "bulk_delete_work_items"
        ),
      isVisible: (ctx) =>
        canPerformAction(
          ctx.params.workspaceSlug?.toString(),
          ctx.params.projectId?.toString(),
          "bulk_delete_work_items"
        ),
      closeOnSelect: true,
    },
  };
};
