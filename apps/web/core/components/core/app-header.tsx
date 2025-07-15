"use client";

import { ReactNode } from "react";
import { observer } from "mobx-react";
// plane imports
import { Row } from "@plane/ui";
// components
import { AppSidebarToggleButton } from "@/components/sidebar";
// hooks
import { useAppTheme } from "@/hooks/store";

export interface AppHeaderProps {
  header: ReactNode;
  mobileHeader?: ReactNode;
}

export const AppHeader = observer((props: AppHeaderProps) => {
  const { header, mobileHeader } = props;
  // store hooks
  const { sidebarCollapsed } = useAppTheme();

  return (
    <div className="z-[18]">
      <Row className="h-[3.25rem] flex gap-2 w-full items-center border-b border-custom-border-200 bg-custom-sidebar-background-100">
        {sidebarCollapsed && <AppSidebarToggleButton />}
        <div className="w-full">{header}</div>
      </Row>
      {mobileHeader && mobileHeader}
    </div>
  );
});
