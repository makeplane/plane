"use client";

import { FC, useState } from "react";
import { observer } from "mobx-react";
// plane imports
import { IState, TStateGroups, TStateOperationsCallbacks } from "@plane/types";
import { cn } from "@plane/utils";
// components
import { GroupItem } from "@/components/project-states";

type TGroupList = {
  groupedStates: Record<string, IState[]>;
  stateOperationsCallbacks: TStateOperationsCallbacks;
  isEditable: boolean;
  shouldTrackEvents: boolean;
  groupListClassName?: string;
  groupItemClassName?: string;
  stateItemClassName?: string;
};

export const GroupList: FC<TGroupList> = observer((props) => {
  const {
    groupedStates,
    stateOperationsCallbacks,
    isEditable,
    shouldTrackEvents,
    groupListClassName,
    groupItemClassName,
    stateItemClassName,
  } = props;
  // states
  const [groupsExpanded, setGroupsExpanded] = useState<Partial<TStateGroups>[]>([
    "backlog",
    "unstarted",
    "started",
    "completed",
    "cancelled",
  ]);

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
    <div className={cn("space-y-5", groupListClassName)}>
      {Object.entries(groupedStates).map(([key, value]) => {
        const groupKey = key as TStateGroups;
        const groupStates = value;
        return (
          <GroupItem
            key={groupKey}
            groupKey={groupKey}
            states={groupStates}
            groupedStates={groupedStates}
            groupsExpanded={groupsExpanded}
            stateOperationsCallbacks={stateOperationsCallbacks}
            isEditable={isEditable}
            shouldTrackEvents={shouldTrackEvents}
            handleGroupCollapse={handleGroupCollapse}
            handleExpand={handleExpand}
            groupItemClassName={groupItemClassName}
            stateItemClassName={stateItemClassName}
          />
        );
      })}
    </div>
  );
});
