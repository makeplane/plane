"use client";

// components
import { AppHeader, ContentWrapper } from "@/components/core";
import { ProjectArchivesHeader } from "../header";

export default function ProjectArchiveCyclesLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AppHeader header={<ProjectArchivesHeader />} />
      <ContentWrapper>{children}</ContentWrapper>
    </>
  );
}
