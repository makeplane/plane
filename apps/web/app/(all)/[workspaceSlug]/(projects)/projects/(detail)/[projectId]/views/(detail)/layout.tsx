"use client";

import { AppHeader } from "@/components/core/app-header";
import { ContentWrapper } from "@/components/core/content-wrapper";
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
