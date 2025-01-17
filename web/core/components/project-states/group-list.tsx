"use client";

import { FC, useState } from "react";
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
  // states
  const [groupsExpanded, setGroupsExpanded] = useState<Partial<TStateGroups>[]>([]);

  const handleGroupCollapse = (groupKey: TStateGroups) => {
    setGroupsExpanded((prev) => {
      if (prev.includes(groupKey)) {
        return prev.filter((key) => key !== groupKey);
      }
      return prev;
    });
  };

  const handleExpand = (groupKey: TStateGroups) => {
    setGroupsExpanded((prev) => {
      if (prev.includes(groupKey)) {
        return prev;
      }
      return [...prev, groupKey];
    });
  };
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
            groupsExpanded={groupsExpanded}
            handleGroupCollapse={handleGroupCollapse}
            handleExpand={handleExpand}
          />
        );
      })}
    </div>
  );
});
