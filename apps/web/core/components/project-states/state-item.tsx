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

import { Fragment, useCallback, useEffect, useRef, useState } from "react";
import { combine } from "@atlaskit/pragmatic-drag-and-drop/combine";
import { draggable, dropTargetForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { attachClosestEdge, extractClosestEdge } from "@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge";
import { observer } from "mobx-react";
// Plane
import type { TDraggableData } from "@plane/constants";
import type { IState, TStateGroups, TStateOperationsCallbacks } from "@plane/types";
import { DropIndicator } from "@plane/ui";
import { cn, getCurrentStateSequence } from "@plane/utils";
// components
import { StateItemTitle, StateUpdate } from "@/components/project-states";
// helpers
type TStateItem = {
  groupKey: TStateGroups;
  groupedStates: Record<string, IState[]>;
  totalStates: number;
  state: IState;
  stateOperationsCallbacks: TStateOperationsCallbacks;
  shouldTrackEvents: boolean;
  permissions: {
    canEdit: (stateId: string) => boolean;
    canDelete: (stateId: string) => boolean;
    canMarkAsDefault: (stateId: string) => boolean;
    canDragAndDrop: (stateId: string) => boolean;
  };
  stateItemClassName?: string;
};

export const StateItem = observer(function StateItem(props: TStateItem) {
  const {
    groupKey,
    groupedStates,
    totalStates,
    state,
    stateOperationsCallbacks,
    shouldTrackEvents,
    permissions,
    stateItemClassName,
  } = props;
  // ref
  const draggableElementRef = useRef<HTMLDivElement | null>(null);
  // states
  const [updateStateModal, setUpdateStateModal] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isDraggedOver, setIsDraggedOver] = useState(false);
  const [closestEdge, setClosestEdge] = useState<string | null>(null);
  // derived values
  const { canEdit, canDelete, canMarkAsDefault, canDragAndDrop } = permissions;
  const isDraggable = totalStates === 1 ? false : true;
  const commonStateItemListProps = {
    stateCount: totalStates,
    state: state,
    setUpdateStateModal: setUpdateStateModal,
  };

  const handleStateSequence = useCallback(
    async (payload: Partial<IState>) => {
      try {
        if (!payload.id) return;
        await stateOperationsCallbacks.moveStatePosition(payload.id, payload);
      } catch (error) {
        console.error("error", error);
      }
    },
    [stateOperationsCallbacks]
  );

  useEffect(() => {
    const elementRef = draggableElementRef.current;
    const initialData: TDraggableData = { groupKey: groupKey, id: state.id };

    if (elementRef && state) {
      combine(
        draggable({
          element: elementRef,
          getInitialData: () => initialData,
          onDragStart: () => setIsDragging(true),
          onDrop: () => setIsDragging(false),
          canDrag: () => isDraggable && canDragAndDrop(state.id),
        }),
        dropTargetForElements({
          element: elementRef,
          getData: ({ input, element }) =>
            attachClosestEdge(initialData, {
              input,
              element,
              allowedEdges: ["top", "bottom"],
            }),
          onDragEnter: (args) => {
            setIsDraggedOver(true);
            setClosestEdge(extractClosestEdge(args.self.data));
          },
          onDragLeave: () => {
            setIsDraggedOver(false);
            setClosestEdge(null);
          },
          onDrop: (data) => {
            setIsDraggedOver(false);
            const { self, source } = data;
            const sourceData = source.data as TDraggableData;
            const destinationData = self.data as TDraggableData;

            if (sourceData && destinationData && sourceData.id) {
              const destinationGroupKey = destinationData.groupKey;
              const edge = extractClosestEdge(destinationData) || undefined;
              const payload: Partial<IState> = {
                id: sourceData.id,
                group: destinationGroupKey,
                sequence: getCurrentStateSequence(groupedStates[destinationGroupKey], destinationData, edge),
              };
              handleStateSequence(payload);
            }
          },
        })
      );
    }
  }, [draggableElementRef, state, groupKey, isDraggable, groupedStates, handleStateSequence, canDragAndDrop]);
  // DND ends

  if (updateStateModal)
    return (
      <StateUpdate
        state={state}
        updateStateCallback={stateOperationsCallbacks.updateState}
        shouldTrackEvents={shouldTrackEvents}
        handleClose={() => setUpdateStateModal(false)}
      />
    );

  return (
    <Fragment>
      {/* draggable drop top indicator */}
      <DropIndicator isVisible={isDraggedOver && closestEdge === "top"} />
      <div
        ref={draggableElementRef}
        className={cn(
          "relative border border-subtle bg-surface-1 py-3 px-3.5 rounded-sm group",
          isDragging ? `opacity-50` : `opacity-100`,
          totalStates === 1 ? `cursor-auto` : `cursor-grab`,
          stateItemClassName
        )}
      >
        <StateItemTitle
          {...commonStateItemListProps}
          canEdit={canEdit(state.id)}
          canDragAndDrop={canDragAndDrop(state.id)}
          {...(canDelete(state.id)
            ? { canDelete: true, deleteStateCallback: stateOperationsCallbacks.deleteState }
            : { canDelete: false })}
          {...(canMarkAsDefault(state.id)
            ? { canMarkAsDefault: true, markStateAsDefaultCallback: stateOperationsCallbacks.markStateAsDefault }
            : { canMarkAsDefault: false })}
        />
      </div>
      {/* draggable drop bottom indicator */}
      <DropIndicator isVisible={isDraggedOver && closestEdge === "bottom"} />
    </Fragment>
  );
});
