/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useCallback } from "react";
import { observer } from "mobx-react";
// plane imports
import { EUserPermissions } from "@plane/constants";
import { EpicIcon } from "@plane/propel/icons";
// components
import type { TNavigationItem } from "@/components/workspace/sidebar/project-navigation";
import { ProjectNavigation } from "@/components/workspace/sidebar/project-navigation";
// hooks
import { useIssueTypes } from "@/hooks/store/use-issue-types";
import { useProject } from "@/hooks/store/use-project";

type TProjectItemsRootProps = {
  workspaceSlug: string;
  projectId: string;
};

export const ProjectNavigationRoot = observer(function ProjectNavigationRoot(props: TProjectItemsRootProps) {
  const { workspaceSlug, projectId } = props;
  // store hooks
  const { getProjectById } = useProject();
  const { getProjectEpicId } = useIssueTypes();
  // derived values
  const project = getProjectById(projectId);
  const isEpicsEnabled = Boolean(project?.is_issue_type_enabled) && Boolean(getProjectEpicId(projectId));

  // additional CE navigation items (epics)
  const additionalNavigationItems = useCallback(
    (navWorkspaceSlug: string, navProjectId: string): TNavigationItem[] => [
      {
        i18n_key: "sidebar.epics",
        key: "epics",
        name: "Epics",
        href: `/${navWorkspaceSlug}/projects/${navProjectId}/epics`,
        icon: EpicIcon,
        access: [EUserPermissions.ADMIN, EUserPermissions.MEMBER, EUserPermissions.GUEST],
        shouldRender: isEpicsEnabled,
        sortOrder: 1.5, // right after work items
      },
    ],
    [isEpicsEnabled]
  );

  return (
    <ProjectNavigation
      workspaceSlug={workspaceSlug}
      projectId={projectId}
      additionalNavigationItems={additionalNavigationItems}
    />
  );
});
