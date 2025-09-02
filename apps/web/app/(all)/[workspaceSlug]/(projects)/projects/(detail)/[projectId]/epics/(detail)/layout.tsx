"use client";

// components
import { AppHeader } from "@/components/core/app-header";
import { ContentWrapper } from "@/components/core/content-wrapper";
import { ProjectEpicDetailsHeader } from "./header";

export default function ProjectEpicDetailsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AppHeader header={<ProjectEpicDetailsHeader />} />
      <ContentWrapper className="overflow-hidden">{children}</ContentWrapper>
    </>
  );
}
