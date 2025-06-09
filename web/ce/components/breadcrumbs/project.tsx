"use client";

import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { Briefcase } from "lucide-react";
// plane imports
import { ICustomSearchSelectOption } from "@plane/types";
import { BreadcrumbNavigationSearchDropdown, Breadcrumbs, Logo } from "@plane/ui";
// components
import { SwitcherLabel } from "@/components/common";
// hooks
import { useProject } from "@/hooks/store";
import { useAppRouter } from "@/hooks/use-app-router";
import { TProject } from "@/plane-web/types";

export const ProjectBreadcrumb = observer(() => {
  // router
  const router = useAppRouter();
  const { workspaceSlug } = useParams() as { workspaceSlug: string };
  // store hooks
  const { currentProjectDetails, joinedProjectIds, getPartialProjectById } = useProject();

  if (!currentProjectDetails) return null;

  // derived values
  const switcherOptions = joinedProjectIds
    .map((projectId) => {
      const project = getPartialProjectById(projectId);
      return {
        value: projectId,
        query: project?.name,
        content: <SwitcherLabel name={project?.name} logo_props={project?.logo_props} LabelIcon={Briefcase} />,
      };
    })
    .filter((option) => option !== undefined) as ICustomSearchSelectOption[];

  // helpers
  const renderIcon = (projectDetails: TProject) => (
    <span className="grid place-items-center flex-shrink-0 h-4 w-4">
      <Logo logo={projectDetails.logo_props} size={14} />
    </span>
  );

  return (
    <>
      <Breadcrumbs.Item
        component={
          <BreadcrumbNavigationSearchDropdown
            selectedItem={currentProjectDetails.id}
            navigationItems={switcherOptions}
            onChange={(value: string) => {
              router.push(`/${workspaceSlug}/projects/${value}/issues`);
            }}
            title={currentProjectDetails?.name}
            icon={renderIcon(currentProjectDetails)}
            handleOnClick={() => {
              router.push(`/${workspaceSlug}/projects/${currentProjectDetails.id}/issues`);
            }}
          />
        }
        showSeparator={false}
      />
    </>
  );
});
