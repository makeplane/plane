/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React, { useEffect, useRef, useState } from "react";
import { combine } from "@atlaskit/pragmatic-drag-and-drop/combine";
import { draggable } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { observer } from "mobx-react";
// plane helpers
import { useOutsideClickDetector } from "@plane/hooks";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
// components
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
import type { TRenderQuickActions } from "../list/list-view-types";
import { cn } from "@plane/utils";
import { HIGHLIGHT_CLASS } from "../utils";
import { CalendarIssueBlock } from "./issue-block";
import { createCalendarDragPreviewHandler } from "./drag-preview";
import { CALENDAR_ISSUE_DRAG_TYPE } from "./utils";

type Props = {
  issueId: string;
  quickActions: TRenderQuickActions;
  isDragDisabled: boolean;
  sourceDate: string;
  isEpic?: boolean;
  canEditProperties: (projectId: string | undefined) => boolean;
  showDueDateBadge?: boolean;
  showProjectBadge?: boolean;
  stackProjectBadge?: boolean;
};

export const CalendarIssueBlockRoot = observer(function CalendarIssueBlockRoot(props: Props) {
  const {
    issueId,
    quickActions,
    isDragDisabled,
    sourceDate,
    isEpic = false,
    canEditProperties,
    showDueDateBadge,
    showProjectBadge,
    stackProjectBadge,
  } = props;

  // Match board/kanban: register Pragmatic on the ControlLink <a>, not a wrapper div,
  // so the browser does not start a native link drag that never hits calendar drop targets.
  const cardRef = useRef<HTMLAnchorElement | null>(null);
  const grabOffsetRef = useRef({ x: 8, y: 8 });
  const [isDragging, setIsDragging] = useState(false);

  const {
    issue: { getIssueById },
  } = useIssueDetail();

  const issue = getIssueById(issueId);

  const canDrag = !isDragDisabled && canEditProperties(issue?.project_id ?? undefined);

  useEffect(() => {
    const element = cardRef.current;
    if (!element || !issue?.id) return;

    return combine(
      draggable({
        element,
        dragHandle: element,
        canDrag: () => canDrag,
        getInitialData: ({ input, element: dragElement }) => {
          const rect = dragElement.getBoundingClientRect();
          grabOffsetRef.current = {
            x: input.clientX - rect.left,
            y: input.clientY - rect.top,
          };
          return {
            id: issue.id,
            date: sourceDate,
            type: CALENDAR_ISSUE_DRAG_TYPE,
            grabOffsetY: grabOffsetRef.current.y,
            grabOffsetX: grabOffsetRef.current.x,
            issueName: issue.name,
          };
        },
        onDragStart: () => {
          setIsDragging(true);
        },
        onDrop: () => {
          setIsDragging(false);
        },
        onGenerateDragPreview: showDueDateBadge
          ? createCalendarDragPreviewHandler(() => ({
              title: issue.name,
              grabOffsetX: grabOffsetRef.current.x,
              grabOffsetY: grabOffsetRef.current.y,
            }))
          : undefined,
      })
    );
    // Same dependency pattern as kanban/block.tsx — rebind when the card node mounts.
    // oxlint-disable-next-line eslint-plugin-react-hooks/exhaustive-deps
  }, [cardRef?.current, issue?.id, sourceDate, canDrag, isDragDisabled, showDueDateBadge]);

  useOutsideClickDetector(cardRef, () => {
    cardRef?.current?.classList?.remove(HIGHLIGHT_CLASS);
  });

  if (!issue) return null;

  return (
    <div
      role="presentation"
      id={`issue-${issueId}`}
      className={cn(canDrag ? "cursor-grab active:cursor-grabbing" : undefined, {
        "relative z-[5]": isDragging && showDueDateBadge,
      })}
      onClick={(e) => e.stopPropagation()}
      onDragStart={() => {
        if (canDrag) return;
        setToast({
          type: TOAST_TYPE.WARNING,
          title: "Cannot move work item",
          message: "You are not allowed to reschedule this work item",
        });
      }}
    >
      <CalendarIssueBlock
        isDragging={isDragging}
        issue={issue}
        quickActions={quickActions}
        ref={cardRef}
        isEpic={isEpic}
        showDueDateBadge={showDueDateBadge}
        showProjectBadge={showProjectBadge}
        stackProjectBadge={stackProjectBadge}
      />
    </div>
  );
});
