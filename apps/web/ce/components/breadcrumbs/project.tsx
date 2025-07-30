"use client";

import { observer } from "mobx-react";
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

type TProjectBreadcrumbProps = {
  workspaceSlug: string;
  projectId: string;
  handleOnClick?: () => void;
};

export const ProjectBreadcrumb = observer((props: TProjectBreadcrumbProps) => {
  const { workspaceSlug, projectId, handleOnClick } = props;
  // router
  const router = useAppRouter();
  // store hooks
  const { joinedProjectIds, getPartialProjectById } = useProject();
  const currentProjectDetails = getPartialProjectById(projectId);

  // store hooks

  if (!currentProjectDetails) return null;

  // derived values
  const switcherOptions = joinedProjectIds
    .map((projectId) => {
      const project = getPartialProjectById(projectId);
      return {
        value: projectId,
        query: project?.name,
        content: (
          <SwitcherLabel name={project?.name} logo_props={project?.logo_props} LabelIcon={Briefcase} type="material" />
        ),
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
              if (handleOnClick) handleOnClick();
              else router.push(`/${workspaceSlug}/projects/${currentProjectDetails.id}/issues/`);
            }}
            shouldTruncate
          />
        }
        showSeparator={false}
      />
    </>
  );
});
