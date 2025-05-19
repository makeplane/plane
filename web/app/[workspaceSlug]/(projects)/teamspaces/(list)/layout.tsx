"use client";

import { ReactNode } from "react";
// components
import { AppHeader, ContentWrapper } from "@/components/core";
// plane web components
import { TeamspaceListItemHeader } from "@/plane-web/components/teamspaces/headers/list-header";

export default function TeamspaceListItemLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <AppHeader header={<TeamspaceListItemHeader />} />
      <ContentWrapper>{children}</ContentWrapper>
    </>
  );
}
