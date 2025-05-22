"use client";

import { AppHeader } from "@/components/core/app-header";
import { ContentWrapper } from "@/components/core/content-wrapper";
import { WorkspaceDraftHeader } from "./header";

export default function WorkspaceDraftLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AppHeader header={<WorkspaceDraftHeader />} />
      <ContentWrapper>{children}</ContentWrapper>
    </>
  );
}
