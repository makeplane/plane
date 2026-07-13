/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState, useEffect } from "react";
import { observer } from "mobx-react";
import { monitorForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { extractClosestEdge } from "@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge";
import { useParams } from "next/navigation";
// plane imports
import type { IState, TStateGroups, TStateOperationsCallbacks } from "@plane/types";
import { cn } from "@plane/utils";
// components
import { GroupItem } from "@/components/project-states";
// hooks
import { useProject } from "@/hooks/store/use-project";

type TGroupList = {
  groupedStates: Record<string, IState[]>;
  stateOperationsCallbacks: TStateOperationsCallbacks;
  isEditable: boolean;
  shouldTrackEvents: boolean;
  groupListClassName?: string;
  groupItemClassName?: string;
  stateItemClassName?: string;
};

export const GroupList = observer(function GroupList(props: TGroupList) {
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

  const { updateProject } = useProject();
  const { workspaceSlug, projectId } = useParams();

  useEffect(() => {
    if (!isEditable) return;

    return monitorForElements({
      canMonitor({ source }) {
        return source.data.type === "STATE_GROUP";
      },
      onDrop({ source, location }) {
        const destination = location.current.dropTargets[0];
        if (!destination) return;

        const sourceId = source.data.id as string;
        const destinationId = destination.data.id as string;
        const edge = extractClosestEdge(destination.data);

        if (sourceId === destinationId) return;

        // Current order based on keys in groupedStates (which are sorted by computed)
        const currentOrder = Object.keys(groupedStates);

        // Remove source
        const newOrder = currentOrder.filter((id) => id !== sourceId);

        // Find insert index
        let insertIndex = newOrder.indexOf(destinationId);
        if (edge === "bottom") {
          insertIndex += 1;
        }

        // Insert source
        newOrder.splice(insertIndex, 0, sourceId);

        // API call
        if (workspaceSlug && projectId) {
          updateProject(workspaceSlug.toString(), projectId.toString(), { state_group_order: newOrder as TStateGroups[] });
        }
      },
    });
  }, [groupedStates, isEditable, workspaceSlug, projectId, updateProject]);
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
