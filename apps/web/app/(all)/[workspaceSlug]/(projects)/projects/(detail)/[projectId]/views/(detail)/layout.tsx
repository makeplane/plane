"use client";

import { Outlet } from "react-router";
import { AppHeader } from "@/components/core/app-header";
import { ContentWrapper } from "@/components/core/content-wrapper";
// local components
import { ProjectViewIssuesHeader } from "./[viewId]/header";

export default function ProjectViewIssuesLayout() {
  return (
    <>
      <AppHeader header={<ProjectViewIssuesHeader />} />
      <ContentWrapper>
        <Outlet />
      </ContentWrapper>
    </>
  );
}
