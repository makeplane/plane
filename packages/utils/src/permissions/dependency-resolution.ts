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

import type { PermissionMatrixRow } from "@plane/constants";
import type { PermissionString, PermissionMatrixState, PermissionSelection } from "@plane/types";
import { isSelectionEnabled } from "./selection-mapping";

const DISABLED_SELECTION: PermissionSelection = { mode: "disabled" };
const ENABLED_SELECTION: PermissionSelection = { mode: "all" };

const normalizeSelection = (selection: PermissionSelection): PermissionSelection => {
  if (selection.mode !== "conditional") return selection;

  const uniqueConditions = [...new Set(selection.conditions)].sort((a, b) => a.localeCompare(b));
  if (uniqueConditions.length === 0) return DISABLED_SELECTION;

  return {
    mode: "conditional",
    conditions: uniqueConditions,
  };
};

const getRowsById = (rows: PermissionMatrixRow[]): Map<PermissionString, PermissionMatrixRow> =>
  new Map(rows.map((row) => [row.rowId, row]));

const getDependentsByRowId = (rows: PermissionMatrixRow[]): Map<PermissionString, PermissionString[]> => {
  const dependentsByRowId = new Map<PermissionString, PermissionString[]>();

  for (const row of rows) {
    const prerequisites = row.prerequisites ?? [];
    for (const prerequisite of prerequisites) {
      const dependents = dependentsByRowId.get(prerequisite) ?? [];
      dependents.push(row.rowId);
      dependentsByRowId.set(prerequisite, dependents);
    }
  }

  return dependentsByRowId;
};

export const applySelectionWithDependencies = (args: {
  rows: PermissionMatrixRow[];
  currentState: PermissionMatrixState;
  rowId: PermissionString;
  selection: PermissionSelection;
}): PermissionMatrixState => {
  const { rows, currentState, rowId } = args;
  const selection = normalizeSelection(args.selection);
  const rowsById = getRowsById(rows);
  const dependentsByRowId = getDependentsByRowId(rows);

  const nextState: PermissionMatrixState = { ...currentState, [rowId]: selection };

  if (isSelectionEnabled(selection)) {
    const queue: PermissionString[] = [rowId];
    const seen = new Set<PermissionString>();

    while (queue.length > 0) {
      const currentRowId = queue.shift();
      if (!currentRowId || seen.has(currentRowId)) continue;
      seen.add(currentRowId);

      const currentRow = rowsById.get(currentRowId);
      if (!currentRow) continue;

      for (const prerequisite of currentRow.prerequisites ?? []) {
        if (!rowsById.has(prerequisite)) continue;

        const prerequisiteSelection = nextState[prerequisite] ?? DISABLED_SELECTION;
        if (!isSelectionEnabled(prerequisiteSelection)) {
          nextState[prerequisite] = ENABLED_SELECTION;
        }

        queue.push(prerequisite);
      }
    }

    return nextState;
  }

  const queue: PermissionString[] = [rowId];
  const seen = new Set<PermissionString>();

  while (queue.length > 0) {
    const currentRowId = queue.shift();
    if (!currentRowId || seen.has(currentRowId)) continue;
    seen.add(currentRowId);

    for (const dependentRowId of dependentsByRowId.get(currentRowId) ?? []) {
      const dependentSelection = nextState[dependentRowId] ?? DISABLED_SELECTION;
      if (!isSelectionEnabled(dependentSelection)) continue;

      nextState[dependentRowId] = DISABLED_SELECTION;
      queue.push(dependentRowId);
    }
  }

  return nextState;
};
