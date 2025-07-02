"use client";

import { AppHeader, ContentWrapper } from "@/components/core";
import WorkspaceAccessWrapper from "@/layouts/access/workspace-wrapper";
import { WorkspaceDraftHeader } from "./header";

export default function WorkspaceDraftLayout({ children }: { children: React.ReactNode }) {
  return (
    <WorkspaceAccessWrapper pageKey="drafts">
      <AppHeader header={<WorkspaceDraftHeader />} />
      <ContentWrapper>{children}</ContentWrapper>
    </WorkspaceAccessWrapper>
  );
}
