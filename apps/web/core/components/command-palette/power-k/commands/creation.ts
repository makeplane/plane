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

import { LayoutGrid } from "lucide-react";
// plane imports
import { CustomersIcon, InitiativeIcon, TeamsIcon } from "@plane/propel/icons";
// components
import type { TPowerKCommandConfig } from "@/components/power-k/core/types";
// hooks
import { useCommandPalette } from "@/hooks/store/use-command-palette";
// plane web imports
import { useDashboards } from "@/plane-web/hooks/store";
import { usePowerKPermissions } from "@/components/command-palette/power-k/hooks/use-power-k-permissions";

export type TPowerKCreationCommandKeysExtended =
  | "create_teamspace"
  | "create_initiative"
  | "create_workspace_dashboard"
  | "create_customer";

/**
 * Creation commands - Create any entity in the app
 */
export const usePowerKCreationCommandsRecordExtended = (): Record<
  TPowerKCreationCommandKeysExtended,
  TPowerKCommandConfig
> => {
  // store hooks
  const { canCreateResource } = usePowerKPermissions();
  const { toggleCreateTeamspaceModal, toggleCreateInitiativeModal, toggleCreateCustomerModal } = useCommandPalette();
  const {
    workspaceDashboards: { toggleCreateUpdateModal: toggleWorkspaceDashboardModal },
  } = useDashboards();

  return {
    create_teamspace: {
      id: "create_teamspace",
      type: "action",
      group: "create",
      i18n_title: "power_k.creation_actions.create_teamspace",
      icon: TeamsIcon,
      keySequence: "nt",
      action: () => toggleCreateTeamspaceModal({ isOpen: true, teamspaceId: undefined }),
      isEnabled: (ctx) => canCreateResource(ctx.params.workspaceSlug, ctx.params.projectId, "create_teamspace"),
      isVisible: (ctx) => canCreateResource(ctx.params.workspaceSlug, ctx.params.projectId, "create_teamspace"),
      closeOnSelect: true,
    },
    create_initiative: {
      id: "create_initiative",
      type: "action",
      group: "create",
      i18n_title: "power_k.creation_actions.create_initiative",
      icon: InitiativeIcon,
      keySequence: "nn",
      action: () => toggleCreateInitiativeModal({ isOpen: true, initiativeId: undefined }),
      isEnabled: (ctx) => canCreateResource(ctx.params.workspaceSlug, ctx.params.projectId, "create_initiative"),
      isVisible: (ctx) => canCreateResource(ctx.params.workspaceSlug, ctx.params.projectId, "create_initiative"),
      closeOnSelect: true,
    },
    create_workspace_dashboard: {
      id: "create_workspace_dashboard",
      type: "action",
      group: "create",
      i18n_title: "power_k.creation_actions.create_workspace_dashboard",
      icon: LayoutGrid,
      keySequence: "nb",
      action: () => toggleWorkspaceDashboardModal(true),
      isEnabled: (ctx) =>
        canCreateResource(ctx.params.workspaceSlug, ctx.params.projectId, "create_workspace_dashboard"),
      isVisible: (ctx) =>
        canCreateResource(ctx.params.workspaceSlug, ctx.params.projectId, "create_workspace_dashboard"),
      closeOnSelect: true,
    },
    create_customer: {
      id: "create_customer",
      type: "action",
      group: "create",
      i18n_title: "power_k.creation_actions.create_customer",
      icon: CustomersIcon,
      keySequence: "nu",
      action: () => toggleCreateCustomerModal({ isOpen: true, customerId: undefined }),
      isEnabled: (ctx) => canCreateResource(ctx.params.workspaceSlug, ctx.params.projectId, "create_customer"),
      isVisible: (ctx) => canCreateResource(ctx.params.workspaceSlug, ctx.params.projectId, "create_customer"),
      closeOnSelect: true,
    },
  };
};
