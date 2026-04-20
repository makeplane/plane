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

// plane imports
import type {
  PermissionActionForResource,
  PermissionCondition,
  PermissionResource,
  PermissionString,
} from "@plane/types";
import { PERMISSION_CONDITIONS_BY_PERMISSION } from "@plane/types";
// local imports
import type {
  PermissionEntry,
  PermissionMatrixGroup,
  PermissionMatrixRow,
  PermissionNamespaceForManagement,
} from "./matrix-types";

// --- Condition label helpers ---

const CONDITION_SENTENCE_LABEL_OVERRIDES: Partial<Record<PermissionCondition, string>> = {
  creator: "the creator",
  lead: "the lead",
};

export const getConditionSentenceLabel = (condition: PermissionCondition): string => {
  const overriddenLabel = CONDITION_SENTENCE_LABEL_OVERRIDES[condition];
  if (overriddenLabel) return overriddenLabel;
  return `the ${condition.toLowerCase()}`;
};

// Returns "" for no condition, or "when user is the lead" for a single condition (view-mode display)
export const getConditionClauseLabel = (conditions: readonly PermissionCondition[]): string => {
  if (conditions.length === 0) return "";
  return `when user is ${getConditionSentenceLabel(conditions[0])}`;
};

// Returns a capitalized short label for a condition — e.g. "creator" → "Creator", "lead" → "Lead"
export const getPermissionConditionLabel = (condition: PermissionCondition): string =>
  condition.charAt(0).toUpperCase() + condition.slice(1);

// --- Builder ---

/**
 * Builds a sorted array of `PermissionMatrixGroup` from a namespace-scoped group map.
 *
 * Each namespace file (workspace, project) calls this once. The group map is the single source
 * of truth: group metadata, resource membership, and per-permission data are all co-located.
 *
 * Render order = Record key insertion order (no separate ACTION_ORDER constant needed).
 * Feature flag / access checks belong in `usePermissionGroupAccess` in the web app.
 */
export const buildPermissionGroups = (
  namespace: PermissionNamespaceForManagement,
  groups: Readonly<
    Record<
      string,
      {
        titleKey: string;
        descriptionKey: string;
        order: number;
        resources: Partial<Record<string, Partial<Record<string, PermissionEntry>> | undefined>>;
      }
    >
  >
): PermissionMatrixGroup[] => {
  // --- Pass 1: Build all rows + collect folding metadata ---
  const foldedUnderByRowId = new Map<PermissionString, PermissionString>();
  const foldTooltipKeyByRowId = new Map<PermissionString, string>();

  const allGroups = Object.entries(groups)
    .sort(([, a], [, b]) => a.order - b.order)
    .map(([groupKey, group]) => {
      const rows: PermissionMatrixRow[] = [];

      for (const [resource, perms] of Object.entries(group.resources)) {
        if (!perms) continue;
        for (const [action, entry] of Object.entries(perms)) {
          if (!entry) continue;
          const rowId = `${resource}:${action}` as PermissionString;
          const conditions =
            (PERMISSION_CONDITIONS_BY_PERMISSION as Partial<Record<PermissionString, readonly PermissionCondition[]>>)[
              rowId
            ]?.slice() ?? [];

          // Track folding metadata
          if (entry.foldedUnder) {
            foldedUnderByRowId.set(rowId, entry.foldedUnder);
          }
          if (entry.foldTooltipKey) {
            foldTooltipKeyByRowId.set(rowId, entry.foldTooltipKey);
          }

          rows.push({
            rowId,
            namespace,
            groupKey,
            resource: resource as PermissionResource,
            action: action as PermissionActionForResource<PermissionResource>,
            labelKey: entry.labelKey,
            prerequisites: entry.prerequisites,
            conditions,
          } satisfies PermissionMatrixRow);
        }
      }

      return {
        key: groupKey,
        titleKey: group.titleKey,
        descriptionKey: group.descriptionKey,
        namespace,
        order: group.order,
        rows,
      } satisfies PermissionMatrixGroup;
    })
    .filter((group) => group.rows.length > 0);

  // --- Pass 2: Process folding ---
  if (foldedUnderByRowId.size === 0) return allGroups;

  // Build a set of all row IDs for validation
  const allRowIds = new Set<PermissionString>();
  const rowByRowId = new Map<PermissionString, PermissionMatrixRow>();
  for (const group of allGroups) {
    for (const row of group.rows) {
      allRowIds.add(row.rowId);
      rowByRowId.set(row.rowId, row);
    }
  }

  // Collect children per parent
  const childrenByParent = new Map<PermissionString, PermissionString[]>();
  for (const [childId, parentId] of foldedUnderByRowId) {
    // Validate: parent must exist
    if (!allRowIds.has(parentId)) {
      throw new Error(
        `Permission folding: "${childId}" declares foldedUnder "${parentId}", but "${parentId}" does not exist.`
      );
    }
    // Validate: parent must not itself be folded
    if (foldedUnderByRowId.has(parentId)) {
      throw new Error(
        `Permission folding: "${parentId}" is used as a fold parent but itself has foldedUnder. A fold parent cannot be folded.`
      );
    }

    const children = childrenByParent.get(parentId) ?? [];
    children.push(childId);
    childrenByParent.set(parentId, children);
  }

  // Annotate parent rows with foldedChildren (includes self) and foldTooltipKey
  for (const [parentId, children] of childrenByParent) {
    const parentRow = rowByRowId.get(parentId);
    if (!parentRow) continue;
    parentRow.foldedChildren = [parentId, ...children];
    const tooltipKey = foldTooltipKeyByRowId.get(parentId);
    if (tooltipKey) {
      parentRow.foldTooltipKey = tooltipKey;
    }
  }

  // Filter out folded children and remove empty groups
  return allGroups
    .map((group) => ({
      ...group,
      rows: group.rows.filter((row) => !foldedUnderByRowId.has(row.rowId)),
    }))
    .filter((group) => group.rows.length > 0);
};
