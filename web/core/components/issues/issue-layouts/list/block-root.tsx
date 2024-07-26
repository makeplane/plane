"use client";

import React, { FC, MutableRefObject, useEffect, useRef, useState } from "react";
import { combine } from "@atlaskit/pragmatic-drag-and-drop/combine";
import { dropTargetForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { attachInstruction, extractInstruction } from "@atlaskit/pragmatic-drag-and-drop-hitbox/tree-item";
import { observer } from "mobx-react";
// types
import { IIssueDisplayProperties, TIssue, TIssueMap } from "@plane/types";
// components
import { DropIndicator } from "@plane/ui";
import RenderIfVisible from "@/components/core/render-if-visible-HOC";
import { IssueBlock } from "@/components/issues/issue-layouts/list";
// hooks
import { useIssueDetail } from "@/hooks/store";
import { TSelectionHelper } from "@/hooks/use-multiple-select";
import useOutsideClickDetector from "@/hooks/use-outside-click-detector";
// types
import { HIGHLIGHT_CLASS, getIssueBlockId } from "../utils";
import { TRenderQuickActions } from "./list-view-types";

type Props = {
  issueIds: string[];
  issueId: string;
  issuesMap: TIssueMap;
  updateIssue: ((projectId: string | null, issueId: string, data: Partial<TIssue>) => Promise<void>) | undefined;
  quickActions: TRenderQuickActions;
  canEditProperties: (projectId: string | undefined) => boolean;
  displayProperties: IIssueDisplayProperties | undefined;
  nestingLevel: number;
  spacingLeft?: number;
  containerRef: MutableRefObject<HTMLDivElement | null>;
  selectionHelpers: TSelectionHelper;
  groupId: string;
  isDragAllowed: boolean;
  canDropOverIssue: boolean;
  isParentIssueBeingDragged?: boolean;
  isLastChild?: boolean;
};

export const IssueBlockRoot: FC<Props> = observer((props) => {
  const {
    issueIds,
    issueId,
    issuesMap,
    groupId,
    updateIssue,
    quickActions,
    canEditProperties,
    displayProperties,
    nestingLevel,
    spacingLeft = 14,
    containerRef,
    isDragAllowed,
    canDropOverIssue,
    isParentIssueBeingDragged = false,
    isLastChild = false,
    selectionHelpers,
  } = props;
  // states
  const [isExpanded, setExpanded] = useState<boolean>(false);
  const [instruction, setInstruction] = useState<"DRAG_OVER" | "DRAG_BELOW" | undefined>(undefined);
  const [isCurrentBlockDragging, setIsCurrentBlockDragging] = useState(false);
  // ref
  const issueBlockRef = useRef<HTMLDivElement | null>(null);
  // store hooks
  const { subIssues: subIssuesStore } = useIssueDetail();

  const isSubIssue = nestingLevel !== 0;

  useEffect(() => {
    const blockElement = issueBlockRef.current;

    if (!blockElement) return;

    return combine(
      dropTargetForElements({
        element: blockElement,
        canDrop: ({ source }) => source?.data?.id !== issueId && !isSubIssue && canDropOverIssue,
        getData: ({ input, element }) => {
          const data = { id: issueId, type: "ISSUE" };

          // attach instruction for last in list
          return attachInstruction(data, {
            input,
            element,
            currentLevel: 0,
            indentPerLevel: 0,
            mode: isLastChild ? "last-in-group" : "standard",
          });
        },
        onDrag: ({ self }) => {
          const extractedInstruction = extractInstruction(self?.data)?.type;
          // check if the highlight is to be shown above or below
          setInstruction(
            extractedInstruction
              ? extractedInstruction === "reorder-below" && isLastChild
                ? "DRAG_BELOW"
                : "DRAG_OVER"
              : undefined
          );
        },
        onDragLeave: () => {
          setInstruction(undefined);
        },
        onDrop: () => {
          setInstruction(undefined);
        },
      })
    );
  }, [issueId, isLastChild, issueBlockRef, isSubIssue, canDropOverIssue, setInstruction]);

  useOutsideClickDetector(issueBlockRef, () => {
    issueBlockRef?.current?.classList?.remove(HIGHLIGHT_CLASS);
  });

  if (!issueId) return null;

  const subIssues = subIssuesStore.subIssuesByIssueId(issueId);
  return (
    <div className="relative" ref={issueBlockRef} id={getIssueBlockId(issueId, groupId)}>
      <DropIndicator classNames={"absolute top-0 z-[2]"} isVisible={instruction === "DRAG_OVER"} />
      <RenderIfVisible
        key={`${issueId}`}
        defaultHeight="3rem"
        root={containerRef}
        classNames={`relative ${isLastChild && !isExpanded ? "" : "border-b border-b-custom-border-200"}`}
        verticalOffset={100}
      >
        <IssueBlock
          issueId={issueId}
          issuesMap={issuesMap}
          groupId={groupId}
          updateIssue={updateIssue}
          quickActions={quickActions}
          canEditProperties={canEditProperties}
          displayProperties={displayProperties}
          isExpanded={isExpanded}
          setExpanded={setExpanded}
          nestingLevel={nestingLevel}
          spacingLeft={spacingLeft}
          selectionHelpers={selectionHelpers}
          canDrag={!isSubIssue && isDragAllowed}
          isCurrentBlockDragging={isParentIssueBeingDragged || isCurrentBlockDragging}
          setIsCurrentBlockDragging={setIsCurrentBlockDragging}
        />
      </RenderIfVisible>

      {isExpanded &&
        subIssues?.map((subIssueId) => (
          <IssueBlockRoot
            key={`${subIssueId}`}
            issueIds={issueIds}
            issueId={subIssueId}
            issuesMap={issuesMap}
            updateIssue={updateIssue}
            quickActions={quickActions}
            canEditProperties={canEditProperties}
            displayProperties={displayProperties}
            nestingLevel={nestingLevel + 1}
            spacingLeft={spacingLeft + 12}
            containerRef={containerRef}
            selectionHelpers={selectionHelpers}
            groupId={groupId}
            isDragAllowed={isDragAllowed}
            canDropOverIssue={canDropOverIssue}
            isParentIssueBeingDragged={isParentIssueBeingDragged || isCurrentBlockDragging}
          />
        ))}
      {isLastChild && <DropIndicator classNames={"absolute z-[2]"} isVisible={instruction === "DRAG_BELOW"} />}
    </div>
  );
});
