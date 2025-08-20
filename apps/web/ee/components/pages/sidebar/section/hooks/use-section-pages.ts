import { useParams } from "next/navigation";
import useSWR from "swr";
import { TPageNavigationTabs } from "@plane/types";
import { EPageStoreType, usePageStore } from "@/plane-web/hooks/store";

/**
 * Hook for fetching pages by section type
 * @param sectionType Type of the section (public, private, archived)
 * @returns Object containing pageIds and loading state
 */
export const useSectionPages = (sectionType: TPageNavigationTabs) => {
  const { workspaceSlug } = useParams();
  const { fetchPagesByType } = usePageStore(EPageStoreType.WORKSPACE);

  const { isLoading } = useSWR(
    workspaceSlug ? `WORKSPACE_PAGES_${workspaceSlug}_${sectionType}` : null,
    workspaceSlug ? () => fetchPagesByType(sectionType) : null,
    {
      revalidateOnFocus: true,
      revalidateIfStale: true,
    }
  );

  return { isLoading };
};
