/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * Copyright (c) 2026-present Okręgowa Spółdzielnia Mleczarska w Piątnicy
 * SPDX-License-Identifier: AGPL-3.0-only
 * Modified by Okręgowa Spółdzielnia Mleczarska w Piątnicy in 2026.
 * See the LICENSE file for details.
 */

import type { IGanttBlock, TIssueRelationTypes } from "@plane/types";
import type { TTimelineRelationType, TWorkItemTimelineDates } from "@plane/utils";
import { TIMELINE_RELATION_TYPES, isTimelineRelationSatisfied } from "@plane/utils";

export type TGanttDependencyEdge = {
  id: string;
  sourceId: string;
  targetId: string;
  relationType: TTimelineRelationType;
  isInvalid: boolean;
};

type TIssueDates = TWorkItemTimelineDates;

type TRelationMap = Record<string, Partial<Record<TIssueRelationTypes, string[]>> | undefined>;

export const isDependencyRelationInvalid = (
  relationType: TTimelineRelationType,
  sourceDates: TIssueDates,
  relatedDates: TIssueDates
): boolean => !isTimelineRelationSatisfied(relationType, sourceDates, relatedDates);

export const getDependencyArrowEndpoints = (
  relationType: TIssueRelationTypes,
  sourceId: string,
  relatedId: string
): { fromId: string; toId: string } => {
  switch (relationType) {
    case "blocked_by":
    case "finish_after":
    case "start_after":
      return { fromId: relatedId, toId: sourceId };
    case "blocking":
    case "finish_before":
    case "start_before":
    default:
      return { fromId: sourceId, toId: relatedId };
  }
};

export const buildGanttDependencyEdges = (
  blockIds: string[],
  relationMap: TRelationMap,
  getDates: (issueId: string) => TIssueDates | undefined
): TGanttDependencyEdge[] => {
  const visible = new Set(blockIds);
  const edges: TGanttDependencyEdge[] = [];
  const seen = new Set<string>();

  for (const sourceId of blockIds) {
    const relations = relationMap[sourceId];
    if (!relations) continue;

    for (const relationType of TIMELINE_RELATION_TYPES) {
      const relatedIds = relations[relationType] ?? [];
      for (const relatedId of relatedIds) {
        if (!visible.has(relatedId)) continue;
        const { fromId, toId } = getDependencyArrowEndpoints(relationType, sourceId, relatedId);
        const edgeKey = `${fromId}->${toId}:${relationType}`;
        if (seen.has(edgeKey)) continue;
        seen.add(edgeKey);

        const sourceDates = getDates(sourceId);
        const relatedDates = getDates(relatedId);
        const isInvalid =
          !!sourceDates && !!relatedDates && isDependencyRelationInvalid(relationType, sourceDates, relatedDates);

        edges.push({
          id: edgeKey,
          sourceId: fromId,
          targetId: toId,
          relationType,
          isInvalid,
        });
      }
    }
  }

  return edges;
};

export const wouldUpdatesViolateDependencies = (
  updates: { id: string; start_date?: string; target_date?: string }[],
  relationMap: TRelationMap,
  getDates: (issueId: string) => TIssueDates | undefined
): boolean => {
  const proposed = new Map<string, TIssueDates>();
  for (const update of updates) {
    const current = getDates(update.id) ?? {};
    proposed.set(update.id, {
      start_date: update.start_date ?? current.start_date,
      target_date: update.target_date ?? current.target_date,
    });
  }

  const getMergedDates = (issueId: string) => proposed.get(issueId) ?? getDates(issueId);

  for (const update of updates) {
    const relations = relationMap[update.id];
    if (!relations) continue;
    const sourceDates = getMergedDates(update.id);
    if (!sourceDates) continue;

    for (const relationType of TIMELINE_RELATION_TYPES) {
      for (const relatedId of relations[relationType] ?? []) {
        const relatedDates = getMergedDates(relatedId);
        if (!relatedDates) continue;
        if (isDependencyRelationInvalid(relationType, sourceDates, relatedDates)) {
          return true;
        }
      }
    }

    for (const [otherId, otherRelations] of Object.entries(relationMap)) {
      if (!otherRelations || otherId === update.id) continue;
      for (const relationType of TIMELINE_RELATION_TYPES) {
        if (!(otherRelations[relationType] ?? []).includes(update.id)) continue;
        const otherDates = getMergedDates(otherId);
        const thisDates = getMergedDates(update.id);
        if (!otherDates || !thisDates) continue;
        if (isDependencyRelationInvalid(relationType, otherDates, thisDates)) {
          return true;
        }
      }
    }
  }

  return false;
};

export const getBlockAnchorPoints = (
  block: IGanttBlock,
  blockIndex: number,
  blockHeight: number
): { left: { x: number; y: number }; right: { x: number; y: number } } | null => {
  if (!block.position) return null;
  const y = blockIndex * blockHeight + blockHeight / 2;
  return {
    left: { x: block.position.marginLeft, y },
    right: { x: block.position.marginLeft + block.position.width, y },
  };
};

export const buildDependencyPathD = (fromX: number, fromY: number, toX: number, toY: number): string => {
  const deltaX = Math.max(Math.abs(toX - fromX) * 0.4, 24);
  const c1x = fromX + deltaX;
  const c2x = toX - deltaX;
  return `M ${fromX} ${fromY} C ${c1x} ${fromY}, ${c2x} ${toY}, ${toX} ${toY}`;
};
