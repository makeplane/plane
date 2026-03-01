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
import { EUserPermissionsLevel } from "@plane/constants";
import { CustomersIcon, InitiativeIcon, TeamsIcon } from "@plane/propel/icons";
import { EUserWorkspaceRoles } from "@plane/types";
// components
import type { TPowerKCommandConfig, TPowerKContext } from "@/components/power-k/core/types";
// hooks
import { useCommandPalette } from "@/hooks/store/use-command-palette";
import { useUser } from "@/hooks/store/user";
// plane web imports
import { isSidebarFeatureEnabled } from "@/helpers/sidebar";
import { useDashboards } from "@/plane-web/hooks/store";

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
  const {
    permission: { allowPermissions },
  } = useUser();
  const { toggleCreateTeamspaceModal, toggleCreateInitiativeModal, toggleCreateCustomerModal } = useCommandPalette();
  const {
    workspaceDashboards: { canCurrentUserCreateDashboard, toggleCreateUpdateModal: toggleWorkspaceDashboardModal },
  } = useDashboards();
  // derived values
  const hasWorkspaceAdminLevelPermissions = (ctx: TPowerKContext) =>
    allowPermissions(
      [EUserWorkspaceRoles.ADMIN],
      EUserPermissionsLevel.WORKSPACE,
      ctx.params.workspaceSlug?.toString()
    );
  const hasWorkspaceMemberLevelPermissions = (ctx: TPowerKContext) =>
    allowPermissions(
      [EUserWorkspaceRoles.ADMIN, EUserWorkspaceRoles.MEMBER],
      EUserPermissionsLevel.WORKSPACE,
      ctx.params.workspaceSlug?.toString()
    );
  const baseWorkspaceConditions = (ctx: TPowerKContext) => Boolean(ctx.params.workspaceSlug?.toString());
  const isWorkspaceFeatureEnabled = (ctx: TPowerKContext, featureKey: string) => {
    if (!ctx.params.workspaceSlug?.toString()) return false;
    return isSidebarFeatureEnabled(featureKey, ctx.params.workspaceSlug?.toString());
  };

  return {
    create_teamspace: {
      id: "create_teamspace",
      type: "action",
      group: "create",
      i18n_title: "power_k.creation_actions.create_teamspace",
      icon: TeamsIcon,
      keySequence: "nt",
      action: () => toggleCreateTeamspaceModal({ isOpen: true, teamspaceId: undefined }),
      isEnabled: (ctx) =>
        baseWorkspaceConditions(ctx) &&
        isWorkspaceFeatureEnabled(ctx, "team_spaces") &&
        hasWorkspaceAdminLevelPermissions(ctx),
      isVisible: (ctx) =>
        baseWorkspaceConditions(ctx) &&
        isWorkspaceFeatureEnabled(ctx, "team_spaces") &&
        hasWorkspaceAdminLevelPermissions(ctx),
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
      isEnabled: (ctx) =>
        baseWorkspaceConditions(ctx) &&
        isWorkspaceFeatureEnabled(ctx, "initiatives") &&
        hasWorkspaceMemberLevelPermissions(ctx),
      isVisible: (ctx) =>
        baseWorkspaceConditions(ctx) &&
        isWorkspaceFeatureEnabled(ctx, "initiatives") &&
        hasWorkspaceMemberLevelPermissions(ctx),
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
        baseWorkspaceConditions(ctx) &&
        isWorkspaceFeatureEnabled(ctx, "workspace-dashboards") &&
        canCurrentUserCreateDashboard,
      isVisible: (ctx) =>
        baseWorkspaceConditions(ctx) &&
        isWorkspaceFeatureEnabled(ctx, "workspace-dashboards") &&
        canCurrentUserCreateDashboard,
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
      isEnabled: (ctx) =>
        baseWorkspaceConditions(ctx) &&
        isWorkspaceFeatureEnabled(ctx, "customers") &&
        hasWorkspaceAdminLevelPermissions(ctx),
      isVisible: (ctx) =>
        baseWorkspaceConditions(ctx) &&
        isWorkspaceFeatureEnabled(ctx, "customers") &&
        hasWorkspaceAdminLevelPermissions(ctx),
      closeOnSelect: true,
    },
  };
};
