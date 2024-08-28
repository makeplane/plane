"use client";

import { AppHeader, ContentWrapper } from "@/components/core";
// local components
import { ProjectViewsHeader } from "./header";
import { ViewMobileHeader } from "./mobile-header";

export default function ProjectViewsListLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AppHeader header={<ProjectViewsHeader />} mobileHeader={<ViewMobileHeader />} />
      <ContentWrapper>{children}</ContentWrapper>
    </>
  );
}
