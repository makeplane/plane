"use client";

import { AppHeader, ContentWrapper } from "@/components/core";
import WorkspaceAccessWrapper from "@/layouts/access/workspace-wrapper";
import { WorkspaceActiveCycleHeader } from "./header";
export default function WorkspaceActiveCycleLayout({ children }: { children: React.ReactNode }) {
  return (
    <WorkspaceAccessWrapper pageKey="active_cycles">
      <AppHeader header={<WorkspaceActiveCycleHeader />} />
      <ContentWrapper>{children}</ContentWrapper>
    </WorkspaceAccessWrapper>
  );
}
