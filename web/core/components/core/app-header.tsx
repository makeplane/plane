"use client";

import { ReactNode } from "react";
import { isDesktopApp } from "@todesktop/client-core/platform/todesktop";
// components
import { CustomRow } from "@plane/ui";
import { SidebarHamburgerToggle } from "@/components/core";

export interface AppHeaderProps {
  header: ReactNode;
  mobileHeader?: ReactNode;
}

export const AppHeader = (props: AppHeaderProps) => {
  const { header, mobileHeader } = props;

  return (
    <div className="z-[15]">
      <CustomRow className="h-[3.75rem] z-10 flex gap-2 w-full items-center border-b border-custom-border-200">
        {!isDesktopApp() && (
          <div className="block bg-custom-sidebar-background-100 md:hidden">
            <SidebarHamburgerToggle />
          </div>
        )}
        <div className="w-full">{header}</div>
      </CustomRow>
      {mobileHeader && mobileHeader}
    </div>
  );
};
