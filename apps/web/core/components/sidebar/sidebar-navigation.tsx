"use client";
import type { FC } from "react";
import React from "react";
// helpers
import { cn } from "@plane/utils";

type TSidebarNavItem = {
  className?: string;
  isActive?: boolean;
  children?: React.ReactNode;
};

export const SidebarNavItem: FC<TSidebarNavItem> = (props) => {
  const { className, isActive, children } = props;
  return (
    <div
      className={cn(
        "cursor-pointer relative group w-full flex items-center justify-between gap-1.5 rounded px-2 py-1 outline-none",
        {
          "text-custom-text-200 bg-custom-background-80/75": isActive,
          "text-custom-sidebar-text-200 hover:bg-custom-sidebar-background-90 active:bg-custom-sidebar-background-90":
            !isActive,
        },
        className
      )}
    >
      {children}
    </div>
  );
};
