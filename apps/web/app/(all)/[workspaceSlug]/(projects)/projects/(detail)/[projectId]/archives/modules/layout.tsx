"use client";

// components
import { AppHeader } from "@/components/core/app-header";
import { ContentWrapper } from "@/components/core/content-wrapper";
import { ProjectArchivesHeader } from "../header";

export default function ProjectArchiveModulesLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AppHeader header={<ProjectArchivesHeader activeTab="modules" />} />
      <ContentWrapper>{children}</ContentWrapper>
    </>
  );
}
