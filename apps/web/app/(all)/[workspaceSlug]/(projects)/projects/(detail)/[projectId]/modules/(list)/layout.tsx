"use client";

// components
import { AppHeader, ContentWrapper } from "@/components/core";
import { ModulesListHeader } from "./header";
import { ModulesListMobileHeader } from "./mobile-header";

export default function ProjectModulesListLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AppHeader header={<ModulesListHeader />} mobileHeader={<ModulesListMobileHeader />} />
      <ContentWrapper>{children}</ContentWrapper>
    </>
  );
}
