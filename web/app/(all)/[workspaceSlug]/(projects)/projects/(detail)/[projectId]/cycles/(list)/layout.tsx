"use client";

// components
import { AppHeader, ContentWrapper } from "@/components/core";
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
