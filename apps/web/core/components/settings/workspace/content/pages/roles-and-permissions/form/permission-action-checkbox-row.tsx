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
import type { PermissionMatrixRow } from "@plane/constants";
import { getConditionClauseLabel } from "@plane/constants";
import { InfoIcon } from "@plane/propel/icons";
import { Tooltip } from "@plane/propel/tooltip";
import { Checkbox } from "@plane/ui";
import type { PermissionSelection } from "@plane/types";
import { rowDraftToSelection, sanitizeConditionsForRow, selectionToRowDraft } from "@plane/utils";
// local imports
import { PermissionConditionWhenSection } from "./permission-condition-when-section";

type Props = {
  row: PermissionMatrixRow;
  selection: PermissionSelection;
  isEditing: boolean;
  onSelectionChange: (selection: PermissionSelection) => void;
  t: (key: string) => string;
};

export function PermissionActionCheckboxRow(props: Props) {
  const { row, selection, isEditing, onSelectionChange, t } = props;
  // derived values
  const rowDraft = selectionToRowDraft(selection, row);
  const inputId = `permission-row-${row.rowId}`;

  // "When" section only shows in edit mode when the permission is checked
  const shouldRenderWhenSection = row.conditions.length > 0 && isEditing && rowDraft.enabled;

  // In view mode, show a compact inline label if a condition is active
  const sanitizedConditions = sanitizeConditionsForRow(rowDraft.conditions, row);
  const viewModeConditionLabel =
    !isEditing && rowDraft.enabled && sanitizedConditions.length > 0
      ? getConditionClauseLabel(sanitizedConditions)
      : null;
  const shouldShowFoldedTooltip = Boolean(row.foldTooltipKey);
  const tooltipMessage = row.foldTooltipKey ? t(row.foldTooltipKey) : undefined;

  return (
    <div className="py-2.5">
      <div className="min-w-0 flex items-center gap-2">
        <Checkbox
          id={inputId}
          checked={rowDraft.enabled}
          disabled={!isEditing}
          onChange={(event) => {
            const enabled = event.target.checked;
            onSelectionChange(rowDraftToSelection({ enabled, conditions: rowDraft.conditions }, row));
          }}
        />

        <div className="min-w-0 flex flex-wrap items-center gap-1.5">
          <label
            htmlFor={inputId}
            className="flex min-w-0 cursor-pointer items-center gap-1.5 text-body-sm-regular text-primary"
          >
            <span>{t(row.labelKey)}</span>
          </label>

          {shouldShowFoldedTooltip && (
            <Tooltip tooltipContent={tooltipMessage} position="right" className="max-w-[230px]">
              <button
                type="button"
                className="inline-flex items-center justify-center rounded text-tertiary"
                aria-label="Show folded permissions"
                onClick={(event) => event.preventDefault()}
              >
                <InfoIcon className="h-4 w-4" />
              </button>
            </Tooltip>
          )}

          {viewModeConditionLabel && (
            <span className="text-body-sm-regular text-secondary">{viewModeConditionLabel}</span>
          )}
        </div>
      </div>

      {shouldRenderWhenSection && (
        <PermissionConditionWhenSection
          row={row}
          selectedConditions={rowDraft.conditions}
          onConditionsChange={(conditions) =>
            onSelectionChange(rowDraftToSelection({ enabled: true, conditions }, row))
          }
          t={t}
        />
      )}
    </div>
  );
}
