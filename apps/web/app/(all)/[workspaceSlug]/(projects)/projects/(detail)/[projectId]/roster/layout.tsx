"use client";

import { AppHeader } from "@/components/core/app-header";
import { ContentWrapper } from "@/components/core/content-wrapper";
import { ProjectRosterHeader, RosterProvider } from "@/plane-web/features/roster";

export default function ProjectRosterLayout({ children }: { children: React.ReactNode }) {
  return (
    <RosterProvider>
      <AppHeader header={<ProjectRosterHeader />} />
      <ContentWrapper>{children}</ContentWrapper>
    </RosterProvider>
  );
}
