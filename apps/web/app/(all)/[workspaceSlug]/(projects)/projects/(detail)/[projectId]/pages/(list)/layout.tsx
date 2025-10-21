import { Outlet } from "react-router";
import type { Route } from "../../../+types/layout";
// components
import { AppHeader } from "@/components/core/app-header";
import { ContentWrapper } from "@/components/core/content-wrapper";
// local components
import { PagesListHeader } from "./header";

export default function ProjectPagesListLayout({ params }: Route.ComponentProps) {
  const { workspaceSlug, projectId } = params;

  return (
    <>
      <AppHeader header={<PagesListHeader workspaceSlug={workspaceSlug} projectId={projectId} />} />
      <ContentWrapper>
        <Outlet />
      </ContentWrapper>
    </>
  );
}
