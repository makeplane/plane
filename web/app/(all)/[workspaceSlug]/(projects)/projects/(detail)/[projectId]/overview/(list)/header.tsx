"use client";

import { observer } from "mobx-react";
// icons
import { Briefcase, RssIcon, Sidebar } from "lucide-react";
// plane imports
import { Breadcrumbs, Header } from "@plane/ui";
import { cn } from "@plane/utils";
// components
import { BreadcrumbLink, Logo } from "@/components/common";
// hooks
import { useAppTheme, useProject } from "@/hooks/store";

import { useAppRouter } from "@/hooks/use-app-router";

export const ProjectOverviewHeader = observer(() => {
  // router
  const router = useAppRouter();
  // store hooks
  const { currentProjectDetails, loader } = useProject();
  const { projectOverviewSidebarCollapsed, toggleProjectOverviewSidebar } = useAppTheme();

  return (
    <Header>
      <Header.LeftItem>
        <div className="flex items-center gap-2.5">
          <Breadcrumbs onBack={() => router.back()} isLoading={loader === "init-loader"}>
            <Breadcrumbs.BreadcrumbItem
              type="text"
              link={
                <BreadcrumbLink
                  label={currentProjectDetails?.name ?? "Project"}
                  icon={
                    currentProjectDetails ? (
                      currentProjectDetails && (
                        <span className="grid place-items-center flex-shrink-0 h-4 w-4">
                          <Logo logo={currentProjectDetails?.logo_props} size={16} />
                        </span>
                      )
                    ) : (
                      <span className="grid h-7 w-7 flex-shrink-0 place-items-center rounded uppercase">
                        <Briefcase className="h-4 w-4" />
                      </span>
                    )
                  }
                />
              }
            />

            <Breadcrumbs.BreadcrumbItem
              type="text"
              link={<BreadcrumbLink label="Overview" icon={<RssIcon className="h-4 w-4 text-custom-text-300" />} />}
            />
          </Breadcrumbs>
        </div>
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
