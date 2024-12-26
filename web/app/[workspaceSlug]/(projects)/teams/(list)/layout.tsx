"use client";

import { ReactNode } from "react";
// components
import { AppHeader, ContentWrapper } from "@/components/core";
// plane web components
import { TeamsListHeader } from "@/plane-web/components/teams/headers/list-header";

export default function TeamsListLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <AppHeader header={<TeamsListHeader />} />
      <ContentWrapper>{children}</ContentWrapper>
    </>
  );
}
