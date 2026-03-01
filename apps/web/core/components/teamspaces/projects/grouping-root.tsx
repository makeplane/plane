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
import { WorkspaceProjectsRoot } from "@/components/projects/list/with-grouping/projects-root";
// hooks
import { useWorkspace } from "@/hooks/store/use-workspace";
import { useProjectFilter } from "@/plane-web/hooks/store";
// types
import { EProjectFilters, EProjectLayouts, EProjectScope } from "@/types/workspace-project-filters";

export type TTeamspaceProjectsWithGroupingRootProps = {
  workspaceSlug: string;
};

export const TeamspaceProjectsWithGroupingRoot = observer(function TeamspaceProjectsWithGroupingRoot(
  props: TTeamspaceProjectsWithGroupingRootProps
) {
  const { workspaceSlug } = props;
  // hooks
  const { currentWorkspace } = useWorkspace();
  const { updateScope, updateAttributes, updateLayout, filters } = useProjectFilter();
  // derived values
  const currentWorkspaceId = currentWorkspace?.id;

  useEffect(() => {
    const currentLayout = filters?.layout ?? EProjectLayouts.TABLE;
    const currentScope = filters?.scope ?? EProjectScope.ALL_PROJECTS;
    updateLayout(workspaceSlug.toString(), EProjectLayouts.TABLE, false, false);
    updateScope(workspaceSlug.toString(), EProjectScope.TEAMSPACE_PROJECTS, false);
    return () => {
      updateScope(workspaceSlug.toString(), currentScope, false);
      updateLayout(workspaceSlug.toString(), currentLayout, false, false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [updateScope, updateAttributes, updateLayout, workspaceSlug]);

  if (!currentWorkspaceId) return null;
  return (
    <div className="h-full w-full overflow-hidden">
      <WorkspaceProjectsRoot
        workspaceSlug={workspaceSlug.toString()}
        workspaceId={currentWorkspaceId}
        isArchived={false}
        filtersToInit={[EProjectFilters.ATTRIBUTES, EProjectFilters.DISPLAY_FILTERS]}
      />
    </div>
  );
});
