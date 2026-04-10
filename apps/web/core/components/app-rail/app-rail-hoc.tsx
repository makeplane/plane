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

// hoc/withDockItems.tsx
import React from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { EUserPermissions, EUserPermissionsLevel } from "@plane/constants";
import { PlaneNewIcon, PiIcon, WikiIcon } from "@plane/propel/icons";
import type { AppSidebarItemData } from "@/components/sidebar/sidebar-item";
import { useUserPermissions } from "@/hooks/store/user";
import { useWorkspacePaths } from "@/hooks/use-workspace-paths";
import { isAppRailFeatureConfigured, isAppRailFeatureEnabled } from "@/helpers/app-rail";

type WithDockItemsProps = {
  dockItems: (AppSidebarItemData & { shouldRender: boolean })[];
};

export function withDockItems<P extends WithDockItemsProps>(WrappedComponent: React.ComponentType<P>) {
  const ComponentWithDockItems = observer(function ComponentWithDockItems(props: Omit<P, keyof WithDockItemsProps>) {
    const { workspaceSlug } = useParams();
    const { isProjectsPath, isWikiPath, isAiPath, isNotificationsPath } = useWorkspacePaths();
    const { allowPermissions } = useUserPermissions();
    const isNotGuest = allowPermissions(
      [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
      EUserPermissionsLevel.WORKSPACE,
      workspaceSlug?.toString()
    );

    const dockItems: (AppSidebarItemData & { shouldRender: boolean })[] = [
      {
        label: "Projects",
        icon: <PlaneNewIcon className="size-5" />,
        href: `/${workspaceSlug}/`,
        isActive: isProjectsPath && !isNotificationsPath,
        shouldRender: isAppRailFeatureEnabled(workspaceSlug, "projects"),
      },
      {
        label: "Wiki",
        icon: <WikiIcon className="size-5" />,
        href: `/${workspaceSlug}/wiki`,
        isActive: isWikiPath,
        shouldRender: isNotGuest && isAppRailFeatureEnabled(workspaceSlug, "wiki"),
      },
      {
        label: "AI",
        icon: <PiIcon className="size-5" />,
        href: `/${workspaceSlug}/ai-chat`,
        isActive: isAiPath,
        shouldRender:
          isAppRailFeatureEnabled(workspaceSlug, "pi-chat") && isAppRailFeatureConfigured(workspaceSlug, "pi-chat"),
      },
    ];

    return <WrappedComponent {...(props as P)} dockItems={dockItems} />;
  });

  return ComponentWithDockItems;
}
