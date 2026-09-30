/**
 * Copyright (c) 2026-present Okręgowa Spółdzielnia Mleczarska w Piątnicy
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { RefObject } from "react";
import { useCallback } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { useTranslation } from "@plane/i18n";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { IGanttBlock, TIssueRelationTypes } from "@plane/types";
import { EIssueServiceType } from "@plane/types";
import { cn } from "@plane/utils";
import { BLOCK_HEIGHT, HEADER_HEIGHT, SIDEBAR_WIDTH } from "@/components/gantt-chart/constants";
import { getIssueApiErrorMessage } from "@/helpers/issue-api-error";
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
import { useTimeLineChartStore } from "@/hooks/use-timeline-chart";

type Props = {
  block: IGanttBlock;
  ganttContainerRef: RefObject<HTMLDivElement>;
  side: "left" | "right";
};

const getChartPointFromClient = (
  container: HTMLDivElement,
  clientX: number,
  clientY: number
): { x: number; y: number } => {
  const rect = container.getBoundingClientRect();
  return {
    x: clientX - rect.left - SIDEBAR_WIDTH + container.scrollLeft,
    y: clientY - rect.top - HEADER_HEIGHT + container.scrollTop,
  };
};

export const DependencySideDraggable = observer(function DependencySideDraggable(props: Props) {
  const { block, ganttContainerRef, side } = props;
  const { t } = useTranslation();
  const { workspaceSlug } = useParams();
  const { blockIds, setDependencyDrag, getBlockById, isDependencyEnabled } = useTimeLineChartStore();
  const { relation } = useIssueDetail(EIssueServiceType.ISSUES);

  const findTargetBlockId = useCallback(
    (clientX: number, clientY: number) => {
      const container = ganttContainerRef.current;
      if (!container || !blockIds) return null;
      const { x, y } = getChartPointFromClient(container, clientX, clientY);

      let rowMatch: string | null = null;
      for (let index = 0; index < blockIds.length; index++) {
        const candidateId = blockIds[index];
        if (candidateId === block.id) continue;
        const candidate = getBlockById(candidateId);
        if (!candidate?.position) continue;
        const top = index * BLOCK_HEIGHT;
        const bottom = top + BLOCK_HEIGHT;
        if (y < top || y > bottom) continue;

        const left = candidate.position.marginLeft;
        const right = left + candidate.position.width;
        if (x >= left - 12 && x <= right + 12) return candidateId;
        rowMatch = candidateId;
      }
      return rowMatch;
    },
    [block.id, blockIds, ganttContainerRef, getBlockById]
  );

  const handleMouseDown = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (!isDependencyEnabled || event.button !== 0) return;

    const container = ganttContainerRef.current;
    if (!container || !block.position || !blockIds) return;

    const blockIndex = blockIds.indexOf(block.id);
    if (blockIndex < 0) return;

    const startX = side === "left" ? block.position.marginLeft : block.position.marginLeft + block.position.width;
    const startY = blockIndex * BLOCK_HEIGHT + BLOCK_HEIGHT / 2;

    setDependencyDrag({
      sourceBlockId: block.id,
      fromSide: side,
      startX,
      startY,
      currentX: startX,
      currentY: startY,
    });

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const { x: currentX, y: currentY } = getChartPointFromClient(container, moveEvent.clientX, moveEvent.clientY);
      setDependencyDrag({
        sourceBlockId: block.id,
        fromSide: side,
        startX,
        startY,
        currentX,
        currentY,
      });
    };

    const handleMouseUp = async (upEvent: MouseEvent) => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      setDependencyDrag(null);

      const targetId = findTargetBlockId(upEvent.clientX, upEvent.clientY);
      if (!targetId || !workspaceSlug) return;

      const targetBlock = getBlockById(targetId);
      const projectId = block.meta?.project_id ?? targetBlock?.meta?.project_id;
      if (!projectId) return;

      const relationType: TIssueRelationTypes = side === "right" ? "blocking" : "blocked_by";

      try {
        await relation.createRelation(workspaceSlug.toString(), projectId.toString(), block.id, relationType, [
          targetId,
        ]);
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: t("common.success"),
          message: t("issue.relation.dependency_created"),
        });
      } catch (error) {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: t("toast.error"),
          message: getIssueApiErrorMessage(error, t("issue.relation.dependency_create_failed"), t),
        });
      }
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  if (!isDependencyEnabled) return null;

  return (
    <button
      type="button"
      aria-label={side === "left" ? "Create blocked-by dependency" : "Create blocking dependency"}
      onMouseDown={handleMouseDown}
      className={cn(
        "border-custom-border-300 bg-custom-background-100 absolute top-1/2 z-[8] size-2.5 -translate-y-1/2 rounded-full border opacity-0 transition-opacity group-hover:opacity-100",
        side === "left" ? "-left-1.5" : "-right-1.5"
      )}
    />
  );
});
