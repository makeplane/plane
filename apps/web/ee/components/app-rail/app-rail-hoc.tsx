// hoc/withDockItems.tsx
"use client";

import React from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { PlaneNewIcon, PiIcon, WikiIcon } from "@plane/propel/icons";
import type { AppSidebarItemData } from "@/components/sidebar/sidebar-item";
import { useWorkspacePaths } from "@/hooks/use-workspace-paths";
import { isAppRailFeatureEnabled } from "@/plane-web/helpers/app-rail.helper";

type WithDockItemsProps = {
  dockItems: (AppSidebarItemData & { shouldRender: boolean })[];
};

export function withDockItems<P extends WithDockItemsProps>(WrappedComponent: React.ComponentType<P>) {
  const ComponentWithDockItems = observer((props: Omit<P, keyof WithDockItemsProps>) => {
    const { workspaceSlug } = useParams();
    const { isProjectsPath, isWikiPath, isAiPath } = useWorkspacePaths();

    const dockItems: (AppSidebarItemData & { shouldRender: boolean })[] = [
      {
        label: "Projects",
        icon: <PlaneNewIcon className="size-4" />,
        href: `/${workspaceSlug}/`,
        isActive: isProjectsPath,
        shouldRender: isAppRailFeatureEnabled("projects"),
      },
      {
        label: "Wiki",
        icon: <WikiIcon className="size-4" />,
        href: `/${workspaceSlug}/pages`,
        isActive: isWikiPath,
        shouldRender: isAppRailFeatureEnabled("wiki"),
      },
      {
        label: "Pi",
        icon: <PiIcon className="size-4" />,
        href: `/${workspaceSlug}/pi-chat`,
        isActive: isAiPath,
        shouldRender: isAppRailFeatureEnabled("pi-chat"),
      },
    ];

    return <WrappedComponent {...(props as P)} dockItems={dockItems} />;
  });

  return ComponentWithDockItems;
}
