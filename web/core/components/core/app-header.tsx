"use client";

import { ReactNode } from "react";
// components
import { SidebarHamburgerToggle } from "@/components/core";
import { RegularRow } from "../containers";

export interface AppHeaderProps {
  header: ReactNode;
  mobileHeader?: ReactNode;
}

export const AppHeader = (props: AppHeaderProps) => {
  const { header, mobileHeader } = props;

  return (
    <div className="z-[15] !bg-blue-200">
      <RegularRow className="h-[3.75rem] z-10 flex gap-2 w-full items-center border-b border-custom-border-200">
        <div className="block bg-custom-sidebar-background-100 md:hidden">
          <SidebarHamburgerToggle />
        </div>
        <div className="w-full">{header}</div>
      </RegularRow>
      {mobileHeader && mobileHeader}
    </div>
  );
};
