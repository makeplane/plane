"use client";

// components
import { AppHeader } from "@/components/core/app-header";
import { ContentWrapper } from "@/components/core/content-wrapper";
import WorkspaceAccessWrapper from "@/layouts/access/workspace-wrapper";
// local imports
import { WorkspaceDraftHeader } from "./header";

export default function WorkspaceDraftLayout({ children }: { children: React.ReactNode }) {
  return (
    <WorkspaceAccessWrapper pageKey="drafts">
      <AppHeader header={<WorkspaceDraftHeader />} />
      <ContentWrapper>{children}</ContentWrapper>
    </WorkspaceAccessWrapper>
  );
}
