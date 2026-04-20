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
import type { PermissionCondition, PermissionSelection } from "@plane/types";

export type TPermissionRowDraft = {
  enabled: boolean;
  conditions: PermissionCondition[];
};

const sortUniqueConditions = (conditions: readonly PermissionCondition[]): PermissionCondition[] =>
  [...new Set(conditions)].sort((a, b) => a.localeCompare(b));

export const sanitizeConditionsForRow = (
  conditions: readonly PermissionCondition[],
  row: PermissionMatrixRow
): PermissionCondition[] => {
  const allowed = new Set(row.conditions);
  return sortUniqueConditions(conditions).filter((condition) => allowed.has(condition));
};

export const selectionToRowDraft = (selection: PermissionSelection, row: PermissionMatrixRow): TPermissionRowDraft => {
  if (selection.mode === "disabled") return { enabled: false, conditions: [] };
  if (selection.mode === "all") return { enabled: true, conditions: [] };
  return { enabled: true, conditions: sanitizeConditionsForRow(selection.conditions, row) };
};

export const rowDraftToSelection = (draft: TPermissionRowDraft, row: PermissionMatrixRow): PermissionSelection => {
  if (!draft.enabled) return { mode: "disabled" };
  const sanitizedConditions = sanitizeConditionsForRow(draft.conditions, row);
  if (sanitizedConditions.length === 0) return { mode: "all" };
  return { mode: "conditional", conditions: sanitizedConditions };
};

export const isSelectionEnabled = (selection: PermissionSelection): boolean => selection.mode !== "disabled";
