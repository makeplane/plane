/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

export type TExternalLink = {
  localId: string;
  direction: "pred" | "succ";
  externalId: string;
  projectId: string;
  sequenceId?: number;
  name?: string;
  startDate?: string | null;
  targetDate?: string | null;
  // Same-project dependency whose other end has no row in the chart (not loaded yet or filtered out).
  peer?: boolean;
};

export type TResolvedExternalLink = TExternalLink & { code?: string };

type Relation = {
  id: string;
  project_id: string;
  relation_type: string;
  sequence_id?: number;
  name?: string;
  start_date?: string | null;
  target_date?: string | null;
};
type Issue = { id: string; issue_relation?: Relation[]; issue_related?: Relation[] };

export function extractExternalLinks(issues: Issue[], projectId: string): TExternalLink[] {
  const links: TExternalLink[] = [];
  const seen = new Set<string>();
  for (const issue of issues) {
    for (const direction of ["pred", "succ"] as const) {
      const relations = direction === "pred" ? issue.issue_relation : issue.issue_related;
      for (const relation of relations ?? []) {
        if (relation.relation_type !== "blocked_by" || relation.project_id === projectId) continue;
        const key = JSON.stringify([issue.id, direction, relation.id]);
        if (seen.has(key)) continue;
        seen.add(key);
        links.push({
          localId: issue.id,
          direction,
          externalId: relation.id,
          projectId: relation.project_id,
          sequenceId: relation.sequence_id,
          name: relation.name,
          startDate: relation.start_date,
          targetDate: relation.target_date,
        });
      }
    }
  }
  return links;
}

type PeerIssue = { name?: string; sequence_id?: number; start_date?: string | null; target_date?: string | null };

// One stub candidate per end of every same-project dependency; the chart keeps the ones whose other end has no row.
export function peerLinksFromDependencies(
  dependencies: { predecessorId: string; successorId: string }[],
  issues: Record<string, PeerIssue | undefined>,
  projectId: string
): TExternalLink[] {
  const link = (localId: string, direction: "pred" | "succ", externalId: string): TExternalLink => {
    const other = issues[externalId];
    return {
      localId,
      direction,
      externalId,
      projectId,
      sequenceId: other?.sequence_id,
      name: other?.name,
      startDate: other?.start_date,
      targetDate: other?.target_date,
      peer: true,
    };
  };
  return dependencies.flatMap(({ predecessorId, successorId }) => [
    link(successorId, "pred", predecessorId),
    link(predecessorId, "succ", successorId),
  ]);
}

// Peer stubs are shown only on the loaded end of a dependency whose other end has no row.
export const visibleLinks = <T extends TExternalLink>(links: T[], rowIds: { has(id: string): boolean }): T[] =>
  links.filter((item) => !item.peer || (rowIds.has(item.localId) && !rowIds.has(item.externalId)));
