"use client";

import { Outlet } from "react-router";
import type { Route } from "./+types/layout";
// components
import { AppHeader } from "@/components/core/app-header";
import { ContentWrapper } from "@/components/core/content-wrapper";
import { ProjectArchivedIssueDetailsHeader } from "./header";

export default function ProjectArchivedIssueDetailLayout({ params }: Route.ComponentProps) {
  const { workspaceSlug, projectId, archivedIssueId } = params;

  return (
    <>
      <AppHeader
        header={
          <ProjectArchivedIssueDetailsHeader
            workspaceSlug={workspaceSlug}
            projectId={projectId}
            archivedIssueId={archivedIssueId}
          />
        }
      />
      <ContentWrapper>
        <Outlet />
      </ContentWrapper>
    </>
  );
}
