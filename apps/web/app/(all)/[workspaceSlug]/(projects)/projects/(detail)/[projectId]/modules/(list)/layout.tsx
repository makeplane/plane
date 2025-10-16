"use client";

// components
import { AppHeader } from "@/components/core/app-header";
import { ContentWrapper } from "@/components/core/content-wrapper";
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
