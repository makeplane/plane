/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React, { Fragment, useEffect, useRef, useState } from "react";
import { useOutsideClickDetector } from "@plane/hooks";
import { combine } from "@atlaskit/pragmatic-drag-and-drop/combine";
import { draggable, dropTargetForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { attachClosestEdge, extractClosestEdge } from "@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge";
import { observer } from "mobx-react";
// plane imports
import { DeleteOutline } from "@makeplane/propel/icons";
import { useTranslation } from "@plane/i18n";
import { EChecklistItemStatus } from "@plane/types";
import type { TIssueServiceType } from "@plane/types";
import { DropIndicator } from "@plane/ui";
import { cn } from "@plane/utils";
// hooks
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
// local imports
import type { TChecklistOperations } from "../../issue-detail-widgets/checklist/helper";
import { ChecklistStatusDropdown } from "./checklist-status-dropdown";

type TChecklistDragData = { id: string };

type Props = {
  checklistItemId: string;
  isDraggable: boolean;
  checklistOperations: TChecklistOperations;
  onReorder: (sourceId: string, targetId: string, edge: "top" | "bottom") => void;
  disabled?: boolean;
  issueServiceType: TIssueServiceType;
};

export const ChecklistItem = observer(function ChecklistItem(props: Props) {
  const { checklistItemId, isDraggable, checklistOperations, onReorder, disabled = false, issueServiceType } = props;
  // translation
  const { t } = useTranslation();
  // store hooks
  const {
    checklist: { getChecklistItemById },
  } = useIssueDetail(issueServiceType);
  // derived values
  const item = getChecklistItemById(checklistItemId);
  // state
  const [name, setName] = useState(item?.name ?? "");
  const [isDraggedOver, setIsDraggedOver] = useState(false);
  const [closestEdge, setClosestEdge] = useState<"top" | "bottom" | null>(null);
  // Dual-click delete: the first click only arms a confirmation state (the
  // button swaps to a "confirm" affordance); the second click within the
  // window actually removes the item. Guards against the row's frequent
  // hover-only delete icon being fat-fingered.
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const rowRef = useRef<HTMLDivElement | null>(null);
  const deleteButtonRef = useRef<HTMLButtonElement | null>(null);

  useOutsideClickDetector(deleteButtonRef, () => setIsConfirmingDelete(false));

  // keep the local draft in sync with the store when the item changes from
  // elsewhere (e.g. another tab, or the optimistic-rollback restoring it)
  useEffect(() => {
    if (item && document.activeElement !== inputRef.current) setName(item.name);
  }, [item]);

  // Drag-and-drop: the whole row is the drag surface, following the same
  // flat-list pattern as project-states/state-item.tsx (attachClosestEdge /
  // extractClosestEdge), simplified since checklist items have no groups.
  useEffect(() => {
    const element = rowRef.current;
    if (!element || !checklistItemId) return;

    const initialData: TChecklistDragData = { id: checklistItemId };

    return combine(
      draggable({
        element,
        getInitialData: () => initialData,
        canDrag: () => isDraggable && !disabled,
      }),
      dropTargetForElements({
        element,
        getData: ({ input, element: dropElement }) =>
          attachClosestEdge(initialData, { input, element: dropElement, allowedEdges: ["top", "bottom"] }),
        canDrop: ({ source }) => (source.data as TChecklistDragData)?.id !== checklistItemId,
        onDragEnter: (args) => {
          setIsDraggedOver(true);
          setClosestEdge(extractClosestEdge(args.self.data) as "top" | "bottom" | null);
        },
        onDrag: (args) => {
          setClosestEdge(extractClosestEdge(args.self.data) as "top" | "bottom" | null);
        },
        onDragLeave: () => {
          setIsDraggedOver(false);
          setClosestEdge(null);
        },
        onDrop: ({ self, source }) => {
          setIsDraggedOver(false);
          const sourceId = (source.data as TChecklistDragData)?.id;
          const edge = extractClosestEdge(self.data) as "top" | "bottom" | null;
          if (sourceId && edge) onReorder(sourceId, checklistItemId, edge);
          setClosestEdge(null);
        },
      })
    );
  }, [checklistItemId, isDraggable, disabled, onReorder]);

  if (!item) return null;

  const isTerminal = item.status === EChecklistItemStatus.DONE || item.status === EChecklistItemStatus.SKIPPED;

  const commitName = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setName(item.name);
      return;
    }
    // update() rethrows after toasting so the store can roll back the
    // optimistic edit; nothing here needs the rejection, so swallow it.
    if (trimmed !== item.name) checklistOperations.update(checklistItemId, { name: trimmed }).catch(() => {});
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      inputRef.current?.blur();
    } else if (e.key === "Escape") {
      setName(item.name);
      inputRef.current?.blur();
    }
  };

  const handleStatusChange = (status: EChecklistItemStatus) => {
    if (status !== item.status) checklistOperations.setStatus(checklistItemId, status).catch(() => {});
  };

  const handleDeleteClick = () => {
    if (isConfirmingDelete) {
      checklistOperations.remove(checklistItemId);
      setIsConfirmingDelete(false);
    } else {
      setIsConfirmingDelete(true);
    }
  };

  return (
    <Fragment>
      <DropIndicator isVisible={isDraggedOver && closestEdge === "top"} />
      <div
        ref={rowRef}
        className={cn(
          "group flex items-center gap-2 rounded-sm px-1 py-0.5 hover:bg-surface-2",
          isDraggable && !disabled && "cursor-grab"
        )}
      >
        <input
          ref={inputRef}
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={commitName}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          className={cn(
            "w-0 flex-1 rounded-sm border border-transparent bg-transparent px-2 py-1 text-13 outline-none focus:border-subtle focus:bg-surface-1",
            isTerminal ? "text-tertiary line-through" : "text-primary",
            item.status === EChecklistItemStatus.SKIPPED && "opacity-60"
          )}
        />
        <ChecklistStatusDropdown value={item.status} onChange={handleStatusChange} disabled={disabled} />
        {!disabled && (
          <button
            ref={deleteButtonRef}
            type="button"
            onClick={handleDeleteClick}
            className={cn(
              "flex-shrink-0 rounded-sm p-1 hover:bg-layer-1",
              isConfirmingDelete
                ? "bg-red-500/10 text-red-500 hover:bg-red-500/20 flex items-center gap-1 px-1.5 text-13 font-medium"
                : "hidden text-placeholder group-focus-within:block group-hover:block hover:text-secondary"
            )}
            aria-label={isConfirmingDelete ? t("common.confirm") : t("common.actions.delete")}
            title={isConfirmingDelete ? t("common.confirm") : undefined}
          >
            <DeleteOutline className="h-3.5 w-3.5" />
            {isConfirmingDelete && t("common.confirm")}
          </button>
        )}
      </div>
      <DropIndicator isVisible={isDraggedOver && closestEdge === "bottom"} />
    </Fragment>
  );
});
