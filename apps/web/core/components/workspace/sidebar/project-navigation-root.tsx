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

import { observer } from "mobx-react";
// plane imports
import { EpicIcon, OverviewIcon } from "@plane/propel/icons";
// components
import type { TNavigationItem } from "@/components/navigation/tab-navigation-root";
import { ProjectNavigation } from "@/components/workspace/sidebar/project-navigation";
// hooks
import { useProject } from "@/hooks/store/use-project";
// local imports
import { WithFeatureFlagHOC } from "@/components/feature-flags";

type TProjectItemsRootProps = {
  workspaceSlug: string;
  projectId: string;
};

export const ProjectNavigationRoot = observer(function ProjectNavigationRoot(props: TProjectItemsRootProps) {
  const { workspaceSlug, projectId } = props;
  // store hooks
  const { getPartialProjectById } = useProject();
  // derived values
  const project = getPartialProjectById(projectId);

  if (!project) return null;

  // additional navigation items
  const additionalNavigationItems = (workspaceSlug: string, projectId: string): TNavigationItem[] => [
    {
      name: "Overview",
      key: "overview",
      href: `/${workspaceSlug}/projects/${projectId}/overview/`,
      icon: OverviewIcon,
      sortOrder: -2,
      i18n_key: "common.overview",
    },
    {
      name: "Epics",
      key: "epics",
      href: `/${workspaceSlug}/projects/${projectId}/epics`,
      icon: EpicIcon,
      sortOrder: -1,
      i18n_key: "sidebar.epics",
    },
  ];

  return (
    <>
      <WithFeatureFlagHOC
        workspaceSlug={workspaceSlug?.toString()}
        flag="EPICS"
        fallback={<ProjectNavigation workspaceSlug={workspaceSlug} projectId={projectId} />}
      >
        <ProjectNavigation
          workspaceSlug={workspaceSlug}
          projectId={projectId}
          additionalNavigationItems={additionalNavigationItems}
        />
      </WithFeatureFlagHOC>
    </>
  );
});
