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

import { useMemo } from "react";
import { observer } from "mobx-react";
import { Link } from "react-router";
// plane imports
import type { PermissionMatrixGroup } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { Badge } from "@plane/propel/badge";
import type { PermissionScheme } from "@plane/types";
import { permissionsToMatrixState } from "@plane/utils";
import { CustomMenu } from "@plane/ui";

type Props = {
  scheme: PermissionScheme;
  groups: PermissionMatrixGroup[];
  canEdit: boolean;
  canDelete: boolean;
  onEdit: () => void;
  onDelete: () => void;
};

export const SchemeCard = observer(function SchemeCard(props: Props) {
  const { scheme, groups, canEdit, canDelete, onEdit, onDelete } = props;
  // plane hooks
  const { t } = useTranslation();

  // Derive group summary and total permissions count from matrix state
  const { groupSummary, permissionsCount } = useMemo(() => {
    const permissionsDict = Object.fromEntries(scheme.permissions.map((p) => [p, true as const]));
    const matrixState = permissionsToMatrixState(permissionsDict, groups);

    let count = 0;
    const activeGroupTitles: string[] = [];

    for (const group of groups) {
      let groupHasPermission = false;
      for (const row of group.rows) {
        const selection = matrixState[row.rowId];
        if (selection && selection.mode !== "disabled") {
          count++;
          groupHasPermission = true;
        }
      }
      if (groupHasPermission) {
        activeGroupTitles.push(t(group.titleKey));
      }
    }

    return { groupSummary: activeGroupTitles.join(", "), permissionsCount: count };
  }, [scheme.permissions, groups, t]);

  return (
    <Link
      to={`schemes/${scheme.slug}`}
      relative="path"
      className="block border border-subtle px-4 py-3 rounded-lg bg-layer-2 hover:bg-layer-transparent-hover"
    >
      <div className="w-full flex items-center justify-between gap-8">
        <div className="flex flex-col gap-1 min-w-0">
          <h4 className="text-body-sm-medium text-primary">{scheme.name}</h4>
          {(scheme.description || groupSummary) && (
            <p className="text-caption-md-regular text-secondary truncate">{scheme.description || groupSummary}</p>
          )}
        </div>
        <div className="shrink-0 flex items-center gap-3">
          {scheme.is_system && (
            <Badge variant="brand" size="sm">
              System
            </Badge>
          )}
          <Badge variant="neutral" size="sm">
            {permissionsCount} permission{permissionsCount !== 1 ? "s" : ""}
          </Badge>
          {!scheme.is_system && (canEdit || canDelete) && (
            <CustomMenu ellipsis placement="bottom-end" closeOnSelect>
              {canEdit && (
                <CustomMenu.MenuItem
                  onClick={(e: React.MouseEvent) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onEdit();
                  }}
                >
                  Edit permission scheme
                </CustomMenu.MenuItem>
              )}
              {canDelete && (
                <CustomMenu.MenuItem
                  onClick={(e: React.MouseEvent) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onDelete();
                  }}
                >
                  <span className="text-danger-secondary">Delete permission scheme</span>
                </CustomMenu.MenuItem>
              )}
            </CustomMenu>
          )}
        </div>
      </div>
    </Link>
  );
});
