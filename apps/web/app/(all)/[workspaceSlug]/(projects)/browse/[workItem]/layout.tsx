"use client";

// components
import { Outlet } from "react-router";
import { AppHeader } from "@/components/core/app-header";
import { ContentWrapper } from "@/components/core/content-wrapper";
import { ProjectIssueDetailsHeader } from "./header";

export default function ProjectIssueDetailsLayout() {
  return (
    <>
      <AppHeader header={<ProjectIssueDetailsHeader />} />
      <ContentWrapper className="overflow-hidden">
        <Outlet />
      </ContentWrapper>
    </>
  );
}
