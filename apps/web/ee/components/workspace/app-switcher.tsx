"use client";

import React from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { Grip } from "lucide-react";
import { Popover } from "@headlessui/react";
// plane imports
import { PlaneNewIcon, WikiIcon } from "@plane/ui";
import { cn } from "@plane/utils";
// components
import { AppSidebarItem, AppSidebarItemData } from "@/components/sidebar";
// hooks
import { useWorkspacePaths } from "@/hooks/use-workspace-paths";

export const WorkspaceAppSwitcher = observer(() => {
  // router
  const { workspaceSlug } = useParams();

  // derived values
  const { isWikiPath, isProjectsPath } = useWorkspacePaths();

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
    <Popover as="div">
      <Popover.Button
        as="button"
        type="button"
        className={({ open }) =>
          cn("flex items-center justify-center p-1 rounded hover:bg-custom-background-80 outline-none", {
            "bg-custom-background-80": open,
          })
        }
      >
        <Grip className="size-5 text-custom-sidebar-text-400" />
      </Popover.Button>
      <Popover.Panel
        as="div"
        className="fixed z-20 flex items-center gap-6 rounded border-[0.5px] border-custom-border-300 bg-custom-background-100 shadow-custom-shadow-rg p-4"
      >
        {dockItems.map((item) => (
          <div key={item.label} className="min-w-[3.125rem]">
            <AppSidebarItem item={item} />
          </div>
        ))}
      </Popover.Panel>
    </Popover>
  );
});
