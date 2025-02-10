"use client";

import { AppHeader, ContentWrapper } from "@/components/core";
// local components
import { TeamspacePageDetailHeader } from "./header";

export default function TeamspacePageDetailLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AppHeader header={<TeamspacePageDetailHeader />} />
      <ContentWrapper>{children}</ContentWrapper>
    </>
  );
}
