"use client";

// components
import { AppHeader } from "@/components/core/app-header";
import { ContentWrapper } from "@/components/core/content-wrapper";
import WorkspaceAccessWrapper from "@/layouts/access/workspace-wrapper";
// local imports
import { WorkspaceActiveCycleHeader } from "./header";

export default function WorkspaceActiveCycleLayout({ children }: { children: React.ReactNode }) {
  return (
    <WorkspaceAccessWrapper pageKey="active_cycles">
      <AppHeader header={<WorkspaceActiveCycleHeader />} />
      <ContentWrapper>{children}</ContentWrapper>
    </WorkspaceAccessWrapper>
  );
}
