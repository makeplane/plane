"use client";

// component
import { useParams } from "next/navigation";
import useSWR from "swr";
import { AppHeader, ContentWrapper } from "@/components/core";
// plane web hooks
import { EPageStoreType, usePageStore } from "@/plane-web/hooks/store";
// local components
import { PageDetailsHeader } from "./header";

export default function ProjectPageDetailsLayout({ children }: { children: React.ReactNode }) {
  const { workspaceSlug, projectId } = useParams();
  const { fetchPagesList } = usePageStore(EPageStoreType.PROJECT);
  // fetching pages list
  useSWR(
    workspaceSlug && projectId ? `PROJECT_PAGES_${projectId}` : null,
    workspaceSlug && projectId ? () => fetchPagesList(workspaceSlug.toString(), projectId.toString()) : null
  );
  return (
    <>
      <AppHeader header={<PageDetailsHeader />} />
      <ContentWrapper>{children}</ContentWrapper>
    </>
  );
}
