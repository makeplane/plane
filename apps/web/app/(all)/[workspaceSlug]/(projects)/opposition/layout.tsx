"use client";

// components
import { AppHeader } from "@/components/core/app-header";
import { ContentWrapper } from "@/components/core/content-wrapper";
import { OppositionSearchProvider } from "./(context)/opposition-search-context";
import { OppositionTeamsProvider } from "./(context)/opposition-teams-context";
import { WorkspaceOppositionHeader } from "./header";

export default function WorkspaceOppositionLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <OppositionTeamsProvider>
        <OppositionSearchProvider>
          <AppHeader header={<WorkspaceOppositionHeader />} />
          <ContentWrapper>{children}</ContentWrapper>
        </OppositionSearchProvider>
      </OppositionTeamsProvider>
    </>
  );
}
