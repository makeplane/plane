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
import { HIGHLIGHT_CLASS } from "../utils";
import { CalendarIssueBlock } from "./issue-block";
import { CALENDAR_ISSUE_DRAG_TYPE } from "./utils";

type Props = {
  issueId: string;
  quickActions: TRenderQuickActions;
  isDragDisabled: boolean;
  sourceDate: string;
  isEpic?: boolean;
  canEditProperties: (projectId: string | undefined) => boolean;
  showDueDateBadge?: boolean;
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
  } = props;

  // Match board/kanban: register Pragmatic on the ControlLink <a>, not a wrapper div,
  // so the browser does not start a native link drag that never hits calendar drop targets.
  const cardRef = useRef<HTMLAnchorElement | null>(null);
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
        getInitialData: () => ({ id: issue.id, date: sourceDate, type: CALENDAR_ISSUE_DRAG_TYPE }),
        onDragStart: () => {
          setIsDragging(true);
        },
        onDrop: () => {
          setIsDragging(false);
        },
      })
    );
    // Same dependency pattern as kanban/block.tsx — rebind when the card node mounts.
    // oxlint-disable-next-line eslint-plugin-react-hooks/exhaustive-deps
  }, [cardRef?.current, issue?.id, sourceDate, canDrag, isDragDisabled]);

  useOutsideClickDetector(cardRef, () => {
    cardRef?.current?.classList?.remove(HIGHLIGHT_CLASS);
  });

  if (!issue) return null;

  return (
    <div
      id={`issue-${issueId}`}
      className={canDrag ? "cursor-grab active:cursor-grabbing" : undefined}
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
      />
    </div>
  );
});
