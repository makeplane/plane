"use client";

import { Outlet } from "react-router";
import type { Route } from "./+types/layout";
// components
import { AppHeader } from "@/components/core/app-header";
import { ContentWrapper } from "@/components/core/content-wrapper";
import { ProjectArchivesHeader } from "../../header";

export default function ProjectArchiveIssuesLayout({ params }: Route.ComponentProps) {
  const { workspaceSlug, projectId } = params;

  return (
    <>
      <AppHeader
        header={<ProjectArchivesHeader activeTab="issues" workspaceSlug={workspaceSlug} projectId={projectId} />}
      />
      <ContentWrapper>
        <Outlet />
      </ContentWrapper>
    </>
  );
}
