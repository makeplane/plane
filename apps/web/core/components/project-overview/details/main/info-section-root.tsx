/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import type { FC } from "react";
import React from "react";
import { observer } from "mobx-react";
import { EUserPermissionsLevel } from "@plane/constants";
import { EUserProjectRoles } from "@plane/types";
// hooks
import { useProject } from "@/hooks/store/use-project";
import { useUserPermissions } from "@/hooks/store/user";
// types
import type { TProject } from "@/types";
// local components
import { useLinks } from "./collaspible-section/links/use-links";
import { DescriptionBox } from "./info-section/description-box";
import { HeroSection } from "./info-section/hero-section";

type Props = {
  workspaceSlug: string;
  projectId: string;
};

export const ProjectOverviewInfoSectionRoot = observer(function ProjectOverviewInfoSectionRoot(props: Props) {
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
