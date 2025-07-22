"use client";

import { ReactNode } from "react";
import { observer } from "mobx-react";
// plane imports
import { Row } from "@plane/ui";
// components
import { ExtendedAppHeader } from "@/plane-web/components/common";

export interface AppHeaderProps {
  header: ReactNode;
  mobileHeader?: ReactNode;
}

export const AppHeader = observer((props: AppHeaderProps) => {
  const { header, mobileHeader } = props;

  return (
    <div className="z-[18]">
      <Row className="h-header flex gap-2 w-full items-center border-b border-custom-border-200 bg-custom-sidebar-background-100">
        <ExtendedAppHeader header={header} />
      </Row>
      {mobileHeader && mobileHeader}
    </div>
  );
});
