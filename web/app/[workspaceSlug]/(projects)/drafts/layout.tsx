"use client";

import { AppHeader, ContentWrapper } from "@/components/core";
import { WorkspaceDraftIssuesHeader } from "./header";

export default function WorkspaceDraftIssuesLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AppHeader header={<WorkspaceDraftIssuesHeader />} />
      <ContentWrapper>{children}</ContentWrapper>
    </>
  );
}
