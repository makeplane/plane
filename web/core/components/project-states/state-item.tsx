"use client";

import { FC, Fragment, useCallback, useEffect, useRef, useState } from "react";
import { combine } from "@atlaskit/pragmatic-drag-and-drop/combine";
import { draggable, dropTargetForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { attachClosestEdge, extractClosestEdge } from "@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge";
import { observer } from "mobx-react";
// Plane
import { TDraggableData } from "@plane/constants";
import { IState, TStateGroups, TStateOperationsCallbacks } from "@plane/types";
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
  disabled?: boolean;
  stateItemClassName?: string;
};

export const StateItem: FC<TStateItem> = observer((props) => {
  const {
    groupKey,
    groupedStates,
    totalStates,
    state,
    stateOperationsCallbacks,
    shouldTrackEvents,
    disabled = false,
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
  }, [draggableElementRef, state, groupKey, isDraggable, groupedStates, handleStateSequence, disabled]);
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
          "relative border border-custom-border-100 bg-custom-background-100 py-3 px-3.5 rounded group",
          isDragging ? `opacity-50` : `opacity-100`,
          totalStates === 1 ? `cursor-auto` : `cursor-grab`,
          stateItemClassName
        )}
      >
        {disabled ? (
          <StateItemTitle {...commonStateItemListProps} disabled />
        ) : (
          <StateItemTitle
            {...commonStateItemListProps}
            disabled={false}
            stateOperationsCallbacks={{
              markStateAsDefault: stateOperationsCallbacks.markStateAsDefault,
              deleteState: stateOperationsCallbacks.deleteState,
            }}
            shouldTrackEvents={shouldTrackEvents}
          />
        )}
      </div>
      {/* draggable drop bottom indicator */}
      <DropIndicator isVisible={isDraggedOver && closestEdge === "bottom"} />
    </Fragment>
  );
});
