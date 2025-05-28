"use client";

import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { Briefcase } from "lucide-react";
// ui
import { Breadcrumbs, Logo } from "@plane/ui";
// components
import { ProjectBreadcrumb as CEProjectBreadcrumb } from "@/ce/components/breadcrumbs";
import { BreadcrumbLink } from "@/components/common";
// hooks
import { useProject } from "@/hooks/store";
// local components
import { WithFeatureFlagHOC } from "../feature-flags";

export const ProjectBreadcrumb = observer(() => {
  // router
  const { workspaceSlug } = useParams() as { workspaceSlug: string };

  // store hooks
  const { currentProjectDetails } = useProject();

  return (
    <WithFeatureFlagHOC
      workspaceSlug={workspaceSlug?.toString()}
      flag="PROJECT_OVERVIEW"
      fallback={<CEProjectBreadcrumb />}
    >
      <Breadcrumbs.BreadcrumbItem
        type="text"
        link={
          <BreadcrumbLink
            href={`/${workspaceSlug}/projects/${currentProjectDetails?.id}/overview`}
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
    </WithFeatureFlagHOC>
  );
});
