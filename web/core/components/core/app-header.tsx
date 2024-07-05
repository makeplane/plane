"use client";

import { ReactNode } from "react";
// components
import { SidebarHamburgerToggle } from "@/components/core";

export interface AppHeaderProps {
  header: ReactNode;
  mobileHeader?: ReactNode;
}

export const AppHeader = (props: AppHeaderProps) => {
  const { header, mobileHeader } = props;

  return (
    <>
      <div className="z-[15]">
        <div className="z-10 flex w-full items-center border-b border-custom-border-200">
          <div className="block bg-custom-sidebar-background-100 py-4 pl-5 md:hidden">
            <SidebarHamburgerToggle />
          </div>
          <div className="w-full">{header}</div>
        </div>
        {mobileHeader && mobileHeader}
      </div>
    </>
  );
};
