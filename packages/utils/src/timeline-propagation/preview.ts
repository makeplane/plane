/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { TTimelinePropagationWorkItem } from "@plane/types";
import { addDaysToDate, findTotalDaysInRange, renderFormattedPayloadDate } from "../datetime";

/** Edge of the loaded subset of the precedence graph (Phase 5 supplies). */
export type LoadedGraphEdge = { predecessor_id: string; successor_id: string };

/** Loaded Work Item (id + dated range) — Phase 5 supplies the snapshot at beginPreview. */
export type LoadedWorkItem = { id: string; start_date: string; target_date: string };

/** Loaded-graph preview map: per Work Item id, the new (start_date, target_date) under the requested move. */
export type PreviewResult = Map<string, { start_date: string; target_date: string }>;

/**
 * Args for {@link computeLoadedPreview}. The dragged Work Item's original and
 * requested dates are passed inline (not re-read from `items_by_id`) so the
 * helper can be called without mutating the loaded snapshot.
 */
export type ComputeLoadedPreviewDragged = {
  id: string;
  original_start_date: string;
  original_target_date: string;
  requested_start_date: string;
  requested_target_date: string;
};

/**
 * Loaded-graph preview for a Work Item drag (FE-01 / FE-02 / TEST-19).
 * Walks ONLY the loaded adjacency (Phase 4 has no full-graph view) and returns
 * the minimum set of Work Items whose dates would change. Advisory: the server
 * remains authoritative and replaces this map on success.
 *
 * Direction: requested_start_date > original_start_date → walk successors
 * (rightward); requested_start_date < original_start_date → walk predecessors
 * (leftward). Equal → just return the dragged Work Item with the requested
 * dates.
 *
 * Adjacency rule (PROP-10): successor.start_date == predecessor.target_date +
 * 1 calendar day is the canonical zero-gap. Pre-existing slack is preserved
 * unless the drag forces a violation.
 *
 * Branch case (D-04a): for a successor with multiple loaded predecessors, the
 * NEW start_date is `max(predecessor.new_target_date + 1)` — the
 * most-restrictive boundary.
 *
 * @param edges Loaded subset of precedence edges (predecessor → successor).
 * @param items_by_id Loaded Work Items keyed by id; `dragged.id` may or may
 *   not appear here.
 * @param dragged The dragged Work Item with original + requested date pair.
 * @returns A new `Map`; never mutates inputs (D-04c).
 */
export function computeLoadedPreview(
  edges: readonly LoadedGraphEdge[],
  items_by_id: Readonly<Record<string, LoadedWorkItem>>,
  dragged: ComputeLoadedPreviewDragged
): PreviewResult {
  const result: PreviewResult = new Map();
  // The dragged Work Item always lands at the requested dates (move-only; PROP-18).
  result.set(dragged.id, {
    start_date: dragged.requested_start_date,
    target_date: dragged.requested_target_date,
  });

  // Compute delta in calendar days from original_start to requested_start.
  const deltaDays = findTotalDaysInRange(dragged.original_start_date, dragged.requested_start_date, false);
  if (deltaDays === undefined || deltaDays === 0) {
    return result;
  }

  // Walk loaded adjacency in the direction of the drag (BFS through the loaded
  // subset; chain propagation arises naturally because each successor whose new
  // dates we just computed is re-enqueued).
  const queue: string[] = [dragged.id];
  const visited = new Set<string>([dragged.id]);

  while (queue.length > 0) {
    const currentId = queue.shift() as string;
    const currentNew = result.get(currentId);
    if (!currentNew) continue;

    if (deltaDays > 0) {
      // Rightward — walk successors. New start_date floor is currentNew.target_date + 1.
      for (const edge of edges) {
        if (edge.predecessor_id !== currentId) continue;
        const succ = items_by_id[edge.successor_id];
        if (!succ) continue; // incomplete loaded data — server is authoritative.

        // Compute the most-restrictive successor start across ALL loaded predecessors.
        const candidateStart = _resolveSuccessorStart(succ, edges, items_by_id, result);
        if (!candidateStart) continue;

        // No violation? leave the successor alone (gap preservation, PROP-07).
        if (succ.start_date >= candidateStart) continue;

        const duration = findTotalDaysInRange(succ.start_date, succ.target_date, false);
        if (duration === undefined) continue;
        const newTarget = addDaysToDate(candidateStart, duration);
        const newTargetStr = renderFormattedPayloadDate(newTarget);
        if (!newTargetStr) continue;

        result.set(succ.id, { start_date: candidateStart, target_date: newTargetStr });
        if (!visited.has(succ.id)) {
          visited.add(succ.id);
          queue.push(succ.id);
        }
      }
    } else {
      // Leftward — walk predecessors. New target_date ceiling is currentNew.start_date - 1.
      for (const edge of edges) {
        if (edge.successor_id !== currentId) continue;
        const pred = items_by_id[edge.predecessor_id];
        if (!pred) continue;

        const candidateTargetDate = addDaysToDate(currentNew.start_date, -1);
        const candidateTargetStr = renderFormattedPayloadDate(candidateTargetDate);
        if (!candidateTargetStr) continue;

        // No violation? leave it alone.
        if (pred.target_date <= candidateTargetStr) continue;

        const duration = findTotalDaysInRange(pred.start_date, pred.target_date, false);
        if (duration === undefined) continue;
        const newStartDate = addDaysToDate(candidateTargetStr, -duration);
        const newStartStr = renderFormattedPayloadDate(newStartDate);
        if (!newStartStr) continue;

        result.set(pred.id, { start_date: newStartStr, target_date: candidateTargetStr });
        if (!visited.has(pred.id)) {
          visited.add(pred.id);
          queue.push(pred.id);
        }
      }
    }
  }

  return result;
}

/**
 * Internal: for a successor, look at ALL its loaded predecessors and return
 * the most-restrictive start_date (max of `predecessor.new_target + 1`). Uses
 * the already-computed values in `result` for predecessors that have been
 * moved; falls back to the loaded current `target_date` for predecessors that
 * haven't.
 */
function _resolveSuccessorStart(
  succ: LoadedWorkItem,
  edges: readonly LoadedGraphEdge[],
  items_by_id: Readonly<Record<string, LoadedWorkItem>>,
  result: PreviewResult
): string | null {
  let maxStart: string | null = null;
  for (const edge of edges) {
    if (edge.successor_id !== succ.id) continue;
    const pred = items_by_id[edge.predecessor_id];
    if (!pred) continue;
    const predNew = result.get(pred.id);
    const predTarget = predNew ? predNew.target_date : pred.target_date;
    const candidate = renderFormattedPayloadDate(addDaysToDate(predTarget, 1));
    if (!candidate) continue;
    if (maxStart === null || candidate > maxStart) maxStart = candidate;
  }
  return maxStart;
}

/**
 * Hidden-update count (FE-06 / TEST-22). Counts server-included Work Items
 * NOT present in the loaded preview — i.e., propagated rows the UI doesn't
 * yet have loaded. Phase 5 renders this as "N additional work items updated".
 */
export function diffHiddenUpdate(
  server_work_items: readonly TTimelinePropagationWorkItem[],
  preview_ids: ReadonlySet<string>
): number {
  let hidden = 0;
  for (const wi of server_work_items) {
    if (!preview_ids.has(wi.id)) hidden += 1;
  }
  return hidden;
}

/**
 * Pure projection (FE-04 / TEST-21). Replaces `start_date` / `target_date` /
 * `updated_at` on every existing row in `current` whose id appears in
 * `server_work_items`; rows the map doesn't already contain are intentionally
 * NOT inserted (hidden-update surfaces via {@link diffHiddenUpdate}, not via
 * this projection). Returns a new object — never mutates inputs (D-04c).
 */
export function applyServerWorkItems<
  T extends { id: string; start_date?: string | null; target_date?: string | null; updated_at?: string },
>(current: Readonly<Record<string, T>>, server_work_items: readonly TTimelinePropagationWorkItem[]): Record<string, T> {
  const next: Record<string, T> = { ...current };
  for (const wi of server_work_items) {
    const existing = next[wi.id];
    if (!existing) continue;
    next[wi.id] = {
      ...existing,
      start_date: wi.start_date,
      target_date: wi.target_date,
      updated_at: wi.updated_at,
    };
  }
  return next;
}
