"use client";

import { AppHeader, ContentWrapper } from "@/components/core";
// local components
import { ProjectViewIssuesHeader } from "./[viewId]/header";

export default function ProjectViewIssuesLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AppHeader header={<ProjectViewIssuesHeader />} />
      <ContentWrapper>{children}</ContentWrapper>
    </>
  );
}
