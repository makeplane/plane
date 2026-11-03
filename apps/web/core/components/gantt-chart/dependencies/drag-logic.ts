/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { TGanttDependency, dependencyValidationMessages } from "./dependency-utils";
// @ts-expect-error TS5097: Node's type-stripping test runner needs the .ts extension.
import { getDependencyPath, isDependencyViolated, validateNewDependency } from "./dependency-utils.ts";

type DropInput = {
  side: "left" | "right";
  fromId: string;
  targetId: string | null;
  rowIds: Set<string>;
  dependencies: TGanttDependency[];
  otherPairs: string[];
  canCreateExternal: boolean;
  overEmptyArea: boolean;
};

type DropResult =
  | { kind: "create"; predecessorId: string; successorId: string }
  | { kind: "error"; error: keyof typeof dependencyValidationMessages }
  | { kind: "external-picker" }
  | { kind: "none" };

export function resolveDrop(input: DropInput): DropResult {
  const { side, fromId, targetId, rowIds, dependencies, otherPairs, canCreateExternal, overEmptyArea } = input;
  if (targetId && rowIds.has(targetId)) {
    const [predecessorId, successorId] = side === "right" ? [fromId, targetId] : [targetId, fromId];
    const error = validateNewDependency(dependencies, otherPairs, predecessorId, successorId);
    return error ? { kind: "error", error } : { kind: "create", predecessorId, successorId };
  }
  return !targetId && overEmptyArea && canCreateExternal ? { kind: "external-picker" } : { kind: "none" };
}

type Row = {
  y: number;
  block: {
    position?: { marginLeft: number; width: number } | null;
    start_date?: string | null;
    target_date?: string | null;
  };
};

export function buildArrows(rows: Map<string, Row>, dependencies: TGanttDependency[], blockHeight: number) {
  const arrows: (TGanttDependency & { path: string; violated: boolean })[] = [];
  // Different predecessors ending at the same x would draw their first bend on top of each other:
  // give each its own lane (same predecessor fanning out to several successors shares one on purpose).
  const lanes = new Map<number, Map<string, number>>();
  for (const { predecessorId, successorId, lagDays } of dependencies) {
    const pred = rows.get(predecessorId);
    const succ = rows.get(successorId);
    if (!pred?.block.position || !succ?.block.position) continue;
    const fromX = pred.block.position.marginLeft + pred.block.position.width;
    const byPred = lanes.get(fromX) ?? new Map<string, number>();
    lanes.set(fromX, byPred);
    if (!byPred.has(predecessorId)) byPred.set(predecessorId, byPred.size);
    arrows.push({
      predecessorId,
      successorId,
      lagDays,
      path: getDependencyPath(
        { x: fromX, y: pred.y },
        { x: succ.block.position.marginLeft, y: succ.y },
        blockHeight,
        Math.min(byPred.get(predecessorId)!, 2)
      ),
      violated: isDependencyViolated(pred.block.target_date, succ.block.start_date),
    });
  }
  return arrows;
}
