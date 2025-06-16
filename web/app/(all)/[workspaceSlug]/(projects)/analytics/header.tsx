"use client";

import { useEffect } from "react";
import { observer } from "mobx-react";
import { useSearchParams } from "next/navigation";
import { BarChart2, PanelRight } from "lucide-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { Breadcrumbs, Header } from "@plane/ui";
import { cn } from "@plane/utils";
// components
import { BreadcrumbLink } from "@/components/common/breadcrumb-link";
// hooks
import { useAppTheme } from "@/hooks/store";

export const WorkspaceAnalyticsHeader = observer(() => {
  const { t } = useTranslation();
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
          <Breadcrumbs.Item
            component={
              <BreadcrumbLink
                label={t("workspace_analytics.label")}
                icon={<BarChart2 className="h-4 w-4 text-custom-text-300" />}
              />
            }
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
