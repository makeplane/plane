"use client";

import { FC, Fragment, useCallback, useEffect, useRef, useState } from "react";
import { combine } from "@atlaskit/pragmatic-drag-and-drop/combine";
import { draggable, dropTargetForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { attachClosestEdge, extractClosestEdge } from "@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge";
import { observer } from "mobx-react";
// Plane
import { IState, TStateGroups } from "@plane/types";
import { DropIndicator } from "@plane/ui";
// components
import { StateUpdate } from "@/components/project-states";
// helpers
import { TDraggableData } from "@/constants/state";
import { cn } from "@/helpers/common.helper";
import { getCurrentStateSequence } from "@/helpers/state.helper";
// hooks
import { useProjectState } from "@/hooks/store";
// Plane-web
import { StateItemChild } from "@/plane-web/components/workflow";

type TStateItem = {
  workspaceSlug: string;
  projectId: string;
  groupKey: TStateGroups;
  groupedStates: Record<string, IState[]>;
  totalStates: number;
  state: IState;
  disabled?: boolean;
};

export const StateItem: FC<TStateItem> = observer((props) => {
  const { workspaceSlug, projectId, groupKey, groupedStates, totalStates, state, disabled = false } = props;
  // hooks
  const { moveStatePosition } = useProjectState();
  // states
  const [updateStateModal, setUpdateStateModal] = useState(false);

  const handleStateSequence = useCallback(
    async (payload: Partial<IState>) => {
      try {
        if (!workspaceSlug || !projectId || !payload.id) return;
        await moveStatePosition(workspaceSlug, projectId, payload.id, payload);
      } catch (error) {
        console.error("error", error);
      }
    },
    [workspaceSlug, projectId, moveStatePosition]
  );

  // derived values
  const isDraggable = totalStates === 1 ? false : true;

  // DND starts
  // ref
  const draggableElementRef = useRef<HTMLDivElement | null>(null);
  // states
  const [isDragging, setIsDragging] = useState(false);
  const [isDraggedOver, setIsDraggedOver] = useState(false);
  const [closestEdge, setClosestEdge] = useState<string | null>(null);
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
          canDrag: () => isDraggable && !disabled,
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
              const destinationGroupKey = destinationData.groupKey as TStateGroups;
              const edge = extractClosestEdge(destinationData) || undefined;
              const payload: Partial<IState> = {
                id: sourceData.id as string,
                group: destinationGroupKey,
                sequence: getCurrentStateSequence(groupedStates[destinationGroupKey], destinationData, edge),
              };
              handleStateSequence(payload);
            }
          },
        })
      );
    }
  }, [draggableElementRef, state, groupKey, isDraggable, groupedStates, handleStateSequence]);
  // DND ends

  if (updateStateModal)
    return (
      <StateUpdate
        workspaceSlug={workspaceSlug}
        projectId={projectId}
        state={state}
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
          "relative border border-custom-border-100 rounded group",
          isDragging ? `opacity-50` : `opacity-100`,
          totalStates === 1 ? `cursor-auto` : `cursor-grab`
        )}
      >
        <StateItemChild
          workspaceSlug={workspaceSlug}
          projectId={projectId}
          setUpdateStateModal={setUpdateStateModal}
          stateCount={totalStates}
          disabled={disabled}
          state={state}
        />
      </div>

      {/* draggable drop bottom indicator */}
      <DropIndicator isVisible={isDraggedOver && closestEdge === "bottom"} />
    </Fragment>
  );
});
