import { useRef, useState, useEffect } from "react";
import { observer } from "mobx-react";
import { useParams, usePathname } from "next/navigation";
import useSWR from "swr";
// plane helpers
import { useOutsideClickDetector } from "@plane/hooks";
// components
import { SidebarDropdown, SidebarHelpSection } from "@/components/workspace";
// helpers
import { cn } from "@/helpers/common.helper";
// hooks
import { useAppTheme } from "@/hooks/store";
// plane web components
import { PagesAppSidebarList, PagesAppSidebarMenu, PagesAppSidebarQuickActions } from "@/plane-web/components/pages";
import { SidebarAppSwitcher } from "@/plane-web/components/sidebar";
// plane web hooks
import { EPageStoreType, usePageStore } from "@/plane-web/hooks/store";

export const PagesAppSidebar = observer(() => {
  // params
  const { workspaceSlug, pageId } = useParams();
  const pathname = usePathname();
  // state
  const [expandedPageIds, setExpandedPageIds] = useState<string[]>([]);
  // store hooks
  const { toggleSidebar, sidebarCollapsed } = useAppTheme();
  const { fetchParentPages } = usePageStore(EPageStoreType.WORKSPACE);
  // refs
  const ref = useRef<HTMLDivElement>(null);

  // Fetch parent pages if we're on a page detail view
  const { data: parentPagesList } = useSWR(
    workspaceSlug && pageId && pathname?.includes("/pages/") ? `PARENT_PAGES_LIST_${pageId.toString()}` : null,
    workspaceSlug && pageId && pathname?.includes("/pages/") ? () => fetchParentPages(pageId.toString()) : null
  );

  // Auto-expand parent pages when viewing a page
  useEffect(() => {
    if (parentPagesList && parentPagesList.length > 0) {
      // Include all pages in the list (including the current page)
      const allPageIds = parentPagesList.map((page) => page.id);

      // Filter out any undefined values
      const validPageIds = allPageIds.filter((id) => id !== undefined) as string[];

      // Update expanded pages state
      setExpandedPageIds((prev) => Array.from(new Set([...prev, ...validPageIds])));
    }
  }, [parentPagesList]);

  useOutsideClickDetector(ref, () => {
    if (sidebarCollapsed === false) {
      if (window.innerWidth < 768) {
        toggleSidebar();
      }
    }
  });

  return (
    <div
      className={cn(
        "fixed inset-y-0 z-20 flex h-full flex-shrink-0 flex-grow-0 flex-col border-r border-custom-sidebar-border-200 bg-custom-sidebar-background-100 duration-300 w-[250px] md:relative md:ml-0",
        {
          "w-[70px] -ml-[250px]": sidebarCollapsed,
        }
      )}
    >
      <div
        ref={ref}
        className={cn("size-full flex flex-1 flex-col p-4 pb-0", {
          "p-2 pb-0": sidebarCollapsed,
        })}
      >
        <SidebarDropdown />
        <div className="flex-shrink-0 h-4" />
        <SidebarAppSwitcher />
        <PagesAppSidebarQuickActions />
        <hr
          className={cn("flex-shrink-0 border-custom-sidebar-border-300 h-[0.5px] w-3/5 mx-auto my-2", {
            "opacity-0": !sidebarCollapsed,
          })}
        />
        <PagesAppSidebarMenu />
        <hr
          className={cn("flex-shrink-0 border-custom-sidebar-border-300 h-[0.5px] w-3/5 mx-auto my-2", {
            "opacity-0": !sidebarCollapsed,
          })}
        />
        <PagesAppSidebarList expandedPageIds={expandedPageIds} setExpandedPageIds={setExpandedPageIds} />
        <SidebarHelpSection />
      </div>
    </div>
  );
});
