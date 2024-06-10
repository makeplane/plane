"use client";

import { AppHeader, ContentWrapper } from "@/components/core";
import { WorkspaceActiveCycleHeader } from "./header";

export default function WorkspaceActiveCycleLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AppHeader header={<WorkspaceActiveCycleHeader />} />
      <ContentWrapper>{children}</ContentWrapper>
    </>
  );
}
