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
