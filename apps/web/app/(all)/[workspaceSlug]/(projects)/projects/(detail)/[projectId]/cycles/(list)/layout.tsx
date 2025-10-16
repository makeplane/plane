"use client";

// components
import { AppHeader } from "@/components/core/app-header";
import { ContentWrapper } from "@/components/core/content-wrapper";
import { CyclesListHeader } from "./header";
import { CyclesListMobileHeader } from "./mobile-header";

export default function ProjectCyclesListLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AppHeader header={<CyclesListHeader />} mobileHeader={<CyclesListMobileHeader />} />
      <ContentWrapper>{children}</ContentWrapper>
    </>
  );
}
