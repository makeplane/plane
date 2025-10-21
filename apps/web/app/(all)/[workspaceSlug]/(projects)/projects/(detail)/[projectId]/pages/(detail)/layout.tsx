"use client";

// component
import useSWR from "swr";
import { AppHeader } from "@/components/core/app-header";
import { ContentWrapper } from "@/components/core/content-wrapper";
// plane web hooks
import { EPageStoreType, usePageStore } from "@/plane-web/hooks/store";
// local components
import { PageDetailsHeader } from "./header";

type ProjectPageDetailsLayoutProps = {
  params: {
    workspaceSlug: string;
    projectId: string;
  };
  children: React.ReactNode;
};

export default function ProjectPageDetailsLayout({ params, children }: ProjectPageDetailsLayoutProps) {
  const { workspaceSlug, projectId } = params;
  const { fetchPagesList } = usePageStore(EPageStoreType.PROJECT);
  // fetching pages list
  useSWR(`PROJECT_PAGES_${projectId}`, () => fetchPagesList(workspaceSlug, projectId));
  return (
    <>
      <AppHeader header={<PageDetailsHeader />} />
      <ContentWrapper>{children}</ContentWrapper>
    </>
  );
}
