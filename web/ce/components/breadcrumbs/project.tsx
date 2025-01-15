"use client";

import { observer } from "mobx-react";
import { Briefcase } from "lucide-react";
// ui
import { Breadcrumbs, Logo } from "@plane/ui";
// components
import { BreadcrumbLink } from "@/components/common";
// hooks
import { useProject } from "@/hooks/store";

export const ProjectBreadcrumb = observer(() => {
  // store hooks
  const { currentProjectDetails } = useProject();

  return (
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
  );
});
