/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { TExternalLink } from "./external-links";

export type TDependencyType = "FS" | "SS" | "FF" | "SF";
export const DEPENDENCY_TYPES: TDependencyType[] = ["FS", "SS", "FF", "SF"];
export const dependencyTypeLabels: Record<TDependencyType, string> = {
  FS: "Kết thúc → bắt đầu (FS)",
  SS: "Bắt đầu → bắt đầu (SS)",
  FF: "Kết thúc → kết thúc (FF)",
  SF: "Bắt đầu → kết thúc (SF)",
};

export type TGanttDependency = {
  predecessorId: string;
  successorId: string;
  lagDays?: number;
  depType?: TDependencyType;
};

export type TGanttDependencyActions = {
  otherPairs: string[];
  removeExternal?: (link: TExternalLink) => Promise<void>;
  createExternal?: (
    localId: string,
    side: "left" | "right",
    externalIssueId: string,
    externalProjectId: string
  ) => Promise<void>;
  setExternalLag?: (link: TExternalLink, lagDays: number) => Promise<void>;
  setExternalDepType?: (link: TExternalLink, depType: TDependencyType) => Promise<void>;
  setLag?: (predecessorId: string, successorId: string, lagDays: number) => Promise<void>;
  setDepType?: (predecessorId: string, successorId: string, depType: TDependencyType) => Promise<void>;
  lagsSupported?: boolean;
  create: (predecessorId: string, successorId: string) => Promise<void>;
  remove: (predecessorId: string, successorId: string) => Promise<void>;
};

type Relation = { id: string; project_id: string; relation_type: string };
type Issue = { id: string; issue_relation?: Relation[]; issue_related?: Relation[] };

export function extractGanttRelations(issues: Issue[], projectId: string) {
  const otherPairs = new Set<string>();
  for (const issue of issues) {
    for (const relation of [...(issue.issue_relation ?? []), ...(issue.issue_related ?? [])]) {
      if (relation.project_id !== projectId || relation.id === issue.id) continue;
      if (relation.relation_type !== "blocked_by" && relation.relation_type !== "blocking")
        otherPairs.add([issue.id, relation.id].sort().join("|"));
    }
  }
  return { dependencies: extractBlockedByDependencies(issues, projectId), otherPairs: [...otherPairs] };
}

export const dependencyValidationMessages = {
  self: "Không thể nối một việc với chính nó",
  duplicate: "Hai việc này đã được nối",
  occupied: "Hai việc đã có quan hệ khác (liên quan/trùng lặp) — xoá quan hệ đó trước",
  cycle: "Nối như vậy sẽ tạo vòng lặp phụ thuộc",
};

export function validateNewDependency(
  dependencies: TGanttDependency[],
  otherPairs: string[],
  predecessorId: string,
  successorId: string
): keyof typeof dependencyValidationMessages | null {
  if (predecessorId === successorId) return "self";
  if (dependencies.some((dep) => dep.predecessorId === predecessorId && dep.successorId === successorId))
    return "duplicate";
  if (otherPairs.includes([predecessorId, successorId].sort().join("|"))) return "occupied";
  const outgoing = new Map<string, string[]>();
  for (const dep of dependencies) {
    const successors = outgoing.get(dep.predecessorId) ?? [];
    successors.push(dep.successorId);
    outgoing.set(dep.predecessorId, successors);
  }
  const pending = [successorId];
  const visited = new Set<string>();
  while (pending.length) {
    const id = pending.pop()!;
    if (id === predecessorId) return "cycle";
    if (visited.has(id)) continue;
    visited.add(id);
    pending.push(...(outgoing.get(id) ?? []));
  }
  return null;
}

export function getDependencyDraftStates(
  dependencies: TGanttDependency[],
  otherPairs: string[],
  sourceId: string,
  side: "right" | "left",
  candidateIds: string[]
): Record<string, keyof typeof dependencyValidationMessages | null> {
  const adjacent = new Map<string, string[]>();
  const duplicates = new Set<string>();
  for (const { predecessorId, successorId } of dependencies) {
    const [from, to] = side === "right" ? [successorId, predecessorId] : [predecessorId, successorId];
    const neighbors = adjacent.get(from) ?? [];
    neighbors.push(to);
    adjacent.set(from, neighbors);
    if (to === sourceId) duplicates.add(from);
  }
  const reachable = new Set<string>();
  const pending = [sourceId];
  while (pending.length) {
    const id = pending.pop()!;
    if (reachable.has(id)) continue;
    reachable.add(id);
    for (const neighbor of adjacent.get(id) ?? []) pending.push(neighbor);
  }
  const occupied = new Set(otherPairs);
  return Object.fromEntries(
    candidateIds.map((id) => [
      id,
      id === sourceId
        ? "self"
        : duplicates.has(id)
          ? "duplicate"
          : occupied.has([sourceId, id].sort().join("|"))
            ? "occupied"
            : reachable.has(id)
              ? "cycle"
              : null,
    ])
  );
}

export function extractBlockedByDependencies(
  issues: { id: string; issue_relation?: { id: string; project_id: string; relation_type: string }[] }[],
  projectId: string
): TGanttDependency[] {
  const dependencies: TGanttDependency[] = [];
  const seen = new Set<string>();
  for (const issue of issues) {
    for (const relation of issue.issue_relation ?? []) {
      if (relation.relation_type !== "blocked_by" || relation.project_id !== projectId || relation.id === issue.id)
        continue;
      const key = JSON.stringify([relation.id, issue.id]);
      if (seen.has(key)) continue;
      seen.add(key);
      dependencies.push({ predecessorId: relation.id, successorId: issue.id });
    }
  }
  return dependencies;
}

export function isDependencyViolated(
  predTargetDate: string | null | undefined,
  succStartDate: string | null | undefined
): boolean {
  return !!predTargetDate && !!succStartDate && succStartDate <= predTargetDate;
}

type TDates = { start?: string | null; end?: string | null };

// Lag is not part of the check (same as the FS rule): only the plain order of the two dates.
export function isTypedDependencyViolated(type: TDependencyType | undefined, pred: TDates, succ: TDates): boolean {
  switch (type) {
    case "SS":
      return !!pred.start && !!succ.start && succ.start < pred.start;
    case "FF":
      return !!pred.end && !!succ.end && succ.end < pred.end;
    case "SF":
      return !!pred.start && !!succ.end && succ.end < pred.start;
    default:
      return isDependencyViolated(pred.end, succ.start);
  }
}

const round = (value: number) => Math.round(value * 10) / 10;

// lane > 0 moves the bends sideways/vertically so arrows that would share a segment stay apart.
const MIDY_LANE_OFFSETS = [0, 3, -3];
export function getDependencyPath(
  from: { x: number; y: number },
  to: { x: number; y: number },
  rowHeight: number,
  lane = 0,
  type: TDependencyType = "FS"
): string {
  const start = `M ${round(from.x)} ${round(from.y)}`;
  const shift = lane * 3;
  // SS leaves and enters on the left edges, FF on the right edges: one bracket-shaped run beside both bars.
  if (type === "SS") {
    const x = Math.min(from.x, to.x) - 8 - shift;
    return `${start} H ${round(x)} V ${round(to.y)} H ${round(to.x)}`;
  }
  if (type === "FF") {
    const x = Math.max(from.x, to.x) + 8 + shift;
    return `${start} H ${round(x)} V ${round(to.y)} H ${round(to.x)}`;
  }
  if (type === "SF") {
    const mid = (to.y > from.y ? to.y - rowHeight / 2 : to.y + rowHeight / 2) + (MIDY_LANE_OFFSETS[lane] ?? 0);
    return `${start} H ${round(from.x - 8 - shift)} V ${round(mid)} H ${round(to.x + 8 + shift)} V ${round(to.y)} H ${round(to.x)}`;
  }
  if (to.x - from.x >= 16) {
    if (from.y === to.y) return `${start} H ${round(to.x)}`;
    return `${start} H ${round(from.x + 8 + shift)} V ${round(to.y)} H ${round(to.x)}`;
  }
  const midY = (to.y > from.y ? to.y - rowHeight / 2 : to.y + rowHeight / 2) + (MIDY_LANE_OFFSETS[lane] ?? 0);
  return `${start} H ${round(from.x + 8 + shift)} V ${round(midY)} H ${round(to.x - 8 - shift)} V ${round(to.y)} H ${round(to.x)}`;
}
