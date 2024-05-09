import { useEffect } from "react";
import { observer } from "mobx-react";
import { useRouter } from "next/router";
import { BarChart2, PanelRight } from "lucide-react";
// ui
import { Breadcrumbs } from "@plane/ui";
// components
import { BreadcrumbLink } from "@/components/common";
import { cn } from "@/helpers/common.helper";
import { useAppTheme } from "@/hooks/store";

export const WorkspaceAnalyticsHeader = observer(() => {
  const router = useRouter();
  const { analytics_tab } = router.query;
  // store hooks
  const { workspaceAnalyticsSidebarCollapsed, toggleWorkspaceAnalyticsSidebar } = useAppTheme();

  useEffect(() => {
    const handleToggleWorkspaceAnalyticsSidebar = () => {
      if (window && window.innerWidth < 768) {
        toggleWorkspaceAnalyticsSidebar(true);
      }
      if (window && workspaceAnalyticsSidebarCollapsed && window.innerWidth >= 768) {
        toggleWorkspaceAnalyticsSidebar(false);
      }
    };

    window.addEventListener("resize", handleToggleWorkspaceAnalyticsSidebar);
    handleToggleWorkspaceAnalyticsSidebar();
    return () => window.removeEventListener("resize", handleToggleWorkspaceAnalyticsSidebar);
  }, [toggleWorkspaceAnalyticsSidebar, workspaceAnalyticsSidebarCollapsed]);

  return (
    <>
      <div
        className={`relative z-10 flex h-[3.75rem] w-full flex-shrink-0 flex-row items-center justify-between gap-x-2 gap-y-4 bg-custom-sidebar-background-100 p-4`}
      >
        <div className="flex w-full flex-grow items-center gap-2 overflow-ellipsis whitespace-nowrap">
          <div className="flex w-full items-center justify-between">
            <Breadcrumbs>
              <Breadcrumbs.BreadcrumbItem
                type="text"
                link={
                  <BreadcrumbLink label="Analytics" icon={<BarChart2 className="h-4 w-4 text-custom-text-300" />} />
                }
              />
            </Breadcrumbs>
            {analytics_tab === "custom" && (
              <button
                className="block md:hidden"
                onClick={() => {
                  toggleWorkspaceAnalyticsSidebar();
                }}
              >
                <PanelRight
                  className={cn(
                    "block h-4 w-4 md:hidden",
                    !workspaceAnalyticsSidebarCollapsed ? "text-custom-primary-100" : "text-custom-text-200"
                  )}
                />
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
});
