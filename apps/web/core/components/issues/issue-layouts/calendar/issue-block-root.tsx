import React, { useEffect, useRef, useState } from "react";
import { combine } from "@atlaskit/pragmatic-drag-and-drop/combine";
import { draggable } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { observer } from "mobx-react";
// plane helpers
import { useOutsideClickDetector } from "@plane/hooks";
// components
import { CalendarIssueBlock } from "@/components/issues";
import { useIssueDetail } from "@/hooks/store";
import { TRenderQuickActions } from "../list/list-view-types";
import { HIGHLIGHT_CLASS } from "../utils";
// types

type Props = {
  issueId: string;
  quickActions: TRenderQuickActions;
  isDragDisabled: boolean;
  isEpic?: boolean;
  canEditProperties: (projectId: string | undefined) => boolean;
};

export const CalendarIssueBlockRoot: React.FC<Props> = observer((props) => {
  const { issueId, quickActions, isDragDisabled, isEpic = false, canEditProperties } = props;

  const issueRef = useRef<HTMLAnchorElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const {
    issue: { getIssueById },
  } = useIssueDetail();

  const issue = getIssueById(issueId);

  const canDrag = !isDragDisabled && canEditProperties(issue?.project_id ?? undefined);

  useEffect(() => {
    const element = issueRef.current;

    if (!element) return;

    return combine(
      draggable({
        element,
        canDrag: () => canDrag,
        getInitialData: () => ({ id: issue?.id, date: issue?.target_date }),
        onDragStart: () => {
          setIsDragging(true);
        },
        onDrop: () => {
          setIsDragging(false);
        },
      })
    );
  }, [issueRef?.current, issue, canDrag]);

  useOutsideClickDetector(issueRef, () => {
    issueRef?.current?.classList?.remove(HIGHLIGHT_CLASS);
  });

  if (!issue) return null;

  return (
    <CalendarIssueBlock
      isDragging={isDragging}
      issue={issue}
      quickActions={quickActions}
      ref={issueRef}
      isEpic={isEpic}
    />
  );
});
