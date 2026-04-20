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
import { ContentWrapper } from "@plane/ui";
import type { ProjectItemPermissions, ProjectLayoutPermissions } from "@/store/project/permissions/root";
// hooks
import { useProject } from "@/hooks/store/use-project";
import { useFavorite } from "@/hooks/store/use-favorite";
// plane web hooks
import { useProjectFilter } from "@/plane-web/hooks/store";
// types
import { EProjectLayouts } from "@/types/workspace-project-filters";
// local imports
import { ProjectBoardGroup } from "./group";
import { ProjectLayoutHOC } from "../project-layout-HOC";

type ProjectBoardLayoutProps = {
  workspaceSlug: string;
};

export const ProjectBoardLayout = observer(function ProjectBoardLayout(props: ProjectBoardLayoutProps) {
  const { workspaceSlug } = props;
  // hooks
  const { getFilteredProjectsByLayout } = useProjectFilter();
  const { permissions } = useProject();
  const { permissions: favoritePermissions } = useFavorite();
  // derived values
  const groupByProjectIds = getFilteredProjectsByLayout(EProjectLayouts.BOARD);
  const layoutPermissions: ProjectLayoutPermissions = {
    canCreateProject: permissions.getCanCreate(workspaceSlug),
  };

  const getProjectItemPermissions = useCallback(
    (projectId: string): ProjectItemPermissions => ({
      ...permissions.getProjectItemPermissions(workspaceSlug, projectId),
      canFavorite: favoritePermissions.getCanCreate(workspaceSlug),
    }),
    [favoritePermissions, permissions, workspaceSlug]
  );

  return (
    <ProjectLayoutHOC layout={EProjectLayouts.BOARD} workspaceSlug={workspaceSlug}>
      <ContentWrapper className="!py-0">
        <ProjectBoardGroup
          groupByProjectIds={groupByProjectIds || {}}
          getProjectItemPermissions={getProjectItemPermissions}
          layoutPermissions={layoutPermissions}
          workspaceSlug={workspaceSlug}
        />
      </ContentWrapper>
    </ProjectLayoutHOC>
  );
});
