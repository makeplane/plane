import { useRef } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import useSWR from "swr";
// components
import { SidebarHelpSection } from "@/components/workspace";
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
import { SidebarAppSwitcher } from "@/plane-web/components/sidebar";
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
      <div
        ref={ref}
        className={cn("size-full flex flex-1 flex-col p-4 pb-0", {
          "p-2 pb-0": sidebarCollapsed,
        })}
      >
        <PagesAppSidebarDropdown />
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
        <PagesAppSidebarList />
        <SidebarHelpSection />
      </div>
    </div>
  );
});
