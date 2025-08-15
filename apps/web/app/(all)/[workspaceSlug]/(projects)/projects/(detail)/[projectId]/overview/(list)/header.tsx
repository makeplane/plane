"use client";

import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// icons
import { Sidebar } from "lucide-react";
import { EProjectFeatureKey } from "@plane/constants";
// plane imports
import { Breadcrumbs, Header } from "@plane/ui";
import { cn } from "@plane/utils";
// hooks
import { useAppTheme } from "@/hooks/store/use-app-theme";
import { useProject } from "@/hooks/store/use-project";
import { useAppRouter } from "@/hooks/use-app-router";
// plane-web
import { CommonProjectBreadcrumbs } from "@/plane-web/components/breadcrumbs/common";

export const ProjectOverviewHeader = observer(() => {
  // router
  const router = useAppRouter();
  const { workspaceSlug } = useParams();
  // store hooks
  const { currentProjectDetails, loader } = useProject();
  const { projectOverviewSidebarCollapsed, toggleProjectOverviewSidebar } = useAppTheme();

  return (
    <Header>
      <Header.LeftItem>
        <Breadcrumbs onBack={() => router.back()} isLoading={loader === "init-loader"}>
          <CommonProjectBreadcrumbs
            workspaceSlug={workspaceSlug?.toString()}
            projectId={currentProjectDetails?.id?.toString() ?? ""}
            featureKey={EProjectFeatureKey.OVERVIEW}
            isLast
          />
        </Breadcrumbs>
      </Header.LeftItem>
      <Header.RightItem>
        <div className="flex items-center gap-2">
          <Sidebar
            className={cn("size-4 cursor-pointer", {
              "text-custom-primary-100": !projectOverviewSidebarCollapsed,
            })}
            onClick={() => toggleProjectOverviewSidebar()}
          />
        </div>
      </Header.RightItem>
    </Header>
  );
});
