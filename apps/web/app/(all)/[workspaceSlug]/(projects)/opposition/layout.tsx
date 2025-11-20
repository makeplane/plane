"use client";

// components
import { AppHeader } from "@/components/core/app-header";
import { ContentWrapper } from "@/components/core/content-wrapper";
import { WorkspaceOppositionHeader } from "./header";
import { OppositionSearchProvider } from "./opposition-search-context";

export default function WorkspaceOppositionLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <OppositionSearchProvider>
        <AppHeader header={<WorkspaceOppositionHeader />} />
        <ContentWrapper>{children}</ContentWrapper>
      </OppositionSearchProvider>
    </>
  );
}
