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

import { Fragment } from "react";
import { observer } from "mobx-react";
// plane imports
import type { PermissionMatrixGroup } from "@plane/constants";
import { getConditionClauseLabel } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { CheckIcon, CloseIcon } from "@plane/propel/icons";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@plane/propel/table";
import { Tooltip } from "@plane/propel/tooltip";
import type { PermissionMatrixState, PermissionSelection } from "@plane/types";

type Props = {
  groups: PermissionMatrixGroup[];
  matrixState: PermissionMatrixState;
  roleLabel: string;
};

const renderCell = (selection: PermissionSelection): React.ReactNode => {
  if (selection.mode === "disabled") {
    return (
      <span className="flex shrink-0 items-center justify-center text-tertiary">
        <CloseIcon className="size-4" />
      </span>
    );
  }
  if (selection.mode === "all") {
    return (
      <span className="flex shrink-0 items-center justify-center text-tertiary">
        <CheckIcon className="size-4" />
      </span>
    );
  }
  const conditionLabel = getConditionClauseLabel(selection.conditions);
  return (
    <Tooltip tooltipContent={conditionLabel}>
      <span className="flex shrink-0 cursor-help items-center justify-center gap-1.5 text-body-xs-medium text-tertiary">
        Limited
      </span>
    </Tooltip>
  );
};

export const PermissionMatrixTable = observer(function PermissionMatrixTable(props: Props) {
  const { groups, matrixState, roleLabel } = props;
  // plane hooks
  const { t } = useTranslation();

  return (
    <div className="overflow-hidden rounded-lg border border-subtle">
      <Table className="border-collapse">
        <TableHeader className="border-0 bg-transparent py-0">
          <TableRow>
            <TableHead className="h-auto w-auto border-0 border-b border-subtle bg-surface-1 px-4 py-3 text-left text-body-xs-medium text-tertiary">
              {t("workspace_settings.settings.permissions.permissions_column")}
            </TableHead>
            <TableHead className="h-auto w-50 min-w-50 border-0 border-b border-subtle bg-surface-1 px-4 py-3 text-center text-body-xs-medium text-tertiary">
              {roleLabel}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {groups.map((group) => (
            <Fragment key={group.key}>
              <TableRow className="bg-layer-1">
                <TableCell className="border-b border-subtle bg-layer-1 px-4 py-2.5 text-caption-md-semibold text-tertiary">
                  {t(group.titleKey)}
                </TableCell>
                <TableCell className="border-b border-subtle bg-layer-1 px-4 py-2.5" />
              </TableRow>
              {group.rows.map((row) => {
                const selection = matrixState[row.rowId] ?? { mode: "disabled" };
                return (
                  <TableRow key={row.rowId}>
                    <TableCell className="border-b border-subtle bg-surface-1 px-4 py-2.5 text-body-xs-regular text-primary">
                      {t(row.labelKey)}
                    </TableCell>
                    <TableCell className="border-b border-subtle px-4 py-2.5 text-center">
                      {renderCell(selection)}
                    </TableCell>
                  </TableRow>
                );
              })}
            </Fragment>
          ))}
        </TableBody>
      </Table>
    </div>
  );
});
