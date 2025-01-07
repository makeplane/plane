"use client";

import { observer } from "mobx-react";
// icons
import { Briefcase } from "lucide-react";
// ui
import { Breadcrumbs, Header, OverviewIcon } from "@plane/ui";
// components
import { BreadcrumbLink, Logo } from "@/components/common";
// hooks
import { useProject } from "@/hooks/store";

import { useAppRouter } from "@/hooks/use-app-router";

export const ProjectOverviewHeader = observer(() => {
  // router
  const router = useAppRouter();
  // store hooks
  const { currentProjectDetails, loader } = useProject();

  return (
    <Header>
      <Header.LeftItem>
        <div className="flex items-center gap-2.5">
          <Breadcrumbs onBack={() => router.back()} isLoading={loader}>
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
              link={<BreadcrumbLink label="Overview" icon={<OverviewIcon />} />}
            />
          </Breadcrumbs>
        </div>
      </Header.LeftItem>
    </Header>
  );
});
