"use client";

import { AppHeader } from "@/components/core/app-header";
import { ContentWrapper } from "@/components/core/content-wrapper";
import { WorkspaceActiveCycleHeader } from "./header";

export default function WorkspaceActiveCycleLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AppHeader header={<WorkspaceActiveCycleHeader />} />
      <ContentWrapper>{children}</ContentWrapper>
    </>
  );
}
