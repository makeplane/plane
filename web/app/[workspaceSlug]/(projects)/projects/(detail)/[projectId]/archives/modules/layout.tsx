"use client";

// components
import { AppHeader, ContentWrapper } from "@/components/core";
import { ProjectArchivesHeader } from "../header";

export default function ProjectArchiveModulesLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AppHeader header={<ProjectArchivesHeader activeTab="modules" />} />
      <ContentWrapper>{children}</ContentWrapper>
    </>
  );
}
