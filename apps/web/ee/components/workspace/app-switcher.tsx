// components/WorkspaceAppSwitcher.tsx
"use client";

import React from "react";
import { Grip } from "lucide-react";
import { Popover } from "@headlessui/react";
import { cn } from "@plane/utils";
import { AppSidebarItem, AppSidebarItemData } from "@/components/sidebar/sidebar-item";
import { withDockItems } from "../app-rail";

type Props = {
  dockItems: (AppSidebarItemData & { shouldRender: boolean })[];
};

const Component = ({ dockItems }: Props) => (
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
      {dockItems
        .filter((item) => item.shouldRender)
        .map((item) => (
          <div key={item.label} className="min-w-[3.125rem]">
            <AppSidebarItem item={item} />
          </div>
        ))}
    </Popover.Panel>
  </Popover>
);

export const WorkspaceAppSwitcher = withDockItems(Component);
