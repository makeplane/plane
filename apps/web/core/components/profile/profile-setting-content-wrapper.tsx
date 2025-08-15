"use client";
import React, { FC } from "react";
// plane imports
import { cn } from "@plane/utils";
// components
import { SidebarHamburgerToggle } from "@/components/core/sidebar/sidebar-menu-hamburger-toggle";
// plane web components
import { isSidebarToggleVisible } from "@/plane-web/components/desktop";

type Props = {
  children: React.ReactNode;
  className?: string;
};

export const ProfileSettingContentWrapper: FC<Props> = (props) => {
  const { children, className = "" } = props;
  return (
    <div className="flex h-full flex-col">
      {isSidebarToggleVisible() && (
        <div className="block flex-shrink-0 border-b border-custom-border-200 p-4 md:hidden">
          <SidebarHamburgerToggle />
        </div>
      )}

      <div
        className={cn(
          "vertical-scrollbar scrollbar-md mx-auto h-full w-full flex flex-col px-8 md:px-20 lg:px-36 xl:px-56 py-10 md:py-16",
          className
        )}
      >
        {children}
      </div>
    </div>
  );
};
