"use client";

import { AppHeader } from "@/components/core/app-header";
import { ContentWrapper } from "@/components/core/content-wrapper";
import { WorkspaceStickyHeader } from "./header";

export default function WorkspaceStickiesLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AppHeader header={<WorkspaceStickyHeader />} />
      <ContentWrapper>{children}</ContentWrapper>
    </>
  );
}
