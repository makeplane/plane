"use client";

import { AppHeader } from "@/components/core/app-header";
import { ContentWrapper } from "@/components/core/content-wrapper";
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
