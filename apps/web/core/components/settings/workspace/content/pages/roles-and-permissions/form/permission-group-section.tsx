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
import type { PermissionMatrixGroup } from "@plane/constants";
import type { PermissionMatrixState, PermissionSelection, PermissionString } from "@plane/types";
import { Checkbox } from "@plane/ui";
// local imports
import { PermissionActionCheckboxRow } from "./permission-action-checkbox-row";

type Props = {
  group: PermissionMatrixGroup;
  matrixState: PermissionMatrixState;
  isEditing: boolean;
  searchQuery?: string;
  onRowSelectionChange: (rowId: PermissionString, selection: PermissionSelection) => void;
  onSelectAll: (rowIds: PermissionString[], enable: boolean) => void;
  t: (key: string) => string;
};

const getGroupCheckState = (
  groupRows: PermissionMatrixGroup["rows"],
  matrixState: PermissionMatrixState
): "checked" | "indeterminate" | "unchecked" => {
  const enabledCount = groupRows.filter((row) => (matrixState[row.rowId]?.mode ?? "disabled") !== "disabled").length;
  if (enabledCount === 0) return "unchecked";
  if (enabledCount === groupRows.length) return "checked";
  return "indeterminate";
};

export function PermissionGroupSection(props: Props) {
  const { group, matrixState, isEditing, searchQuery, onRowSelectionChange, onSelectAll, t } = props;
  // derived values
  const visibleRows = searchQuery
    ? group.rows.filter((row) => t(row.labelKey).toLowerCase().includes(searchQuery.toLowerCase()))
    : group.rows;

  if (visibleRows.length === 0) return null;

  const checkState = getGroupCheckState(visibleRows, matrixState);

  return (
    <div className="grid grid-cols-9 gap-8 py-6">
      <div className="col-span-4 flex flex-col gap-y-1.5">
        <h6 className="text-h6-medium">{t(group.titleKey)}</h6>
        <p className="text-body-xs-regular text-secondary">{t(group.descriptionKey)}</p>

        {isEditing && (
          <div className="mt-2 flex items-center gap-2">
            <Checkbox
              id={`select-all-${group.key}`}
              checked={checkState === "checked"}
              indeterminate={checkState === "indeterminate"}
              onChange={() =>
                onSelectAll(
                  visibleRows.map((row) => row.rowId),
                  checkState !== "checked"
                )
              }
            />
            <label
              htmlFor={`select-all-${group.key}`}
              className="cursor-pointer select-none text-body-xs-regular text-tertiary"
            >
              Select All
            </label>
          </div>
        )}
      </div>

      <div className="col-span-5">
        {visibleRows.map((row) => (
          <PermissionActionCheckboxRow
            key={row.rowId}
            row={row}
            selection={matrixState[row.rowId] ?? { mode: "disabled" }}
            isEditing={isEditing}
            onSelectionChange={(selection) => onRowSelectionChange(row.rowId, selection)}
            t={t}
          />
        ))}
      </div>
    </div>
  );
}
