import { useEffect } from "react";
import { useParams } from "next/navigation";
import useSWR from "swr";
// types
import { TPage, TPageNavigationTabs } from "@plane/types";
// store hooks
import { EPageStoreType, usePageStore } from "@/plane-web/hooks/store";

interface UsePagesByTypeReturn {
  pages: TPage[] | undefined;
  isLoading: boolean;
  error: any;
  mutate: () => void;
}

export const usePagesByType = (
  pageType: TPageNavigationTabs,
  searchQuery?: string
): UsePagesByTypeReturn => {
  const { workspaceSlug } = useParams();
  const workspacePageStore = usePageStore(EPageStoreType.WORKSPACE);

  // Construct the URL with query parameters
  const buildUrl = () => {
    const baseUrl = `/api/workspaces/${workspaceSlug}/pages/?type=${pageType}`;
    return searchQuery ? `${baseUrl}&search=${searchQuery}` : baseUrl;
  };

  // Use SWR to fetch the data
  const { data, error, isLoading, mutate } = useSWR(
    workspaceSlug ? `WORKSPACE_PAGES_${workspaceSlug}_${pageType}_${searchQuery || ""}` : null,
    workspaceSlug ? 
      async () => {
        // Get all workspace pages with filters
        const url = buildUrl();
        const response = await fetch(url);
        if (!response.ok) throw new Error("Failed to fetch pages");
        return await response.json();
      } : null,
    { 
      revalidateOnFocus: false,
      revalidateIfStale: false
    }
  );

  // Update the store with the fetched pages
  useEffect(() => {
    if (data && workspacePageStore) {
      // Update the MobX store with the fetched pages
      workspacePageStore.updatePagesInStore(data);
    }
  }, [data, workspacePageStore]);

  return {
    pages: data,
    isLoading,
    error,
    mutate
  };
}; 