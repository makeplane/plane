"use client";

// components
import { AppHeader, ContentWrapper } from "@/components/core";
import { ModulesListHeader } from "./header";
import { ModulesListMobileHeader } from "./mobile-header";

const ProjectModulesListLayout = ({ children }: { children: React.ReactNode }) => (
  <>
    <AppHeader header={<ModulesListHeader />} mobileHeader={<ModulesListMobileHeader />} />
    <ContentWrapper>{children}</ContentWrapper>
  </>
);

export default ProjectModulesListLayout;
