"use client";

// components
import { AppHeader } from "@/components/core/app-header";
import { ContentWrapper } from "@/components/core/content-wrapper";
// local components
import { ProjectOverviewHeader } from "./header";

export default function ProjectOverviewLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AppHeader header={<ProjectOverviewHeader />} />
      <ContentWrapper className="overflow-hidden">{children}</ContentWrapper>
    </>
  );
}
