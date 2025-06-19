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
            link={
              <BreadcrumbLink
                label={t("workspace_analytics.label")}
                icon={<BarChart2 className="h-4 w-4 text-custom-text-300" />}
              />
            }
          />
        </Breadcrumbs>
      </Header.LeftItem>
    </Header>
  );
});
