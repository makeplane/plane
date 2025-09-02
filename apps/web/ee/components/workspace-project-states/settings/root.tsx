"use client";

import { FC } from "react";
import { observer } from "mobx-react";
// plane web components
import { useTheme } from "next-themes";
import { DetailedEmptyState } from "@/components/empty-state/detailed-empty-state-root";
import { WorkspaceProjectStatesLoader, ProjectStateGroupList } from "@/plane-web/components/workspace-project-states";
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
  // hooks
  const { loader, getProjectStateIdsWithGroupingByWorkspaceId } = useWorkspaceProjectStates();
  const { loader: workspaceLoader } = useWorkspaceFeatures();
  const { resolvedTheme } = useTheme();

  // derived values
  const groupedProjectStateIds = getProjectStateIdsWithGroupingByWorkspaceId(workspaceId);
  const resolvedEmptyStatePath = `/projects/project-states-${resolvedTheme?.includes("dark") ? "dark" : "light"}.webp`;

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
        <DetailedEmptyState
          className="!p-0"
          title=""
          description=""
          assetPath={resolvedEmptyStatePath}
          size="md"
          primaryButton={{
            text: "Enable",
            onClick: () => toggleProjectGroupingFeature(),
          }}
        />
      )}
    </div>
  );
});
