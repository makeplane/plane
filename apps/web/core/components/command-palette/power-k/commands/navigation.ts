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
import { ContrastIcon, CustomersIcon, EpicIcon, InitiativeIcon, TeamsIcon } from "@plane/propel/icons";
import type { TCustomer, TTeamspace } from "@plane/types";
// components
import type { TPowerKCommandConfig } from "@/components/power-k/core/types";
import { handlePowerKNavigate } from "@/components/power-k/utils/navigation";
// hooks
import { usePowerKPermissions } from "@/components/command-palette/power-k/hooks/use-power-k-permissions";
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
  // hooks
  const { canNavigateTo } = usePowerKPermissions();

  return {
    nav_workspace_active_cycle: {
      id: "nav_workspace_active_cycle",
      type: "action",
      group: "navigation",
      i18n_title: "power_k.navigation_actions.nav_workspace_active_cycle",
      icon: ContrastIcon,
      action: (ctx) => handlePowerKNavigate(ctx, [ctx.params.workspaceSlug?.toString(), "active-cycles"]),
      isEnabled: (ctx) => canNavigateTo(ctx.params.workspaceSlug, ctx.params.projectId, "nav_workspace_active_cycle"),
      isVisible: (ctx) => canNavigateTo(ctx.params.workspaceSlug, ctx.params.projectId, "nav_workspace_active_cycle"),
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
      isEnabled: (ctx) => canNavigateTo(ctx.params.workspaceSlug, ctx.params.projectId, "open_teamspace"),
      isVisible: (ctx) => canNavigateTo(ctx.params.workspaceSlug, ctx.params.projectId, "open_teamspace"),
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
      isEnabled: (ctx) => canNavigateTo(ctx.params.workspaceSlug, ctx.params.projectId, "open_initiative"),
      isVisible: (ctx) => canNavigateTo(ctx.params.workspaceSlug, ctx.params.projectId, "open_initiative"),
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
      isEnabled: (ctx) => canNavigateTo(ctx.params.workspaceSlug, ctx.params.projectId, "open_initiative"),
      isVisible: (ctx) => canNavigateTo(ctx.params.workspaceSlug, ctx.params.projectId, "open_initiative"),
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
      isEnabled: (ctx) => canNavigateTo(ctx.params.workspaceSlug, ctx.params.projectId, "nav_initiatives_list"),
      isVisible: (ctx) => canNavigateTo(ctx.params.workspaceSlug, ctx.params.projectId, "nav_initiatives_list"),
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
      isEnabled: (ctx) => canNavigateTo(ctx.params.workspaceSlug, ctx.params.projectId, "open_customer"),
      isVisible: (ctx) => canNavigateTo(ctx.params.workspaceSlug, ctx.params.projectId, "open_customer"),
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
      isEnabled: (ctx) => canNavigateTo(ctx.params.workspaceSlug, ctx.params.projectId, "nav_customers_list"),
      isVisible: (ctx) => canNavigateTo(ctx.params.workspaceSlug, ctx.params.projectId, "nav_customers_list"),
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
      isEnabled: (ctx) => canNavigateTo(ctx.params.workspaceSlug, ctx.params.projectId, "nav_workspace_dashboards"),
      isVisible: (ctx) => canNavigateTo(ctx.params.workspaceSlug, ctx.params.projectId, "nav_workspace_dashboards"),
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
      isEnabled: (ctx) => canNavigateTo(ctx.params.workspaceSlug, ctx.params.projectId, "nav_project_overview"),
      isVisible: (ctx) => canNavigateTo(ctx.params.workspaceSlug, ctx.params.projectId, "nav_project_overview"),
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
      isEnabled: (ctx) => canNavigateTo(ctx.params.workspaceSlug, ctx.params.projectId, "nav_project_epics"),
      isVisible: (ctx) => canNavigateTo(ctx.params.workspaceSlug, ctx.params.projectId, "nav_project_epics"),
      closeOnSelect: true,
    },
  };
};
