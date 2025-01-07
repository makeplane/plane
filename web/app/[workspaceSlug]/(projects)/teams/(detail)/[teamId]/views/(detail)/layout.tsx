"use client";

import { AppHeader, ContentWrapper } from "@/components/core";
// local components
import { TeamViewIssuesHeader } from "./header";

export default function TeamViewIssuesLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AppHeader header={<TeamViewIssuesHeader />} />
      <ContentWrapper>{children}</ContentWrapper>
    </>
  );
}
