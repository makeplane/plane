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

import { LayoutGrid, RssIcon } from "lucide-react";
// plane imports
import { EUserPermissionsLevel } from "@plane/constants";
import { ContrastIcon, CustomersIcon, EpicIcon, InitiativeIcon, TeamsIcon } from "@plane/propel/icons";
import type { TCustomer, TTeamspace } from "@plane/types";
import { EUserProjectRoles, EUserWorkspaceRoles } from "@plane/types";
// components
import type { TPowerKCommandConfig, TPowerKContext } from "@/components/power-k/core/types";
import { handlePowerKNavigate } from "@/components/power-k/utils/navigation";
// hooks
import { useUser } from "@/hooks/store/user";
import { isSidebarFeatureEnabled } from "@/helpers/sidebar";
import { useFeatureFlags } from "@/plane-web/hooks/store";
import { useProjectAdvanced } from "@/plane-web/hooks/store/projects/use-projects";
import type { TInitiative } from "@/types/initiative";

export type TPowerKNavigationCommandKeysExtended =
  | "nav_workspace_active_cycle"
  | "open_teamspace"
  | "nav_teamspaces_list"
  | "open_initiative"
  | "nav_initiatives_list"
  | "open_customer"
  | "nav_customers_list"
  | "nav_workspace_dashboards"
  | "nav_project_overview"
  | "nav_project_epics";

/**
 * Navigation commands - Navigate to all pages in the app
 */
export const usePowerKNavigationCommandsRecordExtended = (): Record<
  TPowerKNavigationCommandKeysExtended,
  TPowerKCommandConfig
> => {
  // store hooks
  const {
    permission: { allowPermissions },
  } = useUser();
  const { getFeatureFlag } = useFeatureFlags();
  const { getProjectFeatures } = useProjectAdvanced();
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
  const hasProjectMemberLevelPermissions = (ctx: TPowerKContext) =>
    allowPermissions(
      [EUserProjectRoles.ADMIN, EUserProjectRoles.MEMBER],
      EUserPermissionsLevel.PROJECT,
      ctx.params.workspaceSlug?.toString(),
      ctx.params.projectId?.toString()
    );
  const baseWorkspaceConditions = (ctx: TPowerKContext) => Boolean(ctx.params.workspaceSlug?.toString());
  const baseProjectConditions = (ctx: TPowerKContext) =>
    Boolean(ctx.params.workspaceSlug?.toString() && ctx.params.projectId?.toString());
  const isWorkspaceFeatureEnabled = (ctx: TPowerKContext, featureKey: string) => {
    if (!ctx.params.workspaceSlug?.toString()) return false;
    return isSidebarFeatureEnabled(featureKey, ctx.params.workspaceSlug?.toString());
  };
  const isProjectFeatureEnabled = (ctx: TPowerKContext, featureKey: "overview" | "epics") => {
    const workspaceSlug = ctx.params.workspaceSlug?.toString();
    const projectId = ctx.params.projectId?.toString();

    if (!workspaceSlug || !projectId) return false;

    if (featureKey === "overview") return !!getFeatureFlag(workspaceSlug, "PROJECT_OVERVIEW", false);

    if (featureKey === "epics") {
      const projectFeatures = getProjectFeatures(projectId);
      return !!projectFeatures?.is_epic_enabled;
    }

    return false;
  };

  return {
    nav_workspace_active_cycle: {
      id: "nav_workspace_active_cycle",
      type: "action",
      group: "navigation",
      i18n_title: "power_k.navigation_actions.nav_workspace_active_cycle",
      icon: ContrastIcon,
      action: (ctx) => handlePowerKNavigate(ctx, [ctx.params.workspaceSlug?.toString(), "active-cycles"]),
      isEnabled: (ctx) =>
        baseWorkspaceConditions(ctx) &&
        hasWorkspaceMemberLevelPermissions(ctx) &&
        isWorkspaceFeatureEnabled(ctx, "active-cycles"),
      isVisible: (ctx) =>
        baseWorkspaceConditions(ctx) &&
        hasWorkspaceMemberLevelPermissions(ctx) &&
        isWorkspaceFeatureEnabled(ctx, "active-cycles"),
      closeOnSelect: true,
    },
    open_teamspace: {
      id: "open_teamspace",
      type: "change-page",
      group: "navigation",
      i18n_title: "power_k.navigation_actions.open_teamspace",
      icon: TeamsIcon,
      keySequence: "ot",
      page: "open-teamspace",
      onSelect: (data, ctx) => {
        const teamspaceDetails = data as TTeamspace;
        handlePowerKNavigate(ctx, [ctx.params.workspaceSlug?.toString(), "teamspaces", teamspaceDetails.id]);
      },
      isEnabled: (ctx) =>
        baseWorkspaceConditions(ctx) &&
        hasWorkspaceMemberLevelPermissions(ctx) &&
        isWorkspaceFeatureEnabled(ctx, "team_spaces"),
      isVisible: (ctx) =>
        baseWorkspaceConditions(ctx) &&
        hasWorkspaceMemberLevelPermissions(ctx) &&
        isWorkspaceFeatureEnabled(ctx, "team_spaces"),
      closeOnSelect: true,
    },
    nav_teamspaces_list: {
      id: "nav_teamspaces_list",
      type: "action",
      group: "navigation",
      i18n_title: "power_k.navigation_actions.nav_teamspaces_list",
      icon: TeamsIcon,
      keySequence: "gt",
      action: (ctx) => handlePowerKNavigate(ctx, [ctx.params.workspaceSlug?.toString(), "teamspaces"]),
      isEnabled: (ctx) =>
        baseWorkspaceConditions(ctx) &&
        hasWorkspaceMemberLevelPermissions(ctx) &&
        isWorkspaceFeatureEnabled(ctx, "team_spaces"),
      isVisible: (ctx) =>
        baseWorkspaceConditions(ctx) &&
        hasWorkspaceMemberLevelPermissions(ctx) &&
        isWorkspaceFeatureEnabled(ctx, "team_spaces"),
      closeOnSelect: true,
    },
    open_initiative: {
      id: "open_initiative",
      type: "change-page",
      group: "navigation",
      i18n_title: "power_k.navigation_actions.open_initiative",
      icon: InitiativeIcon,
      keySequence: "on",
      page: "open-initiative",
      onSelect: (data, ctx) => {
        const initiativeDetails = data as TInitiative;
        handlePowerKNavigate(ctx, [ctx.params.workspaceSlug?.toString(), "initiatives", initiativeDetails.id]);
      },
      isEnabled: (ctx) =>
        baseWorkspaceConditions(ctx) &&
        hasWorkspaceMemberLevelPermissions(ctx) &&
        isWorkspaceFeatureEnabled(ctx, "initiatives"),
      isVisible: (ctx) =>
        baseWorkspaceConditions(ctx) &&
        hasWorkspaceMemberLevelPermissions(ctx) &&
        isWorkspaceFeatureEnabled(ctx, "initiatives"),
      closeOnSelect: true,
    },
    nav_initiatives_list: {
      id: "nav_initiatives_list",
      type: "action",
      group: "navigation",
      i18n_title: "power_k.navigation_actions.nav_initiatives_list",
      icon: InitiativeIcon,
      keySequence: "gn",
      action: (ctx) => handlePowerKNavigate(ctx, [ctx.params.workspaceSlug?.toString(), "initiatives"]),
      isEnabled: (ctx) =>
        baseWorkspaceConditions(ctx) &&
        hasWorkspaceMemberLevelPermissions(ctx) &&
        isWorkspaceFeatureEnabled(ctx, "initiatives"),
      isVisible: (ctx) =>
        baseWorkspaceConditions(ctx) &&
        hasWorkspaceMemberLevelPermissions(ctx) &&
        isWorkspaceFeatureEnabled(ctx, "initiatives"),
      closeOnSelect: true,
    },
    open_customer: {
      id: "open_customer",
      type: "change-page",
      group: "navigation",
      i18n_title: "power_k.navigation_actions.open_customer",
      icon: CustomersIcon,
      keySequence: "ou",
      page: "open-customer",
      onSelect: (data, ctx) => {
        const customerDetails = data as TCustomer;
        handlePowerKNavigate(ctx, [ctx.params.workspaceSlug?.toString(), "customers", customerDetails.id]);
      },
      isEnabled: (ctx) =>
        baseWorkspaceConditions(ctx) &&
        hasWorkspaceAdminLevelPermissions(ctx) &&
        isWorkspaceFeatureEnabled(ctx, "customers"),
      isVisible: (ctx) =>
        baseWorkspaceConditions(ctx) &&
        hasWorkspaceAdminLevelPermissions(ctx) &&
        isWorkspaceFeatureEnabled(ctx, "customers"),
      closeOnSelect: true,
    },
    nav_customers_list: {
      id: "nav_customers_list",
      type: "action",
      group: "navigation",
      i18n_title: "power_k.navigation_actions.nav_customers_list",
      icon: CustomersIcon,
      keySequence: "gu",
      action: (ctx) => handlePowerKNavigate(ctx, [ctx.params.workspaceSlug?.toString(), "customers"]),
      isEnabled: (ctx) =>
        baseWorkspaceConditions(ctx) &&
        hasWorkspaceAdminLevelPermissions(ctx) &&
        isWorkspaceFeatureEnabled(ctx, "customers"),
      isVisible: (ctx) =>
        baseWorkspaceConditions(ctx) &&
        hasWorkspaceAdminLevelPermissions(ctx) &&
        isWorkspaceFeatureEnabled(ctx, "customers"),
      closeOnSelect: true,
    },
    nav_workspace_dashboards: {
      id: "nav_workspace_dashboards",
      type: "action",
      group: "navigation",
      i18n_title: "power_k.navigation_actions.nav_workspace_dashboards",
      icon: LayoutGrid,
      keySequence: "gb",
      action: (ctx) => handlePowerKNavigate(ctx, [ctx.params.workspaceSlug?.toString(), "dashboards"]),
      isEnabled: (ctx) =>
        baseWorkspaceConditions(ctx) &&
        hasWorkspaceMemberLevelPermissions(ctx) &&
        isWorkspaceFeatureEnabled(ctx, "workspace-dashboards"),
      isVisible: (ctx) =>
        baseWorkspaceConditions(ctx) &&
        hasWorkspaceMemberLevelPermissions(ctx) &&
        isWorkspaceFeatureEnabled(ctx, "workspace-dashboards"),
      closeOnSelect: true,
    },
    nav_project_overview: {
      id: "nav_project_overview",
      type: "action",
      group: "navigation",
      i18n_title: "power_k.navigation_actions.nav_project_overview",
      icon: RssIcon,
      action: (ctx) =>
        handlePowerKNavigate(ctx, [
          ctx.params.workspaceSlug?.toString(),
          "projects",
          ctx.params.projectId?.toString(),
          "overview",
        ]),
      isEnabled: (ctx) =>
        baseProjectConditions(ctx) && hasProjectMemberLevelPermissions(ctx) && isProjectFeatureEnabled(ctx, "overview"),
      isVisible: (ctx) =>
        baseProjectConditions(ctx) && hasProjectMemberLevelPermissions(ctx) && isProjectFeatureEnabled(ctx, "overview"),
      closeOnSelect: true,
    },
    nav_project_epics: {
      id: "nav_project_epics",
      type: "action",
      group: "navigation",
      i18n_title: "power_k.navigation_actions.nav_project_epics",
      icon: EpicIcon,
      keySequence: "ge",
      action: (ctx) =>
        handlePowerKNavigate(ctx, [
          ctx.params.workspaceSlug?.toString(),
          "projects",
          ctx.params.projectId?.toString(),
          "epics",
        ]),
      isEnabled: (ctx) =>
        baseProjectConditions(ctx) && hasProjectMemberLevelPermissions(ctx) && isProjectFeatureEnabled(ctx, "epics"),
      isVisible: (ctx) =>
        baseProjectConditions(ctx) && hasProjectMemberLevelPermissions(ctx) && isProjectFeatureEnabled(ctx, "epics"),
      closeOnSelect: true,
    },
  };
};
