"use client";

import { observer } from "mobx-react";
// ui
// components
import { ProjectBreadcrumb as CEProjectBreadcrumb } from "@/ce/components/breadcrumbs";
// hooks
import { useProject } from "@/hooks/store";
import { useAppRouter } from "@/hooks/use-app-router";
// local components
import { WithFeatureFlagHOC } from "../feature-flags";

type TProjectBreadcrumbProps = {
  workspaceSlug: string;
  projectId: string;
};

export const ProjectBreadcrumb = observer((props: TProjectBreadcrumbProps) => {
  const { workspaceSlug, projectId } = props;
  // router
  const router = useAppRouter();
  // store hooks
  const { getPartialProjectById } = useProject();

  const currentProjectDetails = getPartialProjectById(projectId);

  if (!currentProjectDetails) return null;

  const handleOnClick = () => {
    router.push(`/${workspaceSlug}/projects/${currentProjectDetails.id}/issues/`);
  };

  return (
    <WithFeatureFlagHOC
      workspaceSlug={workspaceSlug?.toString()}
      flag="PROJECT_OVERVIEW"
      fallback={<CEProjectBreadcrumb workspaceSlug={workspaceSlug} projectId={projectId} />}
    >
      <CEProjectBreadcrumb workspaceSlug={workspaceSlug} projectId={projectId} handleOnClick={handleOnClick} />
    </WithFeatureFlagHOC>
  );
});
