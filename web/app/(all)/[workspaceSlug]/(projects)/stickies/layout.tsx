"use client";

import { AppHeader, ContentWrapper } from "@/components/core";
import { WorkspaceStickyHeader } from "./header";

export default function WorkspaceStickiesLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AppHeader header={<WorkspaceStickyHeader />} />
      <ContentWrapper>{children}</ContentWrapper>
    </>
  );
}
