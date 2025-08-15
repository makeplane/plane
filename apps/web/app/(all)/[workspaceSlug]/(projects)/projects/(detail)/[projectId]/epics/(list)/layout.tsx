"use client";

// components
import { AppHeader } from "@/components/core/app-header";
import { ContentWrapper } from "@/components/core/content-wrapper";
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
