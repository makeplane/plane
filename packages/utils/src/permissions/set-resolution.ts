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

import type { PermissionMatrixGroup, PermissionMatrixRow } from "@plane/constants";
import type {
  PermissionCondition,
  PermissionGrantString,
  PermissionString,
  PermissionMatrixState,
  PermissionSelection,
} from "@plane/types";
import { parsePermissionGrantString } from "./string";

type ConditionKey = string;

const GLOBAL_WILDCARD = "*" as PermissionGrantString;

const getRows = (groups: PermissionMatrixGroup[]): PermissionMatrixRow[] => groups.flatMap((group) => group.rows);

const getSelectionKey = (selection: PermissionSelection): string => {
  if (selection.mode === "disabled") return "disabled";
  if (selection.mode === "all") return "all";
  return `conditional:${selection.conditions.join("+")}`;
};

const uniqueConditions = (conditions: readonly PermissionCondition[]): PermissionCondition[] => {
  const set = new Set<PermissionCondition>(conditions);
  return [...set].sort((a, b) => a.localeCompare(b));
};

export const buildConditionalGrant = (
  basePermission: PermissionString,
  conditions: readonly PermissionCondition[]
): PermissionGrantString => {
  const resolved = uniqueConditions(conditions);
  if (resolved.length === 0) return basePermission;
  return `${basePermission}+${resolved.join("+")}` as PermissionGrantString;
};

const toRowConditionKey = (
  row: PermissionMatrixRow,
  conditions: readonly PermissionCondition[]
): ConditionKey | null => {
  const allowed = new Set<PermissionCondition>(row.conditions);
  const filtered = uniqueConditions(conditions).filter((condition) => allowed.has(condition));
  if (filtered.length === 0) return null;
  return filtered.join("+");
};

const fromRowConditionKey = (conditionKey: ConditionKey): PermissionCondition[] => {
  if (!conditionKey) return [];
  return conditionKey.split("+") as PermissionCondition[];
};

/**
 * Canonicalizes a conditional grant so condition token order is deterministic.
 * Example: "workitem:edit+lead+creator" -> "workitem:edit+creator+lead".
 */
export const canonicalizeConditionalGrant = (grant: PermissionGrantString): PermissionGrantString => {
  const parsed = parsePermissionGrantString(grant);
  if (!parsed || parsed.conditions.length <= 1) return grant;

  const base = `${parsed.resource}:${parsed.action}` as PermissionString;
  return buildConditionalGrant(base, parsed.conditions);
};

/**
 * Converts backend grants to matrix row state, including wildcard expansion and
 * canonicalized conditional token matching.
 */
export const permissionsToMatrixState = (
  permissions: Partial<Record<PermissionGrantString, true>>,
  groups: PermissionMatrixGroup[]
): PermissionMatrixState => {
  const rows = getRows(groups);
  const permissionKeys = Object.keys(permissions) as PermissionGrantString[];
  const canonicalPermissions = new Set(permissionKeys.map(canonicalizeConditionalGrant));

  const exactConditionalByBase = new Map<PermissionString, Set<ConditionKey>>();
  const wildcardConditionalByResource = new Map<string, Set<ConditionKey>>();

  for (const permission of canonicalPermissions) {
    const parsed = parsePermissionGrantString(permission);
    if (!parsed || parsed.conditions.length === 0) continue;

    const canonicalConditionKey = uniqueConditions(parsed.conditions).join("+");
    if (!canonicalConditionKey) continue;

    if (parsed.action === "*") {
      const current = wildcardConditionalByResource.get(parsed.resource) ?? new Set<ConditionKey>();
      current.add(canonicalConditionKey);
      wildcardConditionalByResource.set(parsed.resource, current);
      continue;
    }

    const base = `${parsed.resource}:${parsed.action}` as PermissionString;
    const current = exactConditionalByBase.get(base) ?? new Set<ConditionKey>();
    current.add(canonicalConditionKey);
    exactConditionalByBase.set(base, current);
  }

  const state: PermissionMatrixState = {};

  for (const row of rows) {
    const resourceWildcard = `${row.resource}:*` as PermissionGrantString;

    if (
      canonicalPermissions.has(GLOBAL_WILDCARD) ||
      canonicalPermissions.has(resourceWildcard) ||
      canonicalPermissions.has(row.rowId)
    ) {
      state[row.rowId] = { mode: "all" };
      continue;
    }

    const rowVariants = new Set<ConditionKey>();
    const exactVariants = exactConditionalByBase.get(row.rowId);
    if (exactVariants) {
      for (const variant of exactVariants) {
        const rowConditionKey = toRowConditionKey(row, fromRowConditionKey(variant));
        if (rowConditionKey) rowVariants.add(rowConditionKey);
      }
    }

    const wildcardVariants = wildcardConditionalByResource.get(row.resource);
    if (wildcardVariants) {
      for (const variant of wildcardVariants) {
        const rowConditionKey = toRowConditionKey(row, fromRowConditionKey(variant));
        if (rowConditionKey) rowVariants.add(rowConditionKey);
      }
    }

    if (rowVariants.size === 0) {
      state[row.rowId] = { mode: "disabled" };
      continue;
    }

    const bestMatch = [...rowVariants]
      .sort((a, b) => {
        const conditionLengthDiff = b.split("+").length - a.split("+").length;
        if (conditionLengthDiff !== 0) return conditionLengthDiff;
        return a.localeCompare(b);
      })
      .at(0);

    state[row.rowId] = {
      mode: "conditional",
      conditions: fromRowConditionKey(bestMatch ?? ""),
    };
  }

  return state;
};

/**
 * Converts matrix state into backend flat permission grants.
 */
export const matrixStateToPermissions = (
  matrixState: PermissionMatrixState,
  groups: PermissionMatrixGroup[]
): Partial<Record<PermissionGrantString, true>> => {
  const rows = getRows(groups);
  const result: Partial<Record<PermissionGrantString, true>> = {};

  for (const row of rows) {
    const selection = matrixState[row.rowId] ?? { mode: "disabled" };

    if (selection.mode === "disabled") continue;

    if (selection.mode === "all") {
      result[row.rowId] = true;
      continue;
    }

    const conditionKey = toRowConditionKey(row, selection.conditions);
    if (!conditionKey) continue;

    const conditionalGrant = `${row.rowId}+${conditionKey}` as PermissionGrantString;
    result[conditionalGrant] = true;
  }

  return result;
};

export const isMatrixStateEqual = (
  left: PermissionMatrixState,
  right: PermissionMatrixState,
  groups: PermissionMatrixGroup[]
): boolean => {
  const rows = getRows(groups);

  for (const row of rows) {
    const leftSelection = left[row.rowId] ?? { mode: "disabled" };
    const rightSelection = right[row.rowId] ?? { mode: "disabled" };

    if (getSelectionKey(leftSelection) !== getSelectionKey(rightSelection)) return false;
  }

  return true;
};
