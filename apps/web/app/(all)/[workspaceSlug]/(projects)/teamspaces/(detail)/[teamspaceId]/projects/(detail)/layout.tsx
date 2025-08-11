"use client";

import { AppHeader, ContentWrapper } from "@/components/core";
// local components
import { TeamspaceProjectDetailHeader } from "./header";

export default function TeamspaceProjectDetailLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AppHeader header={<TeamspaceProjectDetailHeader />} />
      <ContentWrapper>{children}</ContentWrapper>
    </>
  );
}
