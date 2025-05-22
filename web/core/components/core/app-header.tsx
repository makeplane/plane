"use client";

import { ReactNode } from "react";
// plane ui
import { Row } from "@plane/ui";
// local components
import { SidebarHamburgerToggle } from "@/components/core/sidebar/sidebar-menu-hamburger-toggle";

export interface AppHeaderProps {
  header: ReactNode;
  mobileHeader?: ReactNode;
}

export const AppHeader = (props: AppHeaderProps) => {
  const { header, mobileHeader } = props;

  return (
    <div className="z-[18]">
      <Row className="h-[3.75rem] flex gap-2 w-full items-center border-b border-custom-border-200 bg-custom-sidebar-background-100">
        <div className="block bg-custom-sidebar-background-100 md:hidden">
          <SidebarHamburgerToggle />
        </div>
        <div className="w-full">{header}</div>
      </Row>
      {mobileHeader && mobileHeader}
    </div>
  );
};
