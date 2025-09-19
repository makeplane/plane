"use client";

import { AppHeader } from "@/components/core/app-header";
import { ContentWrapper } from "@/components/core/content-wrapper";
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
