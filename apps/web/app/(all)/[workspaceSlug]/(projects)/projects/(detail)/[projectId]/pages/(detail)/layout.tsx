// component
import { Outlet } from "react-router";
import { useSearchParams } from "next/navigation";
import useSWR from "swr";
import { AppHeader } from "@/components/core/app-header";
import { ContentWrapper } from "@/components/core/content-wrapper";
// plane web hooks
import { EPageStoreType, usePageStore } from "@/plane-web/hooks/store";
// local components
import type { Route } from "./+types/layout";
import { PageDetailsHeader } from "./header";
import type { TPageNavigationTabs } from "@plane/types";

const getPageType = (pageType?: string | null): TPageNavigationTabs => {
  if (pageType === "private") return "private";
  if (pageType === "archived") return "archived";
  return "public";
};

export default function ProjectPageDetailsLayout({ params }: Route.ComponentProps) {
  const { workspaceSlug, projectId } = params;
  const { fetchPagesList } = usePageStore(EPageStoreType.PROJECT);
  const searchParams = useSearchParams();
  const type = searchParams.get("type");
  const pageType = getPageType(type);
  // fetching pages list
  useSWR(`PROJECT_PAGES_${projectId}`, () => fetchPagesList(workspaceSlug, projectId, pageType));
  return (
    <>
      <AppHeader header={<PageDetailsHeader />} />
      <ContentWrapper>
        <Outlet />
      </ContentWrapper>
    </>
  );
}
