"use client";

import { AppHeader } from "@/components/core/app-header";
import { ContentWrapper } from "@/components/core/content-wrapper";
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
