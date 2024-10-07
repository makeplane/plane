"use client";

import { FC, Fragment, useCallback, useEffect, useRef, useState } from "react";
import { combine } from "@atlaskit/pragmatic-drag-and-drop/combine";
import { draggable, dropTargetForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { attachClosestEdge, extractClosestEdge } from "@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge";
import { observer } from "mobx-react";
import { GripVertical, Pencil } from "lucide-react";
import { IState, TStateGroups } from "@plane/types";
import { DropIndicator, StateGroupIcon } from "@plane/ui";
// components
import { StateUpdate, StateDelete, StateMarksAsDefault } from "@/components/project-states";
// helpers
import { TDraggableData } from "@/constants/state";
import { cn } from "@/helpers/common.helper";
import { getCurrentStateSequence } from "@/helpers/state.helper";
// hooks
import { useProjectState } from "@/hooks/store";

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
          canDrag: () => isDraggable,
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
          "relative border border-custom-border-100 rounded p-3 px-3.5 flex items-center gap-2 group my-1",
          isDragging ? `opacity-50` : `opacity-100`,
          totalStates === 1 ? `cursor-auto` : `cursor-grab`
        )}
      >
        {/* draggable indicator */}
        {!disabled && totalStates != 1 && (
          <div className="flex-shrink-0 w-3 h-3 rounded-sm absolute left-0 hidden group-hover:flex justify-center items-center transition-colors bg-custom-background-90 cursor-pointer text-custom-text-200 hover:text-custom-text-100">
            <GripVertical className="w-3 h-3" />
          </div>
        )}

        {/* state icon */}
        <div className="flex-shrink-0">
          <StateGroupIcon stateGroup={state.group} color={state.color} height="16px" width="16px" />
        </div>

        {/* state title and description */}
        <div className="w-full text-sm px-2 min-h-5">
          <h6 className="text-sm font-medium">{state.name}</h6>
          <p className="text-xs text-custom-text-200">{state.description}</p>
        </div>

        {!disabled && (
          <div className="hidden group-hover:flex items-center gap-2">
            {/* state mark as default option */}
            <div className="flex-shrink-0 text-xs transition-all">
              <StateMarksAsDefault
                workspaceSlug={workspaceSlug}
                projectId={projectId}
                stateId={state.id}
                isDefault={state.default ? true : false}
              />
            </div>

            {/* state edit options */}
            <div className="flex items-center gap-1 transition-all">
              <button
                className="flex-shrink-0 w-5 h-5 rounded flex justify-center items-center overflow-hidden transition-colors hover:bg-custom-background-80 cursor-pointer text-custom-text-200 hover:text-custom-text-100"
                onClick={() => setUpdateStateModal(true)}
              >
                <Pencil className="w-3 h-3" />
              </button>
              <StateDelete
                workspaceSlug={workspaceSlug}
                projectId={projectId}
                totalStates={totalStates}
                state={state}
              />
            </div>
          </div>
        )}
      </div>

      {/* draggable drop bottom indicator */}
      <DropIndicator isVisible={isDraggedOver && closestEdge === "bottom"} />
    </Fragment>
  );
});
