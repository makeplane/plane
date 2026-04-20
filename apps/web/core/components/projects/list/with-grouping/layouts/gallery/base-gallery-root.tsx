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

import { useCallback } from "react";
import { observer } from "mobx-react";
// assets
import { ContentWrapper } from "@plane/ui";
import type { ProjectItemPermissions } from "@/store/project/permissions/root";
import { useProject } from "@/hooks/store/use-project";
import { useFavorite } from "@/hooks/store/use-favorite";
import { useProjectFilter } from "@/plane-web/hooks/store/workspace-project-states/use-project-filters";
import { EProjectLayouts } from "@/types/workspace-project-filters";
import { ProjectLayoutHOC } from "../project-layout-HOC";
import { ProjectCard } from "./card";

type BaseProjectRootProps = {
  workspaceSlug: string;
};

export const BaseProjectRoot = observer(function BaseProjectRoot(props: BaseProjectRootProps) {
  const { workspaceSlug } = props;
  // store hooks
  const { getProjectById, permissions } = useProject();
  const { getFilteredProjectsByLayout } = useProjectFilter();
  const { permissions: favoritePermissions } = useFavorite();
  // derived values
  const filteredProjectIds = getFilteredProjectsByLayout(EProjectLayouts.GALLERY);
  const getProjectItemPermissions = useCallback(
    (projectId: string): ProjectItemPermissions => ({
      ...permissions.getProjectItemPermissions(workspaceSlug, projectId),
      canFavorite: favoritePermissions.getCanCreate(workspaceSlug),
    }),
    [favoritePermissions, permissions, workspaceSlug]
  );

  return (
    <ProjectLayoutHOC layout={EProjectLayouts.GALLERY} workspaceSlug={workspaceSlug}>
      <ContentWrapper>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 3xl:grid-cols-5">
          {filteredProjectIds &&
            filteredProjectIds.map((projectId) => {
              const projectDetails = getProjectById(projectId);
              if (!projectDetails) return;
              return (
                <ProjectCard
                  key={projectDetails.id}
                  project={projectDetails}
                  workspaceSlug={workspaceSlug}
                  permissions={getProjectItemPermissions(projectId)}
                />
              );
            })}
        </div>
      </ContentWrapper>
    </ProjectLayoutHOC>
  );
});
