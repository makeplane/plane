/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "@plane/i18n";
import { setToast, TOAST_TYPE } from "@plane/propel/toast";
import type { TIssueRelationTypes } from "@plane/types";
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
import { useTimeLineChartStore } from "@/hooks/use-timeline-chart";
import type { TDependencyDragEdge } from "@/plane-web/store/timeline/base-timeline.store";
import { CHART_CONTENT_ID, clientToChart } from "./chart-coords";
import { relationAlreadyExists, wouldCreateCycle } from "./cycle-check";

/**
 * Detected drop candidate: which block the pointer is over and which half
 * (left vs right) of that block. Kept separate from the store target because
 * the target is only written through an action.
 */
type TDropCandidate = {
  blockId: string;
  edge: TDependencyDragEdge;
};

/**
 * Payload passed to the shift+drop picker so it can commit the chosen
 * relation_type without re-deriving source/target from scratch.
 */
export type TPickerPayload = {
  sourceId: string;
  targetId: string;
  /** Viewport-relative pointer position — picker anchors to this. */
  clientX: number;
  clientY: number;
  /**
   * Default relation type inferred from the drag geometry
   * (right→left = blocking, left→right = blocked_by). Picker highlights this.
   */
  defaultRelationType: TIssueRelationTypes;
};

/** Walk ancestors of `el` looking for a `data-block-id`. Stops at document body. */
function findBlockIdFromPoint(el: Element | null): string | null {
  let cursor: Element | null = el;
  while (cursor && cursor !== document.body) {
    const blockId = cursor.getAttribute?.("data-block-id");
    if (blockId) return blockId;
    cursor = cursor.parentElement;
  }
  return null;
}

/**
 * Edge inferred from which half of a block the pointer sits over.
 * Returns `null` if the element no longer has a DOM rect (unlikely here since
 * the block shell renders even when the inner `RenderIfVisible` unmounts).
 */
function detectTargetEdge(blockEl: Element, clientX: number): TDependencyDragEdge | null {
  const rect = blockEl.getBoundingClientRect();
  if (rect.width <= 0) return null;
  const midpoint = rect.left + rect.width / 2;
  return clientX < midpoint ? "left" : "right";
}

/**
 * Map the drag geometry to a canonical `createCurrentRelation` call.
 * Returns `null` for combinations that are not meaningful (e.g. right→right).
 */
function inferRelationType(
  sourceEdge: TDependencyDragEdge,
  targetEdge: TDependencyDragEdge
): TIssueRelationTypes | null {
  if (sourceEdge === "right" && targetEdge === "left") return "blocking";
  if (sourceEdge === "left" && targetEdge === "right") return "blocked_by";
  return null;
}

/**
 * Directional source/target in the precedence graph for a cycle check.
 * `blocking` = source precedes target, `blocked_by` = target precedes source.
 */
function toPrecedenceEdge(
  sourceId: string,
  targetId: string,
  relationType: TIssueRelationTypes
): { precedes: string; follows: string } {
  if (relationType === "blocking") return { precedes: sourceId, follows: targetId };
  return { precedes: targetId, follows: sourceId };
}

export type TUseDependencyDragReturn = {
  pickerPayload: TPickerPayload | null;
  /** Picker calls this with the user's chosen relation type; `null` = cancel. */
  resolvePicker: (relationType: TIssueRelationTypes | null) => void;
};

/**
 * Drives the dependency-drag gesture.
 *
 * Listens on the document while a drag is active, updates `dragPoint` /
 * `dragTarget` on the timeline store, and commits via `createCurrentRelation`
 * on mouseup. Coordinate conversion goes through `clientToChart` so every
 * write is in chart-local coords (see `./chart-coords.ts`).
 */
export function useDependencyDrag(): TUseDependencyDragReturn {
  const store = useTimeLineChartStore();
  const { relation } = useIssueDetail();
  const { t } = useTranslation();
  const [pickerPayload, setPickerPayload] = useState<TPickerPayload | null>(null);

  /**
   * Commit a relation via the existing optimistic path. Any server failure
   * rolls back inside `createCurrentRelation` itself — we just surface a
   * toast so the user knows the temporary line disappeared on purpose.
   */
  const commitRelation = useCallback(
    async (sourceId: string, targetId: string, relationType: TIssueRelationTypes) => {
      try {
        await relation.createCurrentRelation(sourceId, relationType, targetId);
      } catch {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: t("common.error.label"),
          message: t("gantt_dependency.creation_failed"),
        });
      }
    },
    [relation, t]
  );

  /**
   * Produce a drop resolution from a detected target, or null if the geometry
   * is invalid / already exists / would cycle. Caller uses `isValid` to
   * toggle the red feedback line without committing.
   */
  const resolveDrop = useCallback(
    (sourceId: string, sourceEdge: TDependencyDragEdge, candidate: TDropCandidate) => {
      // Self-reference: never valid, no picker, no commit.
      if (candidate.blockId === sourceId) {
        return { isValid: false, relationType: null as TIssueRelationTypes | null };
      }
      const relationType = inferRelationType(sourceEdge, candidate.edge);
      if (!relationType) return { isValid: false, relationType: null };
      if (relationAlreadyExists(relation.relationMap, sourceId, relationType, candidate.blockId)) {
        return { isValid: false, relationType };
      }
      const { precedes, follows } = toPrecedenceEdge(sourceId, candidate.blockId, relationType);
      if (wouldCreateCycle(relation.relationMap, precedes, follows)) {
        return { isValid: false, relationType };
      }
      return { isValid: true, relationType };
    },
    [relation.relationMap]
  );

  const resolvePicker = useCallback(
    (relationType: TIssueRelationTypes | null) => {
      const payload = pickerPayload;
      setPickerPayload(null);
      if (!payload || !relationType) return;
      // Block explicit picker cycle-closure too — the user may pick a type we
      // didn't default to, and cycle semantics only apply to blocking/blocked_by.
      if (relationType === "blocking" || relationType === "blocked_by") {
        const { precedes, follows } = toPrecedenceEdge(payload.sourceId, payload.targetId, relationType);
        if (wouldCreateCycle(relation.relationMap, precedes, follows)) {
          setToast({
            type: TOAST_TYPE.ERROR,
            title: t("common.error.label"),
            message: t("gantt_dependency.cycle_detected"),
          });
          return;
        }
      }
      if (relationAlreadyExists(relation.relationMap, payload.sourceId, relationType, payload.targetId)) {
        setToast({
          type: TOAST_TYPE.INFO,
          title: t("gantt_dependency.notice_title"),
          message: t("gantt_dependency.already_exists"),
        });
        return;
      }
      void commitRelation(payload.sourceId, payload.targetId, relationType);
    },
    [commitRelation, pickerPayload, relation.relationMap, t]
  );

  useEffect(() => {
    if (!store.dragSource) return;
    // Capture the source snapshot so event handlers survive mid-flight store mutations.
    const source = store.dragSource;

    const onMouseMove = (e: MouseEvent) => {
      // Convert pointer to chart-local coordinates for the dynamic bezier.
      // `clientToChart` subtracts the `#gantt-chart-content` rect, which is
      // the same origin `blocksMap[*].position.marginLeft` is measured from.
      const chartPoint = clientToChart(e.clientX, e.clientY);
      if (chartPoint) store.updateDependencyDragPoint(chartPoint);

      const hitElement = document.elementFromPoint(e.clientX, e.clientY);
      const blockId = findBlockIdFromPoint(hitElement);
      if (!blockId) {
        if (store.dragTarget) store.setDependencyDragTarget(null);
        return;
      }

      const blockEl = hitElement?.closest?.("[data-block-id]") ?? null;
      if (!blockEl) {
        if (store.dragTarget) store.setDependencyDragTarget(null);
        return;
      }

      // Defensive: ignore `data-block-id` attributes that may exist outside
      // the chart content (none today, but keeps the hook scoped).
      const chartEl = document.getElementById(CHART_CONTENT_ID);
      if (chartEl && !chartEl.contains(blockEl)) {
        if (store.dragTarget) store.setDependencyDragTarget(null);
        return;
      }

      const edge = detectTargetEdge(blockEl, e.clientX);
      if (!edge) {
        if (store.dragTarget) store.setDependencyDragTarget(null);
        return;
      }

      const { isValid } = resolveDrop(source.blockId, source.edge, { blockId, edge });
      // Even invalid targets update the store so the dynamic path can show red.
      if (
        store.dragTarget?.blockId !== blockId ||
        store.dragTarget?.edge !== edge ||
        store.dragTarget?.isValid !== isValid
      ) {
        store.setDependencyDragTarget({ blockId, edge, isValid });
      }
    };

    const onMouseUp = (e: MouseEvent) => {
      const currentTarget = store.dragTarget;
      // Target gone (mouse up outside any block) → silent cancel. No toast:
      // accidental mis-clicks shouldn't be punished.
      if (!currentTarget) {
        store.endDependencyDrag();
        return;
      }

      const resolution = resolveDrop(source.blockId, source.edge, {
        blockId: currentTarget.blockId,
        edge: currentTarget.edge,
      });

      if (!resolution.isValid || !resolution.relationType) {
        // Invalid combo / duplicate / cycle → toast only when the user clearly
        // intended a connection (valid edge combo but blocked by validation).
        const combo = inferRelationType(source.edge, currentTarget.edge);
        if (combo) {
          const isDuplicate = relationAlreadyExists(relation.relationMap, source.blockId, combo, currentTarget.blockId);
          const isSelf = currentTarget.blockId === source.blockId;
          const message = isSelf
            ? t("gantt_dependency.invalid_target")
            : isDuplicate
              ? t("gantt_dependency.already_exists")
              : t("gantt_dependency.cycle_detected");
          setToast({
            type: isDuplicate ? TOAST_TYPE.INFO : TOAST_TYPE.ERROR,
            title: isDuplicate ? t("gantt_dependency.notice_title") : t("common.error.label"),
            message,
          });
        }
        store.endDependencyDrag();
        return;
      }

      if (e.shiftKey) {
        // Open picker — endDrag runs after the user resolves it so the source
        // block keeps its force-render until the modal closes.
        setPickerPayload({
          sourceId: source.blockId,
          targetId: currentTarget.blockId,
          clientX: e.clientX,
          clientY: e.clientY,
          defaultRelationType: resolution.relationType,
        });
        store.endDependencyDrag();
        return;
      }

      void commitRelation(source.blockId, currentTarget.blockId, resolution.relationType);
      store.endDependencyDrag();
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        store.endDependencyDrag();
      }
    };

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [store, relation.relationMap, resolveDrop, commitRelation, t, store.dragSource]);

  return useMemo(() => ({ pickerPayload, resolvePicker }), [pickerPayload, resolvePicker]);
}
