"use client";

// components
import { AppHeader, ContentWrapper } from "@/components/core";
import { CyclesListHeader } from "./header";
import { CyclesListMobileHeader } from "./mobile-header";

const ProjectCyclesListLayout = ({ children }: { children: React.ReactNode }) => (
  <>
    <AppHeader header={<CyclesListHeader />} mobileHeader={<CyclesListMobileHeader />} />
    <ContentWrapper>{children}</ContentWrapper>
  </>
);

export default ProjectCyclesListLayout;
