import { useParams } from "next/navigation";
import useSWR from "swr";
import { TPageNavigationTabs } from "@plane/types";
import { EPageStoreType, usePageStore } from "@/plane-web/hooks/store";
import { SectionPagesHookReturn } from "../types";

/**
 * Hook for fetching pages by section type
 * @param sectionType Type of the section (public, private, archived)
 * @returns Object containing pageIds
 */
export const useSectionPages = (sectionType: TPageNavigationTabs): SectionPagesHookReturn => {
  const { workspaceSlug } = useParams();
  const { fetchPagesByType } = usePageStore(EPageStoreType.WORKSPACE);

  const { data: pages, isLoading } = useSWR(
    workspaceSlug ? `WORKSPACE_PAGES_${workspaceSlug}_${sectionType}_` : null,
    workspaceSlug ? () => fetchPagesByType(sectionType) : null,
    {
      revalidateOnFocus: true,
      revalidateIfStale: true,
    }
  );

  // Extract page IDs and filter out undefined values
  const pageIds = (pages?.map((page) => page.id) || []).filter((id): id is string => id !== undefined);

  return { pageIds, isLoading };
};

