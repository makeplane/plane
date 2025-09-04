"use client";

import React, { FC } from "react";
import { observer } from "mobx-react";
import { EUserPermissionsLevel } from "@plane/constants";
import { EUserProjectRoles } from "@plane/types";
// hooks
import { useProject } from "@/hooks/store/use-project";
import { useUserPermissions } from "@/hooks/store/user";
// types
import { TProject } from "@/plane-web/types";
// local components
import { useLinks } from "./collaspible-section/links/use-links";
import { DescriptionBox } from "./info-section/description-box";
import { HeroSection } from "./info-section/hero-section";

type Props = {
  workspaceSlug: string;
  projectId: string;
};

export const ProjectOverviewInfoSectionRoot: FC<Props> = observer((props) => {
  const { workspaceSlug, projectId } = props;
  // store hooks
  const { getProjectById, updateProject } = useProject();
  const { allowPermissions } = useUserPermissions();
  // helper hooks
  const { toggleLinkModal } = useLinks(workspaceSlug.toString(), projectId.toString());

  // derived values
  const project = getProjectById(projectId);
  if (!project) return null;

  // handlers
  const handleUpdateProject = async (data: Partial<TProject>) => {
    await updateProject(workspaceSlug.toString(), projectId.toString(), data);
  };

  const isProjectAdmin = allowPermissions(
    [EUserProjectRoles.ADMIN],
    EUserPermissionsLevel.PROJECT,
    workspaceSlug.toString(),
    project.id.toString()
  );
  return (
    <>
      <HeroSection project={project} workspaceSlug={workspaceSlug.toString()} />
      <DescriptionBox
        workspaceSlug={workspaceSlug.toString()}
        project={project}
        handleProjectUpdate={handleUpdateProject}
        toggleLinkModalOpen={toggleLinkModal}
        disabled={!isProjectAdmin}
      />
    </>
  );
});
