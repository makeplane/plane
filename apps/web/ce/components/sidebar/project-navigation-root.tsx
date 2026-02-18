/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 *
 * CE project sidebar navigation root — injects additional nav items (e.g. Time Tracking).
 */

import { useCallback } from "react";
import { Timer } from "lucide-react";
import { EUserPermissions } from "@plane/constants";
import { ProjectNavigation, type TNavigationItem } from "@/components/workspace/sidebar/project-navigation";
import { useProject } from "@/hooks/store/use-project";

type TProjectItemsRootProps = {
  workspaceSlug: string;
  projectId: string;
};

export function ProjectNavigationRoot(props: TProjectItemsRootProps) {
  const { workspaceSlug, projectId } = props;
  const { getPartialProjectById } = useProject();
  const project = getPartialProjectById(projectId);

  const additionalNavItems = useCallback(
    (_ws: string, _pid: string): TNavigationItem[] => {
      // Show Time Tracking entry for all projects (no feature flag exists yet)
      // Guarded by ADMIN/MEMBER access in ProjectNavigation's allowPermissions check
      if (!project) return [];
      return [
        {
          i18n_key: "sidebar.time_tracking",
          key: "time_tracking",
          name: "Time Tracking",
          href: `/${_ws}/projects/${_pid}/time-tracking`,
          icon: Timer,
          access: [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
          shouldRender: true,
          sortOrder: 7,
        },
      ];
    },
    [project]
  );

  return (
    <ProjectNavigation
      workspaceSlug={workspaceSlug}
      projectId={projectId}
      additionalNavigationItems={additionalNavItems}
    />
  );
}
