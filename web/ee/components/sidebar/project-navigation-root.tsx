"use client";

import React, { FC } from "react";
import { observer } from "mobx-react";
// plane ui components
import { EpicIcon } from "@plane/ui";
// components
import { ProjectNavigation, TNavigationItem } from "@/components/workspace";
// hooks
import { useProject } from "@/hooks/store";
// plane-web constants
import { EUserPermissions } from "@/plane-web/constants/user-permissions";
// local components
import { WithFeatureFlagHOC } from "../feature-flags";

type TProjectItemsRootProps = {
  workspaceSlug: string;
  projectId: string;
};

export const ProjectNavigationRoot: FC<TProjectItemsRootProps> = observer((props) => {
  const { workspaceSlug, projectId } = props;
  // store hooks
  const { getProjectById } = useProject();
  // derived values
  const project = getProjectById(projectId);
  const isEpicsEnabled = project?.is_epic_enabled;

  if (!project) return null;

  // additional navigation items
  const additionalNavigationItems = (workspaceSlug: string, projectId: string): TNavigationItem[] => [
    {
      name: "Epics",
      href: `/${workspaceSlug}/projects/${projectId}/epics`,
      icon: EpicIcon,
      access: [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
      shouldRender: !!isEpicsEnabled,
      sortOrder: -1,
      key: "epics",
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
