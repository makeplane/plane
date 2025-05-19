"use client";

import React, { FC } from "react";
// utils
import { cn } from "@plane/utils";

type TSidebarWrapperProps = {
  children: React.ReactNode;
  isSidebarOpen: boolean;
};

export const SidebarWrapper: FC<TSidebarWrapperProps> = (props) => {
  const { children, isSidebarOpen } = props;
  return (
    <div
      className={cn(
        `absolute right-0 flex flex-col gap-4 h-full border-l border-custom-border-200 bg-custom-sidebar-background-100 pt-5 pb-10 sm:relative transition-[width] ease-linear`,
        {
          "w-0 hidden": !isSidebarOpen,
          "min-w-[300px] w-full sm:w-1/2  md:w-1/3 lg:min-w-80 xl:min-w-96": isSidebarOpen,
        }
      )}
      style={!isSidebarOpen ? { right: `-${window?.innerWidth || 0}px` } : {}}
    >
      {children}
    </div>
  );
};
