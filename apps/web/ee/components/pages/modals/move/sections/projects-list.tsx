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

import { useMemo } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// components
import { Logo } from "@plane/propel/emoji-icon-picker";
// hooks
import { useProject } from "@/hooks/store/use-project";
// plane web hooks
import { EPageStoreType, usePageStore } from "@/plane-web/hooks/store";
// local imports
import { MovePageModalListSection } from "../list-section";
import type { TMovePageSelectedValue } from "../root";

type Props = {
  searchTerm: string;
};

export const MovePageModalProjectsListSection = observer(function MovePageModalProjectsListSection(props: Props) {
  const { searchTerm } = props;
  // params
  const { workspaceSlug } = useParams();
  // store hooks
  const { getCanCreatePage } = usePageStore(EPageStoreType.PROJECT);
  const { currentProjectDetails, getProjectById, joinedProjectIds } = useProject();
  // derived values
  const transferrableProjectIds = useMemo(
    () =>
      joinedProjectIds.filter((id) => {
        const projectDetails = getProjectById(id);
        const isCurrentProject = projectDetails?.id === currentProjectDetails?.id;
        const canCreatePage = !!workspaceSlug && getCanCreatePage(workspaceSlug, id);
        return !isCurrentProject && canCreatePage;
      }),
    [getCanCreatePage, currentProjectDetails, getProjectById, joinedProjectIds, workspaceSlug]
  );
  const filteredProjectIds = useMemo(
    () =>
      transferrableProjectIds.filter((id) => {
        const projectDetails = getProjectById(id);
        const projectQuery = `${projectDetails?.identifier} ${projectDetails?.name}`.toLowerCase();
        return projectQuery.includes(searchTerm.toLowerCase());
      }),
    [getProjectById, searchTerm, transferrableProjectIds]
  );

  if (filteredProjectIds.length === 0) return null;

  return (
    <MovePageModalListSection
      title="PROJECTS"
      items={filteredProjectIds}
      getItemDetails={(id) => {
        const projectDetails = getProjectById(id);
        if (!projectDetails) return null;
        return {
          logo: <Logo logo={projectDetails.logo_props} size={12} />,
          name: projectDetails.name,
          value: `project-${id}` satisfies TMovePageSelectedValue,
        };
      }}
    />
  );
});
