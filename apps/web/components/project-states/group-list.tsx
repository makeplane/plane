/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { observer } from "mobx-react";
// plane imports
import type { IState, TStateGroups, TStateOperationsCallbacks } from "@plane/types";
import { cn } from "@plane/utils";
// components
import { GroupItem } from "@/components/project-states";
import { ClosedStateGroup } from "./closed-state-group";

type TGroupList = {
  groupedStates: Record<string, IState[]>;
  stateOperationsCallbacks: TStateOperationsCallbacks;
  isEditable: boolean;
  groupListClassName?: string;
  groupItemClassName?: string;
  stateItemClassName?: string;
  // d2m-plane: reorder state groups via drag & drop
  handleGroupDrop?: (sourceGroupKey: TStateGroups, targetGroupKey: TStateGroups, edge: "top" | "bottom") => void;
  // d2m-plane: the project's Closed state, rendered as its own block at the bottom
  closedState?: IState;
};

export const GroupList = observer(function GroupList(props: TGroupList) {
  const {
    groupedStates,
    stateOperationsCallbacks,
    isEditable,
    groupListClassName,
    groupItemClassName,
    stateItemClassName,
    handleGroupDrop,
    closedState,
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
            handleGroupCollapse={handleGroupCollapse}
            handleExpand={handleExpand}
            groupItemClassName={groupItemClassName}
            stateItemClassName={stateItemClassName}
            isGroupDraggable={isEditable && !!handleGroupDrop}
            handleGroupDrop={handleGroupDrop}
          />
        );
      })}
      {closedState && (
        <ClosedStateGroup
          closedState={closedState}
          stateOperationsCallbacks={stateOperationsCallbacks}
          isEditable={isEditable}
          groupItemClassName={groupItemClassName}
          stateItemClassName={stateItemClassName}
        />
      )}
    </div>
  );
});
