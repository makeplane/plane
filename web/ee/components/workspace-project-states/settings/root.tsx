"use client";

import { FC } from "react";
import { observer } from "mobx-react";
// plane web components
import { useAppTheme } from "@/hooks/store";
import {
  WorkspaceProjectStatesEmptyState,
  WorkspaceProjectStatesLoader,
  ProjectStateGroupList,
} from "@/plane-web/components/workspace-project-states";
// plane web hooks
import { useWorkspaceFeatures, useWorkspaceProjectStates } from "@/plane-web/hooks/store";
// plane web types

type TWorkspaceProjectStatesRoot = {
  workspaceSlug: string;
  workspaceId: string;
  isProjectGroupingEnabled: boolean;
  toggleProjectGroupingFeature: () => void;
};

export const WorkspaceProjectStatesRoot: FC<TWorkspaceProjectStatesRoot> = observer((props) => {
  const { workspaceSlug, workspaceId, isProjectGroupingEnabled, toggleProjectGroupingFeature } = props;
  const {} = useAppTheme();
  // hooks
  const { loader, getProjectStateIdsWithGroupingByWorkspaceId } = useWorkspaceProjectStates();
  const { loader: workspaceLoader } = useWorkspaceFeatures();

  // derived values
  const groupedProjectStateIds = getProjectStateIdsWithGroupingByWorkspaceId(workspaceId);

  return (
    <div className="space-y-3">
      {isProjectGroupingEnabled && groupedProjectStateIds ? (
        loader || workspaceLoader ? (
          <WorkspaceProjectStatesLoader />
        ) : (
          <ProjectStateGroupList
            workspaceSlug={workspaceSlug}
            workspaceId={workspaceId}
            groupProjectStates={groupedProjectStateIds}
          />
        )
      ) : (
        <WorkspaceProjectStatesEmptyState toggleProjectGroupingFeature={toggleProjectGroupingFeature} />
      )}
    </div>
  );
});
