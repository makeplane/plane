"use client";

// components
import { AppHeader } from "@/components/core/app-header";
import { ContentWrapper } from "@/components/core/content-wrapper";
import {
  OppositionSearchProvider,
  OppositionTeamsProvider,
  WorkspaceOppositionHeader,
} from "@/plane-web/features/opposition";

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
