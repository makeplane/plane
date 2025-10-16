"use client";

import type { ReactNode } from "react";
// components
import { AppHeader } from "@/components/core/app-header";
import { ContentWrapper } from "@/components/core/content-wrapper";
// local components
import { ProjectsListHeader } from "@/plane-web/components/projects/header";
import { ProjectsListMobileHeader } from "@/plane-web/components/projects/mobile-header";
export default function ProjectListLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <AppHeader header={<ProjectsListHeader />} mobileHeader={<ProjectsListMobileHeader />} />
      <ContentWrapper>{children}</ContentWrapper>
    </>
  );
}
