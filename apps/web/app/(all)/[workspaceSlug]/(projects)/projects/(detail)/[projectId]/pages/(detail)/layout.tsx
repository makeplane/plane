import { Outlet } from "react-router";
import type { Route } from "./+types/layout";
// component
// import { useParams } from "react-router";
import useSWR from "swr";
import { AppHeader } from "@/components/core/app-header";
import { ContentWrapper } from "@/components/core/content-wrapper";
// plane web hooks
import { EPageStoreType, usePageStore } from "@/plane-web/hooks/store";
// local components
import { PageDetailsHeader } from "./header";

export default function ProjectPageDetailsLayout({ params }: Route.ComponentProps) {
  const { workspaceSlug, projectId, pageId } = params;
  const { fetchPagesList } = usePageStore(EPageStoreType.PROJECT);
  // fetching pages list
  useSWR(
    workspaceSlug && projectId ? `PROJECT_PAGES_${projectId}` : null,
    workspaceSlug && projectId ? () => fetchPagesList(workspaceSlug, projectId) : null
  );
  return (
    <>
      <AppHeader header={<PageDetailsHeader workspaceSlug={workspaceSlug} projectId={projectId} pageId={pageId} />} />
      <ContentWrapper>
        <Outlet />
      </ContentWrapper>
    </>
  );
}
