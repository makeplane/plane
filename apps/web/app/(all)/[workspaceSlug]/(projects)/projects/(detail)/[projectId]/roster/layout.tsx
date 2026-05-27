"use client";

import { AppHeader } from "@/components/core/app-header";
import { ContentWrapper } from "@/components/core/content-wrapper";
import { ProjectRosterHeader } from "./header";
import { RosterProvider } from "./roster-context";

export default function ProjectRosterLayout({ children }: { children: React.ReactNode }) {
  return (
    <RosterProvider>
      <AppHeader header={<ProjectRosterHeader />} />
      <ContentWrapper>{children}</ContentWrapper>
    </RosterProvider>
  );
}
