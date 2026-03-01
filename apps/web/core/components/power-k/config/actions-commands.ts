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
// plane imports
import { EUserPermissionsLevel } from "@plane/constants";
import { EUserProjectRoles } from "@plane/types";
// components
import type { TPowerKCommandConfig, TPowerKContext } from "@/components/power-k/core/types";
// hooks
import { useCommandPalette } from "@/hooks/store/use-command-palette";
import { useUserPermissions } from "@/hooks/store/user/user-permissions";

export const usePowerKActionsCommands = (): TPowerKCommandConfig[] => {
  // store hooks
  const { toggleBulkDeleteIssueModal } = useCommandPalette();
  const { allowPermissions } = useUserPermissions();
  // derived values
  const hasProjectMemberLevelPermissions = (ctx: TPowerKContext) =>
    allowPermissions(
      [EUserProjectRoles.ADMIN, EUserProjectRoles.MEMBER],
      EUserPermissionsLevel.PROJECT,
      ctx.params.workspaceSlug?.toString(),
      ctx.params.projectId?.toString()
    );

  return [
    {
      id: "bulk_delete_work_items",
      i18n_title: "power_k.actions_commands.bulk_delete_work_items",
      icon: TrashIcon,
      group: "actions",
      type: "action",
      action: () => toggleBulkDeleteIssueModal(true),
      keySequence: "backspace",
      isEnabled: (ctx) =>
        Boolean(ctx.params.workspaceSlug?.toString() || ctx.params.projectId?.toString()) &&
        hasProjectMemberLevelPermissions(ctx),
      isVisible: (ctx) =>
        Boolean(ctx.params.workspaceSlug?.toString() || ctx.params.projectId?.toString()) &&
        hasProjectMemberLevelPermissions(ctx),
      closeOnSelect: true,
    },
  ];
};
