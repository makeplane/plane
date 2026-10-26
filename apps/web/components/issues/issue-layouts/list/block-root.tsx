/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { MutableRefObject } from "react";
import React, { useEffect, useRef, useState } from "react";
import { combine } from "@atlaskit/pragmatic-drag-and-drop/combine";
import { dropTargetForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { attachInstruction, extractInstruction } from "@atlaskit/pragmatic-drag-and-drop-hitbox/tree-item";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// plane helpers
import { useOutsideClickDetector } from "@plane/hooks";
// types
import type { IIssueDisplayProperties, TIssue, TIssueMap } from "@plane/types";
import { EIssueServiceType } from "@plane/types";
// components
import { DropIndicator } from "@plane/blocks/common";
import { setToast } from "@plane/blocks/toast";
import { useTranslation } from "@plane/i18n";
import RenderIfVisible from "@/components/core/render-if-visible-HOC";
import { ListLoaderItemRow } from "@/components/ui/loader/layouts/list-layout-loader";
// hooks
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
import { useHideClosedSubIssues } from "@/hooks/use-hide-closed-sub-issues";
import type { TSelectionHelper } from "@/hooks/use-multiple-select";
import { usePlatformOS } from "@/hooks/use-platform-os";
// types
import { HIGHLIGHT_CLASS, getIssueBlockId, isIssueNew } from "../utils";
import { IssueBlock } from "./block";
import { QuickAddSubIssue } from "./quick-add-sub-issue";
import type { TRenderQuickActions } from "./list-view-types";

type Props = {
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
  shouldRenderByDefault?: boolean;
  isEpic?: boolean;
};

export const IssueBlockRoot = observer(function IssueBlockRoot(props: Props) {
  const {
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
    shouldRenderByDefault,
    isEpic = false,
  } = props;
  // states
  const [isExpanded, setExpanded] = useState<boolean>(false);
  const [instruction, setInstruction] = useState<"DRAG_OVER" | "DRAG_BELOW" | "MAKE_CHILD" | undefined>(undefined);
  const [isCurrentBlockDragging, setIsCurrentBlockDragging] = useState(false);
  // d2m-plane: inline quick add of sub-work items
  const [isQuickAddingSubIssue, setIsQuickAddingSubIssue] = useState(false);
  const { workspaceSlug } = useParams();
  // ref
  const issueBlockRef = useRef<HTMLDivElement | null>(null);
  // hooks
  const { isMobile } = usePlatformOS();
  // store hooks
  const {
    subIssues: subIssuesStore,
    issue: { getIssueById },
  } = useIssueDetail(isEpic ? EIssueServiceType.EPICS : EIssueServiceType.ISSUES);
  const { t } = useTranslation();
  // d2m-plane: hide Closed sub-work items unless "Show closed" is enabled
  const hideClosedSubIssues = useHideClosedSubIssues();

  const isSubIssue = nestingLevel !== 0;

  // d2m-plane: drag & drop a work item onto the middle of another row to make it a sub-work item
  const isInMiddleOfRow = (input: { clientY: number }, element: Element) => {
    const row = element.querySelector(`#issue-${CSS.escape(issueId)}`) ?? element;
    const rect = row.getBoundingClientRect();
    if (rect.height === 0 || input.clientY < rect.top || input.clientY > rect.bottom) return false;
    const relative = (input.clientY - rect.top) / rect.height;
    return relative > 0.2 && relative < 0.8;
  };

  const canMakeChildOf = (sourceId: string | undefined) => {
    if (!sourceId || sourceId === issueId || isEpic) return false;
    const target = issuesMap[issueId] ?? getIssueById(issueId);
    const source = getIssueById(sourceId);
    if (!target || !source || !target.project_id || target.project_id !== source.project_id) return false;
    if (source.parent_id === issueId) return false; // already a child of this item
    if (!canEditProperties(target.project_id)) return false;
    // the target must not be (nested) under the dragged item — that would create a loop
    let ancestorId = target.parent_id;
    const visited = new Set<string>();
    while (ancestorId && !visited.has(ancestorId)) {
      if (ancestorId === sourceId) return false;
      visited.add(ancestorId);
      ancestorId = getIssueById(ancestorId)?.parent_id ?? null;
    }
    return true;
  };

  const handleMakeChild = async (sourceId: string) => {
    const target = issuesMap[issueId] ?? getIssueById(issueId);
    const source = getIssueById(sourceId);
    if (!target?.project_id || !source || !updateIssue || !workspaceSlug) return;
    const previousParentId = source.parent_id;
    try {
      await updateIssue(target.project_id, sourceId, { parent_id: issueId });
      setExpanded(true);
      await Promise.allSettled([
        subIssuesStore.fetchSubIssues(workspaceSlug.toString(), target.project_id, issueId),
        ...(previousParentId
          ? [subIssuesStore.fetchSubIssues(workspaceSlug.toString(), target.project_id, previousParentId)]
          : []),
      ]);
      setToast({
        type: "success",
        title: t("toast.success"),
        message: t("d2m_quick_actions.made_child", { name: source.name, parent: target.name }),
      });
    } catch {
      setToast({ type: "error", title: t("toast.error"), message: t("d2m_quick_actions.reparent_failed") });
    }
  };

  // keep the latest helpers for the (long-lived) drop target callbacks
  const makeChildRef = useRef({ isInMiddleOfRow, canMakeChildOf, handleMakeChild });
  makeChildRef.current = { isInMiddleOfRow, canMakeChildOf, handleMakeChild };

  useEffect(() => {
    const blockElement = issueBlockRef.current;

    if (!blockElement) return;

    return combine(
      dropTargetForElements({
        element: blockElement,
        canDrop: ({ source, input, element }) => {
          const sourceId = source?.data?.id as string | undefined;
          if (sourceId === issueId) return false;
          const helpers = makeChildRef.current;
          if (helpers.isInMiddleOfRow(input, element) && helpers.canMakeChildOf(sourceId)) return true;
          // re-ordering only between top-level rows (original behaviour)
          return !isSubIssue && canDropOverIssue && !source?.data?.isSubIssue;
        },
        getData: ({ input, element, source }) => {
          const data = { id: issueId, type: "ISSUE" };
          const helpers = makeChildRef.current;
          if (helpers.isInMiddleOfRow(input, element) && helpers.canMakeChildOf(source?.data?.id as string | undefined))
            return { ...data, d2mMakeChild: true };

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
          if (self?.data?.d2mMakeChild) {
            setInstruction("MAKE_CHILD");
            return;
          }
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
        onDrop: ({ self, source }) => {
          setInstruction(undefined);
          if (self?.data?.d2mMakeChild && typeof source?.data?.id === "string")
            void makeChildRef.current.handleMakeChild(source.data.id);
        },
      })
    );
  }, [issueId, isLastChild, issueBlockRef, isSubIssue, canDropOverIssue, setInstruction]);

  useOutsideClickDetector(issueBlockRef, () => {
    issueBlockRef?.current?.classList?.remove(HIGHLIGHT_CLASS);
  });

  if (!issueId || !issuesMap[issueId]?.created_at) return null;

  // d2m-plane: open the inline quick-add row (expanding the parent so the new items show up under it)
  const handleQuickAddSubIssue = () => {
    const parentIssue = issuesMap[issueId];
    if (!isExpanded && workspaceSlug && parentIssue?.project_id)
      void subIssuesStore.fetchSubIssues(workspaceSlug.toString(), parentIssue.project_id, issueId);
    setExpanded(true);
    setIsQuickAddingSubIssue(true);
  };

  const subIssues = hideClosedSubIssues(subIssuesStore.subIssuesByIssueId(issueId));
  return (
    <div className="relative" ref={issueBlockRef} id={getIssueBlockId(issueId, groupId)}>
      <DropIndicator classNames={"absolute top-0 z-[2]"} isVisible={instruction === "DRAG_OVER"} />
      <RenderIfVisible
        key={`${issueId}`}
        root={containerRef}
        classNames={`relative ${isLastChild && !isExpanded ? "" : "border-b border-b-subtle"}`}
        verticalOffset={100}
        defaultValue={shouldRenderByDefault || (issuesMap[issueId] ? isIssueNew(issuesMap[issueId]) : false)}
        placeholderChildren={<ListLoaderItemRow shouldAnimate={false} renderForPlaceHolder defaultPropertyCount={4} />}
        shouldRecordHeights={isMobile}
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
          // d2m-plane: every row (incl. sub-work items) can be dragged to re-parent it;
          // group moves / re-ordering are still limited by the list group's drop handler
          canDrag={!isEpic}
          isChildDropTarget={instruction === "MAKE_CHILD"}
          isCurrentBlockDragging={isParentIssueBeingDragged || isCurrentBlockDragging}
          setIsCurrentBlockDragging={setIsCurrentBlockDragging}
          isEpic={isEpic}
          onQuickAddSubIssue={handleQuickAddSubIssue}
        />
      </RenderIfVisible>

      {isExpanded &&
        !isEpic &&
        subIssues?.map((subIssueId) => (
          <IssueBlockRoot
            key={`${subIssueId}`}
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
            shouldRenderByDefault={isExpanded}
          />
        ))}
      {isQuickAddingSubIssue && !isEpic && issuesMap[issueId] && (
        <QuickAddSubIssue
          parentIssue={issuesMap[issueId]}
          spacingLeft={spacingLeft}
          onClose={() => setIsQuickAddingSubIssue(false)}
        />
      )}
      {isLastChild && <DropIndicator classNames={"absolute z-[2]"} isVisible={instruction === "DRAG_BELOW"} />}
    </div>
  );
});
