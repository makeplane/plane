"use client";

// components
import { AppHeader, ContentWrapper } from "@/components/core";
import { ProjectOverviewHeader } from "./header";

export default function ProjectOverviewLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AppHeader header={<ProjectOverviewHeader />} />
      <ContentWrapper className="overflow-hidden">{children}</ContentWrapper>
    </>
  );
}
