"use client";

import { FC } from "react";
import { observer } from "mobx-react";
import { IState, TStateGroups } from "@plane/types";
// components
import { GroupItem } from "@/components/project-states";

type TGroupList = {
  workspaceSlug: string;
  projectId: string;
  groupedStates: Record<string, IState[]>;
};

export const GroupList: FC<TGroupList> = observer((props) => {
  const { workspaceSlug, projectId, groupedStates } = props;

  return (
    <div className="space-y-5">
      {Object.entries(groupedStates).map(([key, value]) => {
        const groupKey = key as TStateGroups;
        const groupStates = value;
        return (
          <GroupItem
            key={groupKey}
            workspaceSlug={workspaceSlug}
            projectId={projectId}
            groupKey={groupKey}
            states={groupStates}
            groupedStates={groupedStates}
          />
        );
      })}
    </div>
  );
});
