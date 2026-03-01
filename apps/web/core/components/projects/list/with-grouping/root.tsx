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

import { useEffect } from "react";
import { observer } from "mobx-react";
// components
import { useProjectFilter } from "@/plane-web/hooks/store";
import { EProjectLayouts } from "@/types/workspace-project-filters";
// hooks
import { useWorkspace } from "@/hooks/store/use-workspace";
// local imports
import { WorkspaceProjectsRoot } from "./projects-root";

type TProjectsListWithGroupingProps = {
  workspaceSlug: string;
  isArchived: boolean;
};

export const ProjectsListWithGrouping = observer(function ProjectsListWithGrouping(
  props: TProjectsListWithGroupingProps
) {
  const { workspaceSlug, isArchived } = props;
  // store
  const { getWorkspaceBySlug } = useWorkspace();
  const { updateAttributes, updateLayout } = useProjectFilter();
  // derived values
  const currentWorkspace = getWorkspaceBySlug(workspaceSlug);
  const currentWorkspaceId = currentWorkspace?.id;

  useEffect(() => {
    if (isArchived) {
      updateAttributes(workspaceSlug, "archived", true, isArchived);
      updateLayout(workspaceSlug, EProjectLayouts.GALLERY, isArchived);
    } else {
      updateAttributes(workspaceSlug, "archived", false, isArchived);
    }
  }, [isArchived, updateAttributes, updateLayout, workspaceSlug]);

  if (!currentWorkspaceId) return <></>;
  return (
    <div className="h-full w-full overflow-hidden">
      <WorkspaceProjectsRoot workspaceSlug={workspaceSlug} workspaceId={currentWorkspaceId} isArchived={isArchived} />
    </div>
  );
});
