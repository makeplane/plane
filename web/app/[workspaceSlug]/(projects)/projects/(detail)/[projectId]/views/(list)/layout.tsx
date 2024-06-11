"use client";

import { AppHeader, ContentWrapper } from "@/components/core";
// local components
import { ProjectViewsHeader } from "./header";

export default function ProjectViewsListLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AppHeader header={<ProjectViewsHeader />} />
      <ContentWrapper>{children}</ContentWrapper>
    </>
  );
}
