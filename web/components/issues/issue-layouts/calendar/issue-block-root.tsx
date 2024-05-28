import React, { useEffect, useRef, useState } from "react";
import { combine } from "@atlaskit/pragmatic-drag-and-drop/combine";
import { draggable } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
// components
import { TIssueMap } from "@plane/types";
import { CalendarIssueBlock } from "@/components/issues";
import useOutsideClickDetector from "@/hooks/use-outside-click-detector";
import { TRenderQuickActions } from "../list/list-view-types";
import { HIGHLIGHT_CLASS } from "../utils";
// types

type Props = {
  issues: TIssueMap | undefined;
  issueId: string;
  quickActions: TRenderQuickActions;
  isDragDisabled: boolean;
};

export const CalendarIssueBlockRoot: React.FC<Props> = (props) => {
  const { issues, issueId, quickActions, isDragDisabled } = props;

  const issueRef = useRef<HTMLAnchorElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const issue = issues?.[issueId];

  useEffect(() => {
    const element = issueRef.current;

    if (!element) return;

    return combine(
      draggable({
        element,
        canDrag: () => !isDragDisabled,
        getInitialData: () => ({ id: issue?.id, date: issue?.target_date }),
        onDragStart: () => {
          setIsDragging(true);
        },
        onDrop: () => {
          setIsDragging(false);
        },
      })
    );
  }, [issueRef?.current, issue]);

  useOutsideClickDetector(issueRef, () => {
    issueRef?.current?.classList?.remove(HIGHLIGHT_CLASS);
  });

  if (!issue) return null;

  return <CalendarIssueBlock isDragging={isDragging} issue={issue} quickActions={quickActions} ref={issueRef} />;
};
