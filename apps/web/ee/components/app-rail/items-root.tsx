// components/AppSidebarItemsRoot.tsx
"use client";

import React from "react";
import { AppSidebarItem, AppSidebarItemData } from "@/components/sidebar";
import { withDockItems } from "./app-rail-hoc";

type Props = {
  dockItems: (AppSidebarItemData & { shouldRender: boolean })[];
};

const Component = ({ dockItems }: Props) => (
  <>
    {dockItems
      .filter((item) => item.shouldRender)
      .map((item) => (
        <AppSidebarItem key={item.label} item={item} variant="link" />
      ))}
  </>
);

export const AppSidebarItemsRoot = withDockItems(Component);
