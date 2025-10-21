"use client";

import { Outlet } from "react-router";
import type { Route } from "./+types/layout";
import { AppHeader } from "@/components/core/app-header";
import { ContentWrapper } from "@/components/core/content-wrapper";
import { ProjectIssueDetailsHeader } from "./header";

export default function ProjectIssueDetailsLayout({ params }: Route.ComponentProps) {
  return (
    <>
      <AppHeader header={<ProjectIssueDetailsHeader workspaceSlug={params.workspaceSlug} workItem={params.workItem} />} />
      <ContentWrapper className="overflow-hidden">
        <Outlet />
      </ContentWrapper>
    </>
  );
}
