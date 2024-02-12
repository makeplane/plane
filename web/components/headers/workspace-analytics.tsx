import { useRouter } from "next/router";
import { BarChart2, PanelRight } from "lucide-react";
// ui
import { Breadcrumbs } from "@plane/ui";
// components
import { SidebarHamburgerToggle } from "components/core/sidebar/sidebar-menu-hamburger-toggle";
import { BreadcrumbLink } from "components/common";
import { useApplication } from "hooks/store";
import { observer } from "mobx-react";
import { cn } from "helpers/common.helper";
import { useEffect } from "react";

export const WorkspaceAnalyticsHeader = observer(() => {
  const router = useRouter();
  const { analytics_tab } = router.query;

  const { theme: themeStore } = useApplication();

  useEffect(() => {
    const handleToggleWorkspaceAnalyticsSidebar = () => {
      if (window && window.innerWidth < 768) {
        themeStore.toggleWorkspaceAnalyticsSidebar(true);
      }
      if (window && themeStore.workspaceAnalyticsSidebarCollapsed && window.innerWidth >= 768) {
        themeStore.toggleWorkspaceAnalyticsSidebar(false);
      }
    };

    window.addEventListener("resize", handleToggleWorkspaceAnalyticsSidebar);
    handleToggleWorkspaceAnalyticsSidebar();
    return () => window.removeEventListener("resize", handleToggleWorkspaceAnalyticsSidebar);
  }, [themeStore]);

  return (
    <>
      <div
        className={`relative z-10 flex h-[3.75rem] w-full flex-shrink-0 flex-row items-center justify-between gap-x-2 gap-y-4 border-b border-custom-border-200 bg-custom-sidebar-background-100 p-4`}
      >
        <div className="flex w-full flex-grow items-center gap-2 overflow-ellipsis whitespace-nowrap">
          <SidebarHamburgerToggle />
          <div className="flex items-center justify-between w-full">
            <Breadcrumbs>
              <Breadcrumbs.BreadcrumbItem
                type="text"
                link={
                  <BreadcrumbLink label="Analytics" icon={<BarChart2 className="h-4 w-4 text-custom-text-300" />} />
                }
              />
            </Breadcrumbs>
            {analytics_tab === 'custom' &&
              <button className="block md:hidden" onClick={() => { themeStore.toggleWorkspaceAnalyticsSidebar() }}>
                <PanelRight className={cn("w-4 h-4 block md:hidden", !themeStore.workspaceAnalyticsSidebarCollapsed ? "text-custom-primary-100" : "text-custom-text-200")} />
              </button>
            }
          </div>
        </div>
      </div>
    </>
  );
});
