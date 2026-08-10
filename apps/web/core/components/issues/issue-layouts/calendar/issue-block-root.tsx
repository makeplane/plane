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
// components
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
import type { TRenderQuickActions } from "../list/list-view-types";
import { HIGHLIGHT_CLASS } from "../utils";
import { CalendarIssueBlock } from "./issue-block";
// types

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
  const { issueId, quickActions, isDragDisabled, sourceDate, isEpic = false, canEditProperties, showDueDateBadge } =
    props;

  const dragRef = useRef<HTMLDivElement | null>(null);
  const issueRef = useRef<HTMLAnchorElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const {
    issue: { getIssueById },
  } = useIssueDetail();

  const issue = getIssueById(issueId);

  const canDrag = !isDragDisabled && canEditProperties(issue?.project_id ?? undefined);

  useEffect(() => {
    const element = dragRef.current;

    if (!element) return;

    return combine(
      draggable({
        element,
        canDrag: () => canDrag,
        getInitialData: () => ({ id: issue?.id, date: sourceDate, type: "CALENDAR_ISSUE" }),
        onDragStart: () => {
          setIsDragging(true);
        },
        onDrop: () => {
          setIsDragging(false);
        },
      })
    );
  }, [issue?.id, sourceDate, canDrag, isDragDisabled]);

  useOutsideClickDetector(issueRef, () => {
    issueRef?.current?.classList?.remove(HIGHLIGHT_CLASS);
  });

  if (!issue) return null;

  return (
    <div ref={dragRef} className={canDrag ? "cursor-grab active:cursor-grabbing" : undefined}>
      <CalendarIssueBlock
        isDragging={isDragging}
        issue={issue}
        quickActions={quickActions}
        ref={issueRef}
        isEpic={isEpic}
        showDueDateBadge={showDueDateBadge}
      />
    </div>
  );
});
