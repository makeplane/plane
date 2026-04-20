/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import { useEffect, useRef, useState } from "react";
import { combine } from "@atlaskit/pragmatic-drag-and-drop/combine";
import { draggable } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { observer } from "mobx-react";
// plane helpers
import { useOutsideClickDetector } from "@plane/hooks";
// helpers
import { HIGHLIGHT_CLASS } from "@/helpers/common";
// components
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
import type { TRenderQuickActions } from "../list/list-view-types";
import { CalendarIssueBlock } from "./issue-block";
// types

import type { TIssue } from "@plane/types";
import type { TWorkItemProperty } from "@/store/work-items/permissions/root";

type Props = {
  issueId: string;
  quickActions: TRenderQuickActions;
  isEpic?: boolean;
  getWorkItemPermissions: (workItem: TIssue) => {
    canEditProperty: (property: TWorkItemProperty) => boolean;
    canDragAndDrop: boolean;
  };
};

export const CalendarIssueBlockRoot = observer(function CalendarIssueBlockRoot(props: Props) {
  const { issueId, quickActions, isEpic = false, getWorkItemPermissions } = props;
  // refs
  const issueRef = useRef<HTMLAnchorElement | null>(null);
  // states
  const [isDragging, setIsDragging] = useState(false);
  // store hooks
  const {
    issue: { getIssueById },
  } = useIssueDetail();
  // derived values
  const issue = getIssueById(issueId);
  const permissions = issue ? getWorkItemPermissions(issue) : undefined;
  const canDragAndDrop = permissions?.canDragAndDrop ?? false;

  useEffect(() => {
    if (!issue) return;
    const element = issueRef.current;
    if (!element) return;

    return combine(
      draggable({
        element,
        canDrag: () => canDragAndDrop,
        getInitialData: () => ({ id: issue?.id, date: issue?.target_date }),
        onDragStart: () => {
          setIsDragging(true);
        },
        onDrop: () => {
          setIsDragging(false);
        },
      })
    );
  }, [issue, canDragAndDrop]);

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
