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

import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { observer } from "mobx-react";
// plane imports
import { getConditionClauseLabel, getPermissionGroupsByNamespace } from "@plane/constants";
import type { PermissionMatrixGroup } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { IconButton } from "@plane/propel/icon-button";
import { CheckIcon, CloseIcon } from "@plane/propel/icons";
import { Tooltip } from "@plane/propel/tooltip";
import type { PermissionMatrixState, PermissionNamespace, PermissionSelection } from "@plane/types";
import { EModalPosition, EModalWidth, ModalCore } from "@plane/ui";
import { cn, permissionsToMatrixState } from "@plane/utils";
// hooks
import { usePermissionGroupAccess } from "@/hooks/permissions/use-permission-group-access";
import { useRoleManagement } from "@/hooks/store/use-role-management";

type Props = {
  isOpen: boolean;
  namespace: PermissionNamespace;
  onClose: () => void;
  workspaceSlug: string;
};

type ComparisonColumn = {
  id: string;
  label: string;
  matrixState: PermissionMatrixState;
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
      <span className="flex shrink-0 items-center justify-center text-secondary">
        <CheckIcon className="size-4" />
      </span>
    );
  }
  // conditional
  const conditionLabel = getConditionClauseLabel(selection.conditions);
  return (
    <Tooltip tooltipContent={conditionLabel}>
      <span className="flex shrink-0 cursor-help items-center justify-center gap-1.5 text-body-xs-medium text-secondary">
        Limited
      </span>
    </Tooltip>
  );
};

export const RolesAndPermissionsComparisonModal = observer(function RolesAndPermissionsComparisonModal(props: Props) {
  const { isOpen, namespace, onClose, workspaceSlug } = props;
  // refs
  const containerRef = useRef<HTMLDivElement | null>(null);
  // state
  const [isScrolled, setIsScrolled] = useState(false);
  // plane hooks
  const { t } = useTranslation();
  // store hooks
  const { getProjectRoleIdsByWorkspaceSlug, getWorkspaceRoleIdsByWorkspaceSlug, getRoleDetailsByRoleId } =
    useRoleManagement();
  const { filterGroups } = usePermissionGroupAccess(workspaceSlug, namespace);
  // derived values
  const roleIds =
    namespace === "workspace"
      ? getWorkspaceRoleIdsByWorkspaceSlug(workspaceSlug, "all")
      : namespace === "project"
        ? getProjectRoleIdsByWorkspaceSlug(workspaceSlug, "all")
        : undefined;
  const baseGroups = getPermissionGroupsByNamespace(namespace);
  const groups: PermissionMatrixGroup[] = useMemo(() => filterGroups(baseGroups), [baseGroups, filterGroups]);

  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;
    setIsScrolled(containerRef.current.scrollLeft > 0);
  }, []);

  useEffect(() => {
    const currentRef = containerRef.current;
    if (!currentRef) return;

    currentRef.addEventListener("scroll", handleScroll);
    return () => currentRef.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  useEffect(() => {
    if (!isOpen) {
      setIsScrolled(false);
    }
  }, [isOpen]);

  const columns: ComparisonColumn[] = useMemo(
    () =>
      (roleIds ?? []).map((roleId) => {
        const roleDetails = getRoleDetailsByRoleId(roleId);
        const permissions = roleDetails?.permissions ?? {};

        return {
          id: roleId,
          label: roleDetails?.name ?? "-",
          matrixState: permissionsToMatrixState(permissions, groups),
        };
      }),
    [getRoleDetailsByRoleId, groups, roleIds]
  );

  return (
    <ModalCore isOpen={isOpen} handleClose={onClose} position={EModalPosition.CENTER} width={EModalWidth.VIXL}>
      <div className="flex h-[80vh] max-h-[800px] flex-col pt-5">
        <div className="flex items-center justify-between px-5">
          <h4 className="text-h4-semibold text-primary">
            {t(`workspace_settings.settings.roles_and_permissions.comparison_modal.title.${namespace}`)}
          </h4>
          <IconButton
            variant="ghost"
            size="lg"
            onClick={onClose}
            aria-label="Close modal"
            icon={CloseIcon}
            className="shrink-0"
          />
        </div>
        <div
          ref={containerRef}
          className="horizontal-scrollbar vertical-scrollbar scrollbar-sm mt-4 ml-5 flex-1 overflow-auto"
        >
          <table className="h-full border-collapse border-y border-subtle">
            <thead className="sticky top-0 left-0 z-12">
              <tr>
                <th
                  className={cn(
                    "sticky left-0 z-15 w-93 min-w-93 border border-l-0 border-subtle bg-surface-1 px-2 py-3 text-body-xs-medium text-tertiary",
                    "after:pointer-events-none after:absolute after:top-0 after:right-0 after:h-full after:w-5 after:translate-x-full after:transition-shadow",
                    {
                      "after:shadow-direction-right": isScrolled,
                    }
                  )}
                >
                  {t("workspace_settings.settings.roles_and_permissions.comparison_modal.permissions_header")}
                </th>
                {columns.map((column) => (
                  <th
                    key={column.id}
                    className="w-50 min-w-50 border border-r-0 border-subtle bg-surface-1 px-2 py-3 text-body-xs-medium text-tertiary"
                  >
                    {column.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {groups.map((group) => (
                <Fragment key={group.key}>
                  {/* Group header row */}
                  <tr className="bg-layer-1">
                    <td
                      className={cn(
                        "sticky left-0 z-10 w-93 min-w-93 border-b border-r border-subtle bg-layer-1 px-2 py-2",
                        "text-caption-md-medium text-tertiary",
                        "after:pointer-events-none after:absolute after:top-0 after:right-0 after:h-full after:w-5 after:translate-x-full after:transition-shadow",
                        {
                          "after:shadow-direction-right": isScrolled,
                        }
                      )}
                    >
                      {t(group.titleKey)}
                    </td>
                    {columns.map((column) => (
                      <td
                        key={column.id}
                        className="w-50 min-w-50 border border-r-0 border-subtle bg-layer-1 px-2 py-2"
                      />
                    ))}
                  </tr>
                  {/* Permission rows */}
                  {group.rows.map((row) => (
                    <tr key={row.rowId}>
                      <td
                        className={cn(
                          "sticky left-0 z-10 w-93 min-w-93 border-b border-r border-subtle bg-surface-1 px-2 py-4",
                          "text-body-sm-regular text-primary",
                          "after:pointer-events-none after:absolute after:top-0 after:right-0 after:h-full after:w-5 after:translate-x-full after:transition-shadow",
                          {
                            "after:shadow-direction-right": isScrolled,
                          }
                        )}
                      >
                        {t(row.labelKey)}
                      </td>
                      {columns.map((column) => {
                        const selection = column.matrixState[row.rowId] ?? { mode: "disabled" };
                        return (
                          <td
                            key={column.id}
                            className="w-50 min-w-50 border border-r-0 border-subtle px-2 py-4 text-center"
                          >
                            {renderCell(selection)}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </ModalCore>
  );
});
