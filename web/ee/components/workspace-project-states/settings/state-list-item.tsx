"use client";

import { FC, Fragment, useCallback, useEffect, useRef, useState } from "react";
import { combine } from "@atlaskit/pragmatic-drag-and-drop/combine";
import { draggable, dropTargetForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { attachClosestEdge, extractClosestEdge } from "@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge";
import { observer } from "mobx-react";
import { GripVertical, Pencil } from "lucide-react";
import { DropIndicator } from "@plane/ui";
// helpers
import { cn  } from "@plane/utils";
// plane web components
import {
  ProjectStateUpdate,
  ProjectStateDelete,
  ProjectStateMarksAsDefault,
  ProjectStateIcon,
} from "@/plane-web/components/workspace-project-states";
// plane web constants
import { getCurrentStateSequence } from "@/plane-web/constants/workspace-project-states";
// plane web hooks
import { useProjectState, useWorkspaceProjectStates } from "@/plane-web/hooks/store";
// plane web types
import {
  TProjectStateDraggableData,
  TProjectState,
  TProjectStateGroupKey,
  TProjectStateIdsByGroup,
} from "@/plane-web/types/workspace-project-states";

type TProjectStateListItem = {
  workspaceSlug: string;
  workspaceId: string;
  groupProjectStates: TProjectStateIdsByGroup;
  groupKey: TProjectStateGroupKey;
  projectStateId: string;
};

export const ProjectStateListItem: FC<TProjectStateListItem> = observer((props) => {
  const { workspaceSlug, workspaceId, groupProjectStates, groupKey, projectStateId } = props;
  // hooks
  const { projectStates, getProjectStatedByStateGroupKey } = useWorkspaceProjectStates();
  const { asJson: state, updateProjectState } = useProjectState(projectStateId);
  // states
  const [updateStateModal, setUpdateStateModal] = useState(false);
  // derived values
  const projectStatesByGroup = getProjectStatedByStateGroupKey(workspaceId, groupKey);
  const totalStates = (projectStatesByGroup || []).length;

  const handleStateSequence = useCallback(
    async (payload: Partial<TProjectState>) => {
      try {
        if (!workspaceSlug || !payload.id) return;
        await updateProjectState(workspaceSlug, payload);
      } catch (error) {
        console.error("error", error);
      }
    },
    [workspaceSlug, updateProjectState]
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
    if (state.id) {
      const elementRef = draggableElementRef.current;
      const initialData: TProjectStateDraggableData = { groupKey: groupKey, id: state.id };

      if (elementRef && state) {
        combine(
          draggable({
            element: elementRef,
            getInitialData: () => initialData,
            onDragStart: () => setIsDragging(true),
            onDrop: (data) => {
              setIsDragging(false);
              const { location, source } = data;
              const sourceData = source.data as TProjectStateDraggableData;
              const destinationData = location.current.dropTargets[0].data as TProjectStateDraggableData;
              if (sourceData && destinationData && sourceData.id) {
                const destinationGroupKey = destinationData.groupKey as TProjectStateGroupKey;
                const edge = extractClosestEdge(destinationData) || undefined;
                const projectStateDetails = Object.values(projectStates);

                if (!projectStateDetails) return;
                const payload: Partial<TProjectState> = {
                  id: sourceData.id as string,
                  group: destinationGroupKey,
                  sequence: getCurrentStateSequence(projectStateDetails, destinationData, edge),
                };
                handleStateSequence(payload);
              }
            },
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
            onDrop: () => {
              setIsDraggedOver(false);
            },
          })
        );
      }
    }
  }, [
    draggableElementRef,
    state,
    groupKey,
    isDraggable,
    groupProjectStates,
    handleStateSequence,
    getProjectStatedByStateGroupKey,
    workspaceId,
  ]);
  // DND ends

  if (updateStateModal)
    return (
      <ProjectStateUpdate workspaceSlug={workspaceSlug} state={state} handleClose={() => setUpdateStateModal(false)} />
    );

  return (
    <Fragment>
      {/* draggable drop top indicator */}
      <DropIndicator isVisible={isDraggedOver && closestEdge === "top"} />

      <div
        ref={draggableElementRef}
        className={cn(
          "relative border border-custom-border-100 bg-custom-background-100 rounded p-3 px-3.5 flex items-center gap-2 group",
          isDragging ? `opacity-50` : `opacity-100`,
          totalStates === 1 ? `cursor-auto` : `cursor-grab`
        )}
      >
        {/* draggable indicator */}
        {totalStates != 1 && (
          <div className="flex-shrink-0 w-3 h-3 rounded-sm absolute left-0 hidden group-hover:flex justify-center items-center transition-colors bg-custom-background-90 cursor-pointer text-custom-text-200 hover:text-custom-text-100">
            <GripVertical className="w-3 h-3" />
          </div>
        )}

        {/* state icon */}
        <div className="flex-shrink-0">
          <ProjectStateIcon projectStateGroup={state.group} color={state.color} height="16px" width="16px" />
        </div>

        {/* state title and description */}
        <div className="w-full text-sm px-2 min-h-5">
          <h6 className="text-sm font-medium">{state.name}</h6>
          <p className="text-xs text-custom-text-200">{state.description}</p>
        </div>

        <div className="hidden group-hover:flex items-center gap-2">
          {/* state mark as default option */}
          <div className="flex-shrink-0 text-xs transition-all">
            {state.id && (
              <ProjectStateMarksAsDefault
                workspaceSlug={workspaceSlug}
                stateId={state.id}
                isDefault={state.default ? true : false}
              />
            )}
          </div>

          {/* state edit options */}
          <div className="flex items-center gap-1 transition-all">
            <button
              className="flex-shrink-0 w-5 h-5 rounded flex justify-center items-center overflow-hidden transition-colors hover:bg-custom-background-80 cursor-pointer text-custom-text-200 hover:text-custom-text-100"
              onClick={() => setUpdateStateModal(true)}
            >
              <Pencil className="w-3 h-3" />
            </button>
            <ProjectStateDelete workspaceSlug={workspaceSlug} totalStates={totalStates} state={state} />
          </div>
        </div>
      </div>

      {/* draggable drop bottom indicator */}
      <DropIndicator isVisible={isDraggedOver && closestEdge === "bottom"} />
    </Fragment>
  );
});
