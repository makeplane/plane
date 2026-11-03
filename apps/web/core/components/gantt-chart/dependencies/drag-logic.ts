/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { TGanttDependency, dependencyValidationMessages } from "./dependency-utils";
// @ts-expect-error TS5097: Node's type-stripping test runner needs the .ts extension.
import { getDependencyPath, isTypedDependencyViolated, validateNewDependency } from "./dependency-utils.ts";

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
  const arrows: (TGanttDependency & { path: string; violated: boolean; fromX: number; toX: number })[] = [];
  // Different predecessors ending at the same x would draw their first bend on top of each other:
  // give each its own lane (same predecessor fanning out to several successors shares one on purpose).
  const lanes = new Map<number, Map<string, number>>();
  for (const { predecessorId, successorId, lagDays, depType } of dependencies) {
    const pred = rows.get(predecessorId);
    const succ = rows.get(successorId);
    if (!pred?.block.position || !succ?.block.position) continue;
    const type = depType ?? "FS";
    // FS/FF leave the predecessor's end, SS/SF its start; FS/SS enter the successor's start, FF/SF its end.
    const fromX = pred.block.position.marginLeft + (type === "FS" || type === "FF" ? pred.block.position.width : 0);
    const toX = succ.block.position.marginLeft + (type === "FF" || type === "SF" ? succ.block.position.width : 0);
    const byPred = lanes.get(fromX) ?? new Map<string, number>();
    lanes.set(fromX, byPred);
    if (!byPred.has(predecessorId)) byPred.set(predecessorId, byPred.size);
    arrows.push({
      predecessorId,
      successorId,
      lagDays,
      ...(depType ? { depType } : {}),
      fromX,
      toX,
      path: getDependencyPath(
        { x: fromX, y: pred.y },
        { x: toX, y: succ.y },
        blockHeight,
        Math.min(byPred.get(predecessorId)!, 2),
        type
      ),
      violated: isTypedDependencyViolated(
        type,
        { start: pred.block.start_date, end: pred.block.target_date },
        { start: succ.block.start_date, end: succ.block.target_date }
      ),
    });
  }
  return arrows;
}
