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

import { useMemo } from "react";
import { observer } from "mobx-react";
import { EUserPermissions, EUserPermissionsLevel } from "@plane/constants";
import { SidebarWrapper } from "@/components/sidebar/sidebar-wrapper";
import { SidebarFavoritesMenu } from "@/components/workspace/sidebar/favorites/favorites-menu";
import { SidebarProjectsList } from "@/components/workspace/sidebar/projects-list";
import { SidebarQuickActions } from "@/components/workspace/sidebar/quick-actions";
import { SidebarMenuItems } from "@/components/workspace/sidebar/sidebar-menu-items";
import { useFavorite } from "@/hooks/store/use-favorite";
import { useUserPermissions } from "@/hooks/store/user";
import { SidebarTeamsList } from "@/components/workspace/sidebar/teamspaces/root";

export const AppSidebar = observer(function AppSidebar() {
  const { allowPermissions } = useUserPermissions();
  const { groupedFavorites } = useFavorite();

  const canPerformWorkspaceMemberActions = useMemo(
    () => allowPermissions([EUserPermissions.ADMIN, EUserPermissions.MEMBER], EUserPermissionsLevel.WORKSPACE),
    [allowPermissions]
  );

  const hasFavorites = useMemo(() => {
    if (!groupedFavorites) return false;
    return Object.keys(groupedFavorites).length > 0;
  }, [groupedFavorites]);

  const showFavorites = canPerformWorkspaceMemberActions && hasFavorites;

  return (
    <SidebarWrapper title="Projects" quickActions={<SidebarQuickActions />}>
      <SidebarMenuItems />
      {showFavorites && <SidebarFavoritesMenu />}
      <SidebarTeamsList />
      <SidebarProjectsList />
    </SidebarWrapper>
  );
});
