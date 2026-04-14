/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import type { IIssueFilters, IWorkflow } from "@plane/types";
import type { ASTNode } from "@plane/editor";
import { FIELD_ALIASES, parsePQL, tokenizePQL } from "@plane/editor";
import { EIssuesStoreType } from "@plane/types";
import { toInternalWorkItemFilterExpression } from "@plane/shared-state";
import { evaluateSetExpr } from "./set-expr-eval";
import { pqlAstToSetExpr } from "./pql-ast-to-set-expr";
import { richFiltersToSetExpr } from "./rich-filters-to-set-expr";
import { createStateIdResolver } from "./state-allowlist-resolvers";

const PROJECT_SCOPED_STORE_TYPES = new Set<EIssuesStoreType>([
  EIssuesStoreType.PROJECT,
  EIssuesStoreType.PROJECT_VIEW,
  EIssuesStoreType.MODULE,
  EIssuesStoreType.CYCLE,
]);

const parsePqlAst = (text: string): ASTNode | null => {
  const fieldValues = new Set(Object.values(FIELD_ALIASES));
  const tokens = tokenizePQL(text, fieldValues);
  const parsed = parsePQL(tokens);
  return parsed.ast ?? null;
};

export const computeStateIdAllowlist = (args: {
  issueFilters: IIssueFilters | undefined;
  projectId: string | undefined;
  storeType: EIssuesStoreType;
  getProjectStateIds: (projectId: string) => string[] | undefined;
  getStateById: (stateId: string | null | undefined) => { group: string } | undefined;
  getWorkflowById: (workflowId: string) => IWorkflow | undefined;
}): Set<string> | undefined => {
  const { issueFilters, projectId, storeType, getProjectStateIds, getStateById, getWorkflowById } = args;

  if (!issueFilters) return undefined;
  if (!projectId) return undefined;
  if (!PROJECT_SCOPED_STORE_TYPES.has(storeType)) return undefined;

  const universeIds = getProjectStateIds(projectId) ?? [];
  if (universeIds.length === 0) return undefined;
  const universe = new Set(universeIds);

  const stateIdsByGroup = new Map<string, Set<string>>();
  for (const stateId of universeIds) {
    const state = getStateById(stateId);
    const groupKey = state?.group;
    if (!groupKey) continue;
    const bucket = stateIdsByGroup.get(groupKey) ?? new Set<string>();
    bucket.add(stateId);
    stateIdsByGroup.set(groupKey, bucket);
  }

  let setExpr;
  if (issueFilters.lastUsedFilterType === "rich_filters") {
    const internal = toInternalWorkItemFilterExpression(issueFilters.richFilters);
    if (!internal) return undefined;
    setExpr = richFiltersToSetExpr(internal);
  } else if (issueFilters.lastUsedFilterType === "pql_filters") {
    const text = issueFilters.pqlFilters?.stripped ?? "";
    if (!text.trim()) return undefined;
    const ast = parsePqlAst(text);
    setExpr = pqlAstToSetExpr(ast);
  } else {
    return undefined;
  }

  const resolveCond = createStateIdResolver({ getWorkflowById, stateIdsByGroup });
  const result = evaluateSetExpr(setExpr, universe, resolveCond);

  // Per spec: empty allowlist => show all columns.
  if (result.size === 0) return undefined;
  if (result.size === universe.size) return undefined;
  return result;
};
