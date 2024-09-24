"use client";

import { FC } from "react";
import { observer } from "mobx-react";
// components
import { ProjectStateListItem } from "@/plane-web/components/workspace-project-states";
// plane web types
import { TProjectStateGroupKey, TProjectStateIdsByGroup } from "@/plane-web/types/workspace-project-states";

type TStateList = {
  workspaceSlug: string;
  workspaceId: string;
  groupProjectStates: TProjectStateIdsByGroup;
  groupKey: TProjectStateGroupKey;
  groupStateIds: string[];
};

export const ProjectStateList: FC<TStateList> = observer((props) => {
  const { workspaceSlug, workspaceId, groupProjectStates, groupKey, groupStateIds } = props;

  return (
    <>
      {groupStateIds.map((stateId) => (
        <ProjectStateListItem
          key={stateId}
          workspaceSlug={workspaceSlug}
          workspaceId={workspaceId}
          groupProjectStates={groupProjectStates}
          groupKey={groupKey}
          projectStateId={stateId}
        />
      ))}
    </>
  );
});
