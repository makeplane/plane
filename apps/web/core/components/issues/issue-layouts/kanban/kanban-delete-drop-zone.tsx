/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useRef, useState } from "react";
import { combine } from "@atlaskit/pragmatic-drag-and-drop/combine";
import { dropTargetForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { observer } from "mobx-react";
// hooks
import { useKanbanView } from "@/hooks/store/use-kanban-view";
// helpers
import { getSourceFromDropPayload } from "../utils";

type Props = {
  onRequestDelete: (issueId: string | undefined) => void;
};

// Isolated from BaseKanBanRoot so a drag start/end re-renders only this banner, not the whole board.
export const KanbanDeleteDropZone = observer(function KanbanDeleteDropZone({ onRequestDelete }: Props) {
  // refs
  const deleteAreaRef = useRef<HTMLDivElement | null>(null);
  // states
  const [isDragOverDelete, setIsDragOverDelete] = useState(false);
  // store hooks
  const { isDragging } = useKanbanView();

  useEffect(() => {
    const element = deleteAreaRef.current;
    if (!element) return;

    return combine(
      dropTargetForElements({
        element,
        getData: () => ({ columnId: "issue-trash-box", groupId: "issue-trash-box", type: "DELETE" }),
        onDragEnter: () => setIsDragOverDelete(true),
        onDragLeave: () => setIsDragOverDelete(false),
        onDrop: (payload) => {
          setIsDragOverDelete(false);
          const source = getSourceFromDropPayload(payload);
          if (!source) return;
          onRequestDelete(source.id);
        },
      })
    );
  }, [onRequestDelete]);

  return (
    <div
      className={`fixed left-1/2 -translate-x-1/2 ${
        isDragging ? "z-40" : ""
      } top-3 mx-3 flex w-72 items-center justify-center`}
      ref={deleteAreaRef}
    >
      <div
        className={`${
          isDragging ? `opacity-100` : `opacity-0`
        } flex w-full items-center justify-center rounded-sm border-2 border-danger-strong/20 bg-surface-1 px-3 py-5 text-11 font-medium text-danger-primary italic ${
          isDragOverDelete ? "bg-danger-primary blur-2xl" : ""
        } transition duration-300`}
      >
        Drop here to delete the work item.
      </div>
    </div>
  );
});
