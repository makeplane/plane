/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { Collapsible } from "@makeplane/propel/components/collapsible";
// plane imports
import { AnalyticsOutline, CyclesOutline, ProjectsOutline, ViewsOutline } from "@makeplane/propel/icons";
import { useTranslation } from "@plane/i18n";
import { EUserWorkspaceRoles } from "@plane/types";
// hooks
import useLocalStorage from "@/hooks/use-local-storage";
// local imports
import { SidebarWorkspaceMenuHeader } from "./workspace-menu-header";
import { SidebarWorkspaceMenuItem } from "./workspace-menu-item";

export const SidebarWorkspaceMenu = observer(function SidebarWorkspaceMenu() {
  // router params
  const { workspaceSlug } = useParams();
  // translation
  const { t } = useTranslation();
  // local storage
  const { setValue: toggleWorkspaceMenu, storedValue } = useLocalStorage<boolean>("is_workspace_menu_open", true);
  // derived values
  const isWorkspaceMenuOpen = !!storedValue;

  const SIDEBAR_WORKSPACE_MENU_ITEMS = [
    {
      key: "projects",
      labelTranslationKey: "sidebar.projects",
      href: `/${workspaceSlug}/projects/`,
      access: [EUserWorkspaceRoles.ADMIN, EUserWorkspaceRoles.MEMBER, EUserWorkspaceRoles.GUEST],
      Icon: ProjectsOutline,
    },
    {
      key: "views",
      labelTranslationKey: "sidebar.views",
      href: `/${workspaceSlug}/workspace-views/all-issues/`,
      access: [EUserWorkspaceRoles.ADMIN, EUserWorkspaceRoles.MEMBER, EUserWorkspaceRoles.GUEST],
      Icon: ViewsOutline,
    },
    {
      key: "active-cycles",
      labelTranslationKey: "sidebar.cycles",
      href: `/${workspaceSlug}/active-cycles/`,
      access: [EUserWorkspaceRoles.ADMIN, EUserWorkspaceRoles.MEMBER],
      Icon: CyclesOutline,
    },
    {
      key: "analytics",
      labelTranslationKey: "sidebar.analytics",
      href: `/${workspaceSlug}/analytics/`,
      access: [EUserWorkspaceRoles.ADMIN, EUserWorkspaceRoles.MEMBER],
      Icon: AnalyticsOutline,
    },
  ];

  return (
    <Collapsible
      // the group marker lives on the root: CollapsibleHeader takes no className
      render={<div className="group/workspace-button mt-2.5" />}
      placement="sidebar"
      open={isWorkspaceMenuOpen}
      onOpenChange={toggleWorkspaceMenu}
      trigger={<span className="text-13 font-semibold text-placeholder">{t("common.workspace")}</span>}
      trailing={<SidebarWorkspaceMenuHeader />}
    >
      <div className="mt-0.5 flex flex-col gap-0.5">
        {SIDEBAR_WORKSPACE_MENU_ITEMS.map((item) => (
          <SidebarWorkspaceMenuItem key={item.key} item={item} />
        ))}
      </div>
    </Collapsible>
  );
});
