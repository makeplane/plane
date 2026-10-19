/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useState, useRef } from "react";
import { combine } from "@atlaskit/pragmatic-drag-and-drop/combine";
import { draggable, dropTargetForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import type { Edge } from "@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge";
import { attachClosestEdge, extractClosestEdge } from "@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge";
import { observer } from "mobx-react";

import { Collapsible } from "@makeplane/propel/components/collapsible";
import { Icon } from "@makeplane/propel/components/icon";
import { IconButton } from "@makeplane/propel/components/icon-button";
import { AddOutline, ChevronDownOutline } from "@makeplane/propel/icons";
// plane imports
import { DragHandle, DropIndicator } from "@plane/blocks/common";
import { StateGroupIcon } from "@plane/blocks/icons";
import { EIconSize } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import type { IState, TStateGroups, TStateOperationsCallbacks } from "@plane/types";
import { cn } from "@plane/utils";
// components
import { StateList, StateCreate } from "@/components/project-states";

type TGroupItem = {
  groupKey: TStateGroups;
  groupsExpanded: Partial<TStateGroups>[];
  groupedStates: Record<string, IState[]>;
  states: IState[];
  stateOperationsCallbacks: TStateOperationsCallbacks;
  isEditable: boolean;
  groupItemClassName?: string;
  stateItemClassName?: string;
  handleGroupCollapse: (groupKey: TStateGroups) => void;
  handleExpand: (groupKey: TStateGroups) => void;
  // d2m-plane: drag & drop to reorder state groups
  isGroupDraggable?: boolean;
  handleGroupDrop?: (sourceGroupKey: TStateGroups, targetGroupKey: TStateGroups, edge: "top" | "bottom") => void;
};

// d2m-plane: drag payload type for state groups (distinct from state items)
export const STATE_GROUP_DRAG_TYPE = "STATE_GROUP";
type TStateGroupDragData = { type: typeof STATE_GROUP_DRAG_TYPE; groupKey: TStateGroups };
const isStateGroupDragData = (data: Record<string | symbol, unknown>): data is TStateGroupDragData =>
  data?.type === STATE_GROUP_DRAG_TYPE;

export const GroupItem = observer(function GroupItem(props: TGroupItem) {
  const {
    groupKey,
    groupedStates,
    states,
    groupsExpanded,
    isEditable,
    stateOperationsCallbacks,
    groupItemClassName,
    stateItemClassName,
    handleExpand,
    handleGroupCollapse,
    isGroupDraggable = false,
    handleGroupDrop,
  } = props;
  // refs
  const dropElementRef = useRef<HTMLDivElement | null>(null);
  const dragHandleRef = useRef<HTMLButtonElement | null>(null);
  // group drag & drop states
  const [isGroupDragging, setIsGroupDragging] = useState(false);
  const [groupDropEdge, setGroupDropEdge] = useState<Edge | null>(null);
  // plane hooks
  const { t } = useTranslation();
  // state
  const [createState, setCreateState] = useState(false);
  // derived values
  const currentStateExpanded = groupsExpanded.includes(groupKey);
  const shouldShowEmptyState = states.length === 0 && currentStateExpanded && !createState;

  const isCreateDisabled = !isEditable || createState;

  // d2m-plane: make the whole group draggable (via its handle) and a drop target for other groups
  useEffect(() => {
    const element = dropElementRef.current;
    const dragHandle = dragHandleRef.current;
    if (!element || !dragHandle || !isGroupDraggable) return;

    const groupData: TStateGroupDragData = { type: STATE_GROUP_DRAG_TYPE, groupKey };

    return combine(
      draggable({
        element,
        dragHandle,
        getInitialData: () => groupData,
        onDragStart: () => setIsGroupDragging(true),
        onDrop: () => setIsGroupDragging(false),
      }),
      dropTargetForElements({
        element,
        canDrop: ({ source }) => isStateGroupDragData(source.data) && source.data.groupKey !== groupKey,
        getData: ({ input, element: target }) =>
          attachClosestEdge(groupData, { input, element: target, allowedEdges: ["top", "bottom"] }),
        onDrag: ({ self }) => setGroupDropEdge(extractClosestEdge(self.data)),
        onDragLeave: () => setGroupDropEdge(null),
        onDrop: ({ self, source }) => {
          setGroupDropEdge(null);
          const edge = extractClosestEdge(self.data);
          if (!isStateGroupDragData(source.data) || (edge !== "top" && edge !== "bottom")) return;
          handleGroupDrop?.(source.data.groupKey, groupKey, edge);
        },
      })
    );
  }, [groupKey, isGroupDraggable, handleGroupDrop]);

  return (
    <div className="group/state-group relative" ref={dropElementRef}>
      <DropIndicator classNames="absolute -top-3 z-[2]" isVisible={groupDropEdge === "top"} />
      {isGroupDraggable && (
        <div className="absolute top-3 -left-7 opacity-0 transition-opacity group-hover/state-group:opacity-100 focus-within:opacity-100">
          <DragHandle ref={dragHandleRef} className="bg-transparent" />
        </div>
      )}
      <div
        className={cn(
          "rounded-sm border border-subtle bg-surface-2 transition-all",
          isGroupDragging && "opacity-50",
          groupItemClassName
        )}
      >
        <Collapsible
          open={currentStateExpanded}
          onOpenChange={(open) => (open ? handleExpand(groupKey) : handleGroupCollapse(groupKey))}
          indicator={false}
          icon={
            <Icon
              icon={
                <ChevronDownOutline
                  className={cn("transition-transform", {
                    "rotate-0": currentStateExpanded,
                    "-rotate-90": !currentStateExpanded,
                  })}
                />
              }
            />
          }
          trigger={
            <span className="flex w-full items-center gap-1">
              <StateGroupIcon stateGroup={groupKey} size={EIconSize.XL} className="shrink-0" />
              <span className="px-1 text-14 font-medium text-secondary capitalize">{groupKey}</span>
            </span>
          }
          trailing={
            <IconButton
              type="button"
              variant="ghost"
              size="sm"
              aria-label={t("common.add")}
              disabled={isCreateDisabled}
              onClick={() => {
                if (!createState) {
                  handleExpand(groupKey);
                  setCreateState(true);
                }
              }}
              icon={
                <Icon
                  icon={<AddOutline className={isCreateDisabled ? "text-placeholder" : "text-accent-primary/80"} />}
                />
              }
            />
          }
        >
          {shouldShowEmptyState && (
            <div className="flex h-full flex-col items-center justify-center py-4 text-13 text-tertiary">
              <div>{t("project_settings.states.empty_state.title", { groupKey })}</div>
              {isEditable && <div>{t("project_settings.states.empty_state.description")}</div>}
            </div>
          )}

          <div id="group-droppable-container">
            <StateList
              groupKey={groupKey}
              groupedStates={groupedStates}
              states={states}
              disabled={!isEditable}
              stateOperationsCallbacks={stateOperationsCallbacks}
              stateItemClassName={stateItemClassName}
            />
          </div>
        </Collapsible>

        {/* Rendered outside the collapsible panel (as in legacy) so the create form, and whatever the user typed
            into it, survives collapsing the group — the panel unmounts its children when closed. */}
        {isEditable && createState && (
          <div className="mt-1">
            <StateCreate
              groupKey={groupKey}
              handleClose={() => setCreateState(false)}
              createStateCallback={stateOperationsCallbacks.createState}
            />
          </div>
        )}
      </div>
      <DropIndicator classNames="absolute -bottom-3 z-[2]" isVisible={groupDropEdge === "bottom"} />
    </div>
  );
});
