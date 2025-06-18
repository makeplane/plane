"use client";

// components
import { AppHeader, ContentWrapper } from "@/components/core";
// local components
import { EpicsHeader } from "./header";
import { ProjectEpicMobileHeader } from "./mobile-header";

export default function ProjectEpicsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AppHeader header={<EpicsHeader />} mobileHeader={<ProjectEpicMobileHeader />} />
      <ContentWrapper>{children}</ContentWrapper>
    </>
  );
}
