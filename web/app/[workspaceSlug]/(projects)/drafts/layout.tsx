"use client";

import { AppHeader, ContentWrapper } from "@/components/core";
import { WorkspaceDraftHeader } from "./header";

export default function WorkspaceDraftLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AppHeader header={<WorkspaceDraftHeader />} />
      <ContentWrapper>{children}</ContentWrapper>
    </>
  );
}
