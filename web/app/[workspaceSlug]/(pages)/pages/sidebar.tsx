import { useRef } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import useSWR from "swr";
// components
import { WorkspaceHelpSection } from "@/components/workspace";
// helpers
import { cn } from "@/helpers/common.helper";
// hooks
import { useAppTheme } from "@/hooks/store";
import useOutsideClickDetector from "@/hooks/use-outside-click-detector";
// plane web components
import {
  PagesAppSidebarDropdown,
  PagesAppSidebarList,
  PagesAppSidebarMenu,
  PagesAppSidebarQuickActions,
} from "@/plane-web/components/pages";
// plane web hooks
import { useWorkspacePages } from "@/plane-web/hooks/store";

export const PagesAppSidebar = observer(() => {
  // params
  const { workspaceSlug } = useParams();
  // store hooks
  const { toggleSidebar, sidebarCollapsed } = useAppTheme();
  const { fetchAllPages } = useWorkspacePages();
  // refs
  const ref = useRef<HTMLDivElement>(null);

  useSWR(workspaceSlug ? `WORKSPACE_PAGES_LIST_${workspaceSlug}` : null, workspaceSlug ? () => fetchAllPages() : null, {
    revalidateOnFocus: false,
    revalidateIfStale: false,
    revalidateOnReconnect: false,
  });

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
      <div ref={ref} className="size-full flex flex-1 flex-col space-y-4">
        <PagesAppSidebarDropdown />
        <PagesAppSidebarQuickActions />
        <PagesAppSidebarMenu />
        <PagesAppSidebarList />
        <WorkspaceHelpSection />
      </div>
    </div>
  );
});
