/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { REVERSE_RELATIONS } from "@plane/constants";
import type { TIssueRelationMap, TIssueRelationTypes } from "@plane/types";

/**
 * Hard cap on DFS depth. Keeps the cycle walk bounded even if the store is
 * corrupted, and well within what a human gantt plan can realistically have.
 */
export const CYCLE_CHECK_MAX_DEPTH = 20;

/**
 * Local cycle check for the gantt dependency drag.
 *
 * Treats `blocking` / `blocked_by` as two directions of the same precedence
 * edge and does a bounded DFS in the precedence direction from `targetId`
 * looking for `sourceId`.
 *
 * IMPORTANT scope note: this only sees issues currently loaded in
 * `relationMap`. The gantt is paginated, so any cycle that routes through an
 * unloaded issue is invisible here. Server-side validation is the source of
 * truth; this function exists to give instant feedback for the common case.
 *
 * Arguments are ordered the same way the relation is stored: adding
 * `sourceId "blocking" targetId` means "source precedes target", and this
 * returns `true` if that edge would close a precedence cycle.
 */
export function wouldCreateCycle(
  relationMap: TIssueRelationMap,
  sourceId: string,
  targetId: string,
  maxDepth: number = CYCLE_CHECK_MAX_DEPTH
): boolean {
  // Self-reference is a trivial 0-length cycle.
  if (sourceId === targetId) return true;

  const visited = new Set<string>();
  const stack: Array<{ id: string; depth: number }> = [{ id: targetId, depth: 0 }];

  while (stack.length > 0) {
    const { id, depth } = stack.pop()!;
    if (visited.has(id)) continue;
    visited.add(id);

    if (depth >= maxDepth) continue;

    // Follow precedence forward: "things that must come after `id`".
    const successors = relationMap[id]?.blocking ?? [];
    for (const nextId of successors) {
      if (nextId === sourceId) return true;
      if (!visited.has(nextId)) stack.push({ id: nextId, depth: depth + 1 });
    }
  }

  return false;
}

/**
 * True if an equivalent relation (canonicalised over
 * `blocking` / `blocked_by` etc.) already exists between the two issues.
 *
 * Checks both the stored direction and the `REVERSE_RELATIONS` mirror so that
 * `{A blocking B}` is recognised as equivalent to `{B blocked_by A}`.
 */
export function relationAlreadyExists(
  relationMap: TIssueRelationMap,
  sourceId: string,
  relationType: TIssueRelationTypes,
  targetId: string
): boolean {
  const forward = relationMap[sourceId]?.[relationType] ?? [];
  if (forward.includes(targetId)) return true;

  const reverseType = REVERSE_RELATIONS[relationType];
  const reverse = relationMap[targetId]?.[reverseType] ?? [];
  return reverse.includes(sourceId);
}
