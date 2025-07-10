"use client";

import React from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// plane imports
import { PlaneNewIcon, WikiIcon } from "@plane/ui";
// components
import { AppSidebarItem, type AppSidebarItemData } from "@/components/sidebar";
// hooks
import { useWorkspacePaths } from "@/hooks/use-workspace-paths";

export const AppSidebarItemsRoot = observer(() => {
  // router
  const { workspaceSlug } = useParams();
  // hooks
  const { isProjectsPath, isWikiPath } = useWorkspacePaths();

  const dockItems: AppSidebarItemData[] = [
    {
      label: "Projects",
      icon: <PlaneNewIcon className="size-4" />,
      href: `/${workspaceSlug}/`,
      isActive: isProjectsPath,
    },
    {
      label: "Wiki",
      icon: <WikiIcon className="size-4" />,
      href: `/${workspaceSlug}/pages`,
      isActive: isWikiPath,
    },
  ];

  return (
    <>
      {dockItems.map((item) => (
        <AppSidebarItem key={item.label} item={item} variant="link" />
      ))}
    </>
  );
});
