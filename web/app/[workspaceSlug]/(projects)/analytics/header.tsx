"use client";

import { useEffect } from "react";
import { observer } from "mobx-react";
import { useSearchParams } from "next/navigation";
// icons
import { BarChart2, PanelRight } from "lucide-react";
// ui
import { Breadcrumbs, Header } from "@plane/ui";
// components
import { BreadcrumbLink } from "@/components/common";
// helpers
import { cn } from "@/helpers/common.helper";
// hooks
import { useAppTheme } from "@/hooks/store";

export const WorkspaceAnalyticsHeader = observer(() => {
  const searchParams = useSearchParams();
  const analytics_tab = searchParams.get("analytics_tab");
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
    <Header>
      <Header.LeftItem>
        <Breadcrumbs>
          <Breadcrumbs.BreadcrumbItem
            type="text"
            link={<BreadcrumbLink label="Analytics" icon={<BarChart2 className="h-4 w-4 text-custom-text-300" />} />}
          />
        </Breadcrumbs>
        {analytics_tab === "custom" ? (
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
        ) : (
          <></>
        )}
      </Header.LeftItem>
    </Header>
  );
});
