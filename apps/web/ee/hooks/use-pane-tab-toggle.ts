import { useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQueryParams } from "@/hooks/use-query-params";
import { PAGE_NAVIGATION_PANE_TABS_QUERY_PARAM } from "@/components/pages/navigation-pane";
import type { TPageNavigationPaneTab } from "../components/pages/navigation-pane";

export const usePaneTabToggle = (targetTab: TPageNavigationPaneTab) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { updateQueryParams } = useQueryParams();

  const currentTab = searchParams.get(PAGE_NAVIGATION_PANE_TABS_QUERY_PARAM) as TPageNavigationPaneTab | null;
  const isActive = currentTab === targetTab;

  const toggle = useCallback(() => {
    const newRoute = updateQueryParams({
      ...(isActive
        ? { paramsToRemove: [PAGE_NAVIGATION_PANE_TABS_QUERY_PARAM] }
        : { paramsToAdd: { [PAGE_NAVIGATION_PANE_TABS_QUERY_PARAM]: targetTab } }),
    });
    router.push(newRoute);
  }, [isActive, targetTab, updateQueryParams, router]);

  return useMemo(() => ({ isActive, toggle }), [isActive, toggle]);
};
