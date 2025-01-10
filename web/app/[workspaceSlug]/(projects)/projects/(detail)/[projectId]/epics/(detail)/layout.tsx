"use client";

// components
import { AppHeader, ContentWrapper } from "@/components/core";
import { ProjectEpicDetailsHeader } from "./header";

export default function ProjectEpicDetailsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AppHeader header={<ProjectEpicDetailsHeader />} />
      <ContentWrapper className="overflow-hidden">{children}</ContentWrapper>
    </>
  );
}
